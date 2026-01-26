import { AppConfig, SiteConfig } from './options/types';
import { Matcher } from '../utils/matcher';

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
    await updateTabState(tabId, null);
    return;
  }

  // 2. Parse Host
  let host = '';
  try {
    host = new URL(url).host;
  } catch (e) {
    await updateTabState(tabId, null);
    return;
  }

  // 3. Find Match
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

  // 4. Update State
  await updateTabState(tabId, matchedSite);
}

async function updateTabState(tabId: number, site: SiteConfig | null) {
  // Update Icon
  await setIconForTab(tabId, !!site);

  // Notify Content Script
  try {
    await browser.tabs.sendMessage(tabId, {
      action: 'MATCH_UPDATE',
      site: site
    });
    console.log(`[Enveil Background] Sent MATCH_UPDATE to tab ${tabId}:`, site ? Matcher.getMatchInfo(site) : 'No Match');
  } catch (error) {
    // Content script might not be ready or injected on some pages (e.g. chrome://)
    // console.debug(`[Enveil Background] Failed to send message to tab ${tabId}`, error);
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
