import { AppConfig, SiteConfig, CloudEnvironment, CloudAccount, CloudRole } from './options/types';
import { Matcher } from '../utils/matcher';
import { CloudMatcher } from '../utils/cloudMatcher';
import { storage } from 'wxt/utils/storage';

export default defineBackground(() => {
  console.log('Enveil: Background service worker started');

  // Listen for tab updates to check for matches
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // We check if status is complete OR if a URL change is detected (for SPAs)
    if ((changeInfo.status === 'complete' || changeInfo.url) && tab.url) {
      await checkAndNotifyTab(tabId, tab.url);
    }
  });

  // Listen for tab activation to update icon when switching tabs
  browser.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await browser.tabs.get(activeInfo.tabId);
    if (tab.url) {
      await checkAndNotifyTab(tab.id!, tab.url);
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
