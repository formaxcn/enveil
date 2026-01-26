import { AppConfig, SiteConfig } from './options/types';

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    console.log('Enveil: Content script loaded');

    // Initial check (in case background script doesn't send update immediately on reload/install)
    // However, usually background script handles updates.
    // We primarily listen for messages.

    browser.runtime.onMessage.addListener((message) => {
      if (message.action === 'MATCH_UPDATE') {
        const site = message.site as SiteConfig | null;
        if (site) {
          console.log('[Enveil Content] Received MATCH_UPDATE: Match found', site);
          mountUI(site);
        } else {
          console.log('[Enveil Content] Received MATCH_UPDATE: No match, unmounting UI');
          unmountUI();
        }
      }
    });
  },
});

let shadowHost: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;

function mountUI(site: SiteConfig) {
  // Ensure host exists
  if (!shadowHost) {
    shadowHost = document.createElement('div');
    shadowHost.id = 'enveil-host';
    shadowHost.style.position = 'fixed'; // Ensure it doesn't affect flow
    shadowHost.style.zIndex = '2147483647'; // Max z-index
    shadowHost.style.top = '0';
    shadowHost.style.left = '0';
    shadowHost.style.width = '0';
    shadowHost.style.height = '0';
    shadowHost.style.pointerEvents = 'none'; // Passthrough
    document.documentElement.appendChild(shadowHost);
    shadowRoot = shadowHost.attachShadow({ mode: 'open' });
  }

  if (!shadowRoot) return;

  // Clear existing content
  shadowRoot.innerHTML = '';

  // Apply Banner
  if (site.flagEnable) {
    const banner = createBanner(site);
    shadowRoot.appendChild(banner);
  }

  // Apply Overlay
  if (site.backgroudEnable) {
    const overlay = createOverlay(site);
    shadowRoot.appendChild(overlay);
  }
}

function unmountUI() {
  if (shadowHost) {
    shadowHost.remove();
    shadowHost = null;
    shadowRoot = null;
  }
}

function createBanner(site: SiteConfig): HTMLElement {
  const container = document.createElement('div');
  const ribbon = document.createElement('div');

  ribbon.textContent = site.envName;

  // Container Styles (The box in the corner)
  Object.assign(container.style, {
    position: 'fixed',
    zIndex: '2147483647',
    width: '150px',
    height: '150px',
    overflow: 'hidden',
    pointerEvents: 'none',
  });

  // Ribbon Styles (The rotated strip)
  Object.assign(ribbon.style, {
    position: 'absolute',
    padding: '8px 0',
    width: '220px',
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: '900',
    color: '#fff',
    backgroundColor: site.color,
    boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    lineHeight: '1',
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  // Position Logic
  switch (site.Position) {
    case 'leftTop':
      container.style.top = '0';
      container.style.left = '0';
      ribbon.style.top = '32px';
      ribbon.style.left = '-65px';
      ribbon.style.transform = 'rotate(-45deg)';
      break;
    case 'rightTop':
      container.style.top = '0';
      container.style.right = '0';
      ribbon.style.top = '32px';
      ribbon.style.right = '-65px';
      ribbon.style.transform = 'rotate(45deg)';
      break;
    case 'leftBottom':
      container.style.bottom = '0';
      container.style.left = '0';
      ribbon.style.bottom = '32px';
      ribbon.style.left = '-65px';
      ribbon.style.transform = 'rotate(45deg)';
      break;
    case 'rightBottom':
      container.style.bottom = '0';
      container.style.right = '0';
      ribbon.style.bottom = '32px';
      ribbon.style.right = '-65px';
      ribbon.style.transform = 'rotate(-45deg)';
      break;
  }

  container.appendChild(ribbon);
  return container;
}

function createOverlay(site: SiteConfig): HTMLElement {
  const overlay = document.createElement('div');

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

  return overlay;
}
