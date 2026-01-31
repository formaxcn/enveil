import { AppConfig, SiteConfig, CloudAccount, CloudRole, CloudEnvironment } from './options/types';
import { CloudHighlighter } from '../components/CloudHighlighter';
import { AccountSelectionHighlighter } from '../components/AccountSelectionHighlighter';
import { CloudMatcher } from '../utils/cloudMatcher';

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    console.log('Enveil: Content script loaded');

    // Initialize cloud highlighters
    const cloudHighlighter = new CloudHighlighter();
    const accountSelectionHighlighter = new AccountSelectionHighlighter();

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
      } else if (message.action === 'CLOUD_MATCH_UPDATE') {
        const cloudAccounts = message.cloudAccounts as CloudAccount[] | null;
        const cloudRoles = message.cloudRoles as CloudRole[] | null;
        const cloudEnvironment = message.cloudEnvironment as CloudEnvironment | null;
        const isAccountSelectionPage = message.isAccountSelectionPage as boolean;

        if (cloudAccounts && cloudAccounts.length > 0) {
          console.log('[Enveil Content] Received CLOUD_MATCH_UPDATE: Cloud matches found', {
            accounts: cloudAccounts.map(acc => acc.name),
            rolesCount: cloudRoles?.length || 0,
            isAccountSelectionPage
          });

          // Use AccountSelectionHighlighter for account selection pages
          if (isAccountSelectionPage && cloudEnvironment) {
            mountAccountSelectionUI(cloudEnvironment, cloudAccounts, cloudRoles, accountSelectionHighlighter);
          } else {
            // Use CloudHighlighter for console pages - pass all matching accounts
            mountCloudUI(cloudAccounts, cloudRoles, cloudHighlighter);
          }
        } else {
          console.log('[Enveil Content] Received CLOUD_MATCH_UPDATE: No cloud match, unmounting cloud UI');
          unmountCloudUI(cloudHighlighter);
          unmountAccountSelectionUI(accountSelectionHighlighter);
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

/**
 * Mounts cloud-specific UI elements (account background highlighting and role text highlighting).
 * Works alongside existing site highlighting without conflicts.
 * Supports multiple matching accounts.
 *
 * @param cloudAccounts Array of cloud account configurations (for background highlighting)
 * @param cloudRoles Array of cloud roles (for text highlighting)
 * @param cloudHighlighter The CloudHighlighter instance
 */
function mountCloudUI(cloudAccounts: CloudAccount[], cloudRoles: CloudRole[] | null, cloudHighlighter: CloudHighlighter) {
  // Remove any existing cloud highlighting first
  cloudHighlighter.removeHighlighting();

  // Apply account-level background highlighting for all matching accounts
  // Use the first account's background color as the primary highlight
  for (const cloudAccount of cloudAccounts) {
    if (cloudAccount.backgroundEnable) {
      cloudHighlighter.applyAccountHighlighting(cloudAccount);
    }
  }

  // Apply role-level text highlighting if roles are provided
  if (cloudRoles && cloudRoles.length > 0) {
    // Wait a bit for DOM to be ready, then apply role highlighting
    setTimeout(() => {
      cloudHighlighter.applyRoleHighlighting(cloudRoles);
    }, 100);
  }
}

/**
 * Unmounts cloud-specific UI elements.
 * 
 * @param cloudHighlighter The CloudHighlighter instance
 */
function unmountCloudUI(cloudHighlighter: CloudHighlighter) {
  cloudHighlighter.removeHighlighting();
}

/**
 * Mounts account selection page highlighting.
 * Supports multiple matching accounts.
 *
 * @param environment The cloud environment configuration
 * @param accounts Array of matched cloud accounts
 * @param roles Array of cloud roles
 * @param highlighter The AccountSelectionHighlighter instance
 */
function mountAccountSelectionUI(
  environment: CloudEnvironment,
  accounts: CloudAccount[],
  roles: CloudRole[] | null,
  highlighter: AccountSelectionHighlighter
) {
  // Remove existing highlighting first
  highlighter.removeHighlighting();

  // Highlight all matching accounts (not just all enabled accounts in environment)
  if (accounts.length > 0) {
    // Wait for DOM to be ready, then apply highlighting
    setTimeout(() => {
      highlighter.applyHighlighting(environment, accounts);
    }, 100);
  }
}

/**
 * Unmounts account selection page highlighting.
 * 
 * @param highlighter The AccountSelectionHighlighter instance
 */
function unmountAccountSelectionUI(highlighter: AccountSelectionHighlighter) {
  highlighter.removeHighlighting();
}
