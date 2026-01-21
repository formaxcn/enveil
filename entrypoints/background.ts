import { AppConfig } from './options/types';
import { Matcher } from '../utils/matcher';

export default defineBackground(() => {
  console.log('Enveil: Background service worker started');

  // Listen for tab updates to check for matches
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // We check if status is complete OR if a URL change is detected (for SPAs)
    if ((changeInfo.status === 'complete' || changeInfo.url) && tab.url) {
      console.log(`[Enveil Background] Checking tab ${tabId}: ${tab.url}`);

      const config = await loadConfig();
      if (!config || !config.settings) {
        console.log('[Enveil Background] No config found or settings empty');
        return;
      }

      const url = tab.url;
      let host = '';
      try {
        host = new URL(url).host;
      } catch (e) {
        return;
      }

      let matchFound = false;
      for (const setting of config.settings) {
        if (!setting.enable) {
          console.log(`[Enveil Background] Skipping group "${setting.name}" because it is disabled.`);
          continue;
        }

        for (const site of setting.sites) {
          console.log(`[Enveil Background] Checking site rule: ${site.envName} (${site.matchPattern}: ${site.matchValue}), site.enable: ${site.enable}`);
          if (site.enable && Matcher.isMatch(site, url, host)) {
            console.log(`[Enveil Background] Match Found for tab ${tabId}: ${Matcher.getMatchInfo(site)}`);
            matchFound = true;
          }
        }
      }

      if (!matchFound) {
        // Optional: log when no match is found for debugging
        // console.log(`[Enveil Background] No match for ${url}`);
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
