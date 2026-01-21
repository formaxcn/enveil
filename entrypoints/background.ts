import { AppConfig } from './options/types';
import { Matcher } from '../utils/matcher';

export default defineBackground(() => {
  console.log('Enveil: Background service worker started');

  // Listen for tab updates to check for matches
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Only check when the URL has changed and is fully loaded
    if (changeInfo.status === 'complete' && tab.url) {
      const config = await loadConfig();
      if (!config || !config.settings) return;

      const url = tab.url;
      let host = '';
      try {
        host = new URL(url).host;
      } catch (e) {
        // Not a valid URL (e.g. chrome://)
        return;
      }

      for (const setting of config.settings) {
        if (!setting.enable) continue;

        for (const site of setting.sites) {
          if (site.enable && Matcher.isMatch(site, url, host)) {
            console.log(`[Enveil Background] Tab ${tabId} Matched: ${Matcher.getMatchInfo(site)}`);
          }
        }
      }
    }
  });
});

async function loadConfig(): Promise<AppConfig | null> {
  try {
    const result = await browser.storage.sync.get(['appConfig']);
    return result.appConfig as AppConfig;
  } catch (error) {
    console.error('Enveil: Failed to load config in background', error);
    return null;
  }
}
