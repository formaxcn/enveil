import { AppConfig, SiteConfig, CloudEnvironment, CloudAccount, CloudRole } from './options/types';
import { Matcher } from '../utils/matcher';
import { CloudMatcher } from '../utils/cloudMatcher';

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
  browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === 'sync' && changes.appConfig) {
      console.log('[Enveil Background] Config changed, re-evaluating all tabs');
      const tabs = await browser.tabs.query({});
      for (const tab of tabs) {
        if (tab.id && tab.url) {
          await checkAndNotifyTab(tab.id, tab.url);
        }
      }
    }
  });
});

async function checkAndNotifyTab(tabId: number, url: string) {
  // 1. Get Config
  const config = await loadConfig();
  if (!config || !config.settings) {
    await updateTabState(tabId, null, null);
    return;
  }

  // 2. Parse Host
  let host = '';
  try {
    host = new URL(url).host;
  } catch (e) {
    await updateTabState(tabId, null, null);
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

  // 4. Find Cloud Account Match (new functionality)
  let matchedCloudAccount: CloudAccount | null = null;

  if (config.cloudEnvironments) {
    for (const environment of config.cloudEnvironments) {
      if (!environment.enable) continue;

      const matchingAccounts = CloudMatcher.findMatchingAccounts(environment, url, host);
      if (matchingAccounts.length > 0) {
        // Use the first matching account (could be enhanced to handle multiple matches)
        matchedCloudAccount = matchingAccounts[0];
        console.log(`[Enveil Background] Found cloud account match:`, CloudMatcher.getCloudAccountMatchInfo(matchedCloudAccount));
        break;
      }
    }
  }

  // 5. Update State
  await updateTabState(tabId, matchedSite, matchedCloudAccount);
}

async function updateTabState(tabId: number, site: SiteConfig | null, cloudAccount: CloudAccount | null) {
  // Update Icon - prioritize site match over cloud account match
  const hasMatch = !!site || !!cloudAccount;
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
    // Find matching roles for the cloud account if we have one
    let matchingRoles: CloudRole[] = [];
    if (cloudAccount && cloudAccount.roles && cloudAccount.roles.length > 0) {
      // Get page content to match against roles - we'll let the content script handle this
      // For now, just send all enabled roles and let content script do the keyword matching
      matchingRoles = cloudAccount.roles.filter(role => role.enable);
    }

    await browser.tabs.sendMessage(tabId, {
      action: 'CLOUD_MATCH_UPDATE',
      cloudAccount: cloudAccount,
      cloudRoles: matchingRoles
    });
    
    if (cloudAccount) {
      console.log(`[Enveil Background] Sent CLOUD_MATCH_UPDATE to tab ${tabId} (cloud):`, CloudMatcher.getCloudAccountMatchInfo(cloudAccount));
      if (matchingRoles.length > 0) {
        console.log(`[Enveil Background] Sent ${matchingRoles.length} cloud roles for keyword matching`);
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
    const result = await browser.storage.sync.get(['appConfig']);
    return result.appConfig as AppConfig;
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
