import { AppConfig, SiteConfig, CloudEnvironment, CloudAccount, CloudRole } from './options/types';
import { Matcher } from '../utils/matcher';
import { CloudMatcher } from '../utils/cloudMatcher';
import { storage } from 'wxt/utils/storage';

// Magic Relogin 状态存储
interface MagicReloginState {
  sourceTabId: number;
  sourceUrl: string;
  accountId?: string;
  roleArn?: string;
  samlTabId?: number;
  isWaitingForLogin: boolean;
}

let magicReloginState: MagicReloginState | null = null;

export default defineBackground(() => {
  console.log('Enveil: Background service worker started');

  // Listen for tab updates to check for matches
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // We check if status is complete OR if a URL change is detected (for SPAs)
    if ((changeInfo.status === 'complete' || changeInfo.url) && tab.url) {
      await checkAndNotifyTab(tabId, tab.url);

      // 检查是否是 Magic Relogin 流程中的 SAML 页面
      await checkMagicReloginSamlPage(tabId, tab.url);
    }
  });

  // Listen for tab activation to update icon when switching tabs
  browser.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await browser.tabs.get(activeInfo.tabId);
    if (tab.url) {
      await checkAndNotifyTab(tab.id!, tab.url);
    }
  });

  // Listen for tab removal (用户关闭 SAML 登录页)
  browser.tabs.onRemoved.addListener(async (tabId) => {
    if (magicReloginState?.samlTabId === tabId) {
      console.log('[Enveil Background] SAML tab closed, cleaning up relogin state');
      magicReloginState = null;
      await browser.storage.local.remove('enveil_magic_relogin_state');
    }
  });

  // Listen for messages from content scripts
  browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message.action === 'MAGIC_RELOGIN_START') {
      console.log('[Enveil Background] Received MAGIC_RELOGIN_START:', message);

      // 保存源标签页信息
      const sourceTabId = sender.tab?.id;
      if (!sourceTabId) {
        console.error('[Enveil Background] No source tab ID');
        return { success: false, error: 'No source tab ID' };
      }

      // 保存状态
      magicReloginState = {
        sourceTabId: sourceTabId,
        sourceUrl: message.sourceUrl,
        accountId: message.accountId,
        roleArn: message.roleArn,
        isWaitingForLogin: true
      };

      // 保存到 storage
      await browser.storage.local.set({
        'enveil_magic_relogin_state': magicReloginState
      });

      // 打开 SAML 登录页面
      try {
        const samlTab = await browser.tabs.create({
          url: message.samlUrl,
          active: true
        });

        if (samlTab.id) {
          magicReloginState.samlTabId = samlTab.id;

          // 更新 storage
          await browser.storage.local.set({
            'enveil_magic_relogin_state': magicReloginState
          });

          console.log('[Enveil Background] Opened SAML tab:', samlTab.id);
          return { success: true, samlTabId: samlTab.id };
        }
      } catch (error) {
        console.error('[Enveil Background] Failed to open SAML tab:', error);
        return { success: false, error: String(error) };
      }
    }

    if (message.action === 'MAGIC_RELOGIN_SUCCESS') {
      console.log('[Enveil Background] Received MAGIC_RELOGIN_SUCCESS');

      // 重新登录成功，刷新源页面
      if (magicReloginState?.sourceTabId) {
        try {
          // 发送消息给源页面的 content script 刷新页面
          await browser.tabs.sendMessage(magicReloginState.sourceTabId, {
            action: 'MAGIC_RELOGIN_REFRESH_SOURCE'
          });
          console.log('[Enveil Background] Sent refresh message to source tab:', magicReloginState.sourceTabId);
        } catch (error) {
          console.error('[Enveil Background] Failed to send refresh message:', error);

          // 如果消息发送失败，直接刷新标签页
          try {
            await browser.tabs.reload(magicReloginState.sourceTabId);
            console.log('[Enveil Background] Reloaded source tab directly');
          } catch (reloadError) {
            console.error('[Enveil Background] Failed to reload source tab:', reloadError);
          }
        }

        // 清理状态
        magicReloginState = null;
        await browser.storage.local.remove('enveil_magic_relogin_state');
      }

      return { success: true };
    }
  });

  // Listen for configuration changes
  storage.watch<AppConfig>('sync:appConfig', async (newConfig) => {
    console.log('[Enveil Background] Config changed via WXT Storage, re-evaluating all tabs');
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url) {
        await checkAndNotifyTab(tab.id, tab.url);
      }
    }
  });
});

/**
 * 检查是否是 Magic Relogin 流程中的 SAML 页面
 * 如果是，更新状态中的 samlTabId
 */
async function checkMagicReloginSamlPage(tabId: number, url: string): Promise<void> {
  // 检查是否是 SAML 登录页面
  const isSamlPage = url.includes('signin.amazonaws.cn/saml') ||
                     url.includes('signin.aws.amazon.com/saml');

  if (isSamlPage && magicReloginState?.isWaitingForLogin) {
    // 检查是否是从 Magic Relogin 打开的
    const state = await browser.storage.local.get('enveil_magic_relogin_state');
    const savedState = state['enveil_magic_relogin_state'] as MagicReloginState | undefined;

    if (savedState?.isWaitingForLogin && !savedState.samlTabId) {
      // 更新 SAML tab ID
      magicReloginState.samlTabId = tabId;
      savedState.samlTabId = tabId;

      await browser.storage.local.set({
        'enveil_magic_relogin_state': savedState
      });

      console.log('[Enveil Background] Updated SAML tab ID:', tabId);
    }
  }
}

async function checkAndNotifyTab(tabId: number, url: string) {
  // 1. Get Config
  const config = await loadConfig();
  if (!config || !config.settings) {
    await updateTabState(tabId, null, [], null, false);
    return;
  }

  // 2. Parse Host
  let host = '';
  try {
    host = new URL(url).host;
  } catch (e) {
    await updateTabState(tabId, null, [], null, false);
    return;
  }

  // 3. Find Site Match (existing functionality)
  let matchedSite: SiteConfig | null = null;

  for (const setting of config.settings) {
    if (!setting.enable) continue;

    for (const site of setting.sites) {
      if (site.enable && Matcher.isMatch(site, url, host)) {
        matchedSite = site;
        break;
      }
    }
    if (matchedSite) break;
  }

  // 4. Find Cloud Account Matches (new functionality)
  let matchedCloudAccounts: CloudAccount[] = [];
  let matchedCloudEnvironment: CloudEnvironment | null = null;
  let isAccountSelectionPage = false;

  if (config.cloudEnvironments) {
    for (const environment of config.cloudEnvironments) {
      if (!environment.enable) continue;

      const matchingAccounts = CloudMatcher.findMatchingAccounts(environment, url, host);
      if (matchingAccounts.length > 0) {
        // Collect all matching accounts from this environment
        matchedCloudAccounts = matchingAccounts;
        matchedCloudEnvironment = environment;
        
        // Check if this is an account selection page
        isAccountSelectionPage = !!(CloudMatcher.isEnvironmentTemplateMatch(environment, url) && 
                                 environment.template?.accountSelectionUrl && 
                                 url.includes(environment.template.accountSelectionUrl));
        
        console.log(`[Enveil Background] Found ${matchingAccounts.length} cloud account matches:`, 
          matchingAccounts.map(acc => CloudMatcher.getCloudAccountMatchInfo(acc)).join(', '));
        console.log(`[Enveil Background] Is account selection page:`, isAccountSelectionPage);
        break;
      }
    }
  }

  // 5. Update State
  await updateTabState(tabId, matchedSite, matchedCloudAccounts, matchedCloudEnvironment, isAccountSelectionPage);
}

async function updateTabState(
  tabId: number,
  site: SiteConfig | null,
  cloudAccounts: CloudAccount[],
  cloudEnvironment: CloudEnvironment | null,
  isAccountSelectionPage: boolean
) {
  // Update Icon - prioritize site match over cloud account match
  const hasMatch = !!site || cloudAccounts.length > 0;
  await setIconForTab(tabId, hasMatch);

  // Notify Content Script for site matches (existing functionality)
  try {
    await browser.tabs.sendMessage(tabId, {
      action: 'MATCH_UPDATE',
      site: site
    });

    if (site) {
      console.log(`[Enveil Background] Sent MATCH_UPDATE to tab ${tabId} (site):`, Matcher.getMatchInfo(site));
    } else {
      console.log(`[Enveil Background] Sent MATCH_UPDATE to tab ${tabId}: No site match`);
    }
  } catch (error) {
    // Content script might not be ready or injected on some pages (e.g. chrome://)
    // console.debug(`[Enveil Background] Failed to send site message to tab ${tabId}`, error);
  }

  // Notify Content Script for cloud matches (new functionality)
  try {
    // Collect all roles from all matching accounts
    let allMatchingRoles: CloudRole[] = [];
    for (const account of cloudAccounts) {
      if (account.roles && account.roles.length > 0) {
        allMatchingRoles = allMatchingRoles.concat(account.roles.filter(role => role.enable));
      }
    }

    await browser.tabs.sendMessage(tabId, {
      action: 'CLOUD_MATCH_UPDATE',
      cloudAccounts: cloudAccounts,
      cloudRoles: allMatchingRoles,
      cloudEnvironment: cloudEnvironment,
      isAccountSelectionPage: isAccountSelectionPage
    });

    if (cloudAccounts.length > 0) {
      console.log(`[Enveil Background] Sent CLOUD_MATCH_UPDATE to tab ${tabId} with ${cloudAccounts.length} accounts (cloud):`,
        cloudAccounts.map(acc => CloudMatcher.getCloudAccountMatchInfo(acc)).join(', '));
      if (allMatchingRoles.length > 0) {
        console.log(`[Enveil Background] Sent ${allMatchingRoles.length} cloud roles for keyword matching`);
      }
    } else {
      console.log(`[Enveil Background] Sent CLOUD_MATCH_UPDATE to tab ${tabId}: No cloud match`);
    }
  } catch (error) {
    // Content script might not be ready or injected on some pages (e.g. chrome://)
    // console.debug(`[Enveil Background] Failed to send cloud message to tab ${tabId}`, error);
  }
}

async function loadConfig(): Promise<AppConfig | null> {
  try {
    return await storage.getItem<AppConfig>('sync:appConfig');
  } catch (error) {
    console.error('Enveil: Failed to load config in background', error);
    return null;
  }
}

async function setIconForTab(tabId: number, isMatch: boolean): Promise<void> {
  const iconPath = isMatch ? {
    "16": "icon/16.png",
    "32": "icon/32.png",
    "48": "icon/48.png",
    "96": "icon/96.png",
    "128": "icon/128.png"
  } : {
    "16": "icon/16-gray.png",
    "32": "icon/32-gray.png",
    "48": "icon/48-gray.png",
    "96": "icon/96-gray.png",
    "128": "icon/128-gray.png"
  };

  try {
    await browser.action.setIcon({
      tabId: tabId,
      path: iconPath
    });
  } catch (error) {
    console.error(`[Enveil Background] Failed to set icon for tab ${tabId}:`, error);
  }
}
