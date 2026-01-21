import { AppConfig, SiteConfig } from './options/types';

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    console.log('Enveil: Content script loaded');

    // Load configuration
    const config = await loadConfig();
    if (!config || !config.settings) return;

    // Check all enabled settings and sites
    for (const setting of config.settings) {
      if (!setting.enable) continue;

      for (const site of setting.sites) {
        if (site.enable && isMatch(site)) {
          applySiteUI(site);
        }
      }
    }

    // Listen for messages from popup/options
    browser.runtime.onMessage.addListener((request: any, sender: any, sendResponse: any) => {
      if (request.action === 'addCurrentSite') {
        console.log('Add current site requested');
        sendResponse({ status: 'success' });
      }
      return true;
    });
  },
});

async function loadConfig(): Promise<AppConfig | null> {
  try {
    const result = await browser.storage.sync.get(['appConfig']);
    return result.appConfig as AppConfig;
  } catch (error) {
    console.error('Enveil: Failed to load config', error);
    return null;
  }
}

function isMatch(site: SiteConfig): boolean {
  const url = window.location.href;
  const host = window.location.host;

  switch (site.matchPattern) {
    case 'everything':
      console.log(`[Enveil] Everything match: ${site.envName}`);
      return true;
    case 'domain':
      const matches = host === site.matchValue || host.endsWith('.' + site.matchValue);
      if (matches) {
        console.log(`[Enveil] Domain match: ${site.matchValue} matched ${host} (${site.envName})`);
      }
      return matches;
    case 'urlPrefix':
      const prefixMatches = url.startsWith(site.matchValue);
      if (prefixMatches) {
        console.log(`[Enveil] URL Prefix match: ${site.matchValue} matched ${url} (${site.envName})`);
      }
      return prefixMatches;
    case 'url':
      const exactMatches = url === site.matchValue;
      if (exactMatches) {
        console.log(`[Enveil] Exact URL match: ${site.matchValue} (${site.envName})`);
      }
      return exactMatches;
    case 'regex':
      try {
        const regex = new RegExp(site.matchValue);
        const regexMatches = regex.test(url);
        if (regexMatches) {
          console.log(`[Enveil] Regex match: ${site.matchValue} matched ${url} (${site.envName})`);
        }
        return regexMatches;
      } catch (e) {
        console.error('[Enveil] Invalid regex:', site.matchValue);
        return false;
      }
    default:
      return false;
  }
}

function applySiteUI(site: SiteConfig) {
  if (site.flagEnable) {
    createBanner(site);
  }
  if (site.backgroudEnable) {
    createOverlay(site);
  }
}

function createBanner(site: SiteConfig) {
  const banner = document.createElement('div');
  banner.id = 'enveil-banner';
  banner.textContent = site.envName;

  // Base styles
  Object.assign(banner.style, {
    position: 'fixed',
    zIndex: '2147483647',
    padding: '4px 20px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: site.color,
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
    pointerEvents: 'none',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontFamily: 'sans-serif'
  });

  // Position styles
  switch (site.Position) {
    case 'leftTop':
      banner.style.top = '0';
      banner.style.left = '0';
      banner.style.borderRadius = '0 0 4px 0';
      break;
    case 'rightTop':
      banner.style.top = '0';
      banner.style.right = '0';
      banner.style.borderRadius = '0 0 0 4px';
      break;
    case 'leftBottom':
      banner.style.bottom = '0';
      banner.style.left = '0';
      banner.style.borderRadius = '0 4px 0 0';
      break;
    case 'rightBottom':
      banner.style.bottom = '0';
      banner.style.right = '0';
      banner.style.borderRadius = '4px 0 0 0';
      break;
  }

  document.body.appendChild(banner);
}

function createOverlay(site: SiteConfig) {
  const overlay = document.createElement('div');
  overlay.id = 'enveil-overlay';

  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    backgroundColor: site.color,
    opacity: '0.05',
    zIndex: '2147483646',
    pointerEvents: 'none'
  });

  document.body.appendChild(overlay);
}
