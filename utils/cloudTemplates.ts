import { CloudProvider, CloudTemplate } from '../entrypoints/options/types';

/**
 * Hardcoded cloud templates for quick setup
 * These templates provide pre-configured settings for common cloud providers
 */
export const HARDCODED_CLOUD_TEMPLATES: Record<CloudProvider, CloudTemplate> = {
  [CloudProvider.CUSTOM]: {
    provider: CloudProvider.CUSTOM,
    name: 'Custom',
    accountSelectionUrl: '',
    consoleDomainPattern: '',
    samlUrl: '',
    selectors: {
      accountSelection: {
        accountContainers: [],
        roleElements: []
      },
      console: {
        accountContainers: [],
        roleElements: []
      }
    }
  },
  [CloudProvider.AWS_CN]: {
    provider: CloudProvider.AWS_CN,
    name: 'AWS China',
    accountSelectionUrl: 'https://signin.amazonaws.cn/saml',
    consoleDomainPattern: '*://*.amazonaws.cn/*',
    samlUrl: '',
    selectors: {
      accountSelection: {
        // AWS CN SAML account selection containers
        // Match div.saml-account that:
        // 1. Is a direct child of fieldset
        // 2. Contains a .saml-account-name child (to exclude nested role containers)
        accountContainers: [
          'fieldset > div.saml-account:has(> .expandable-container .saml-account-name)'
        ],
        // Role text elements for keyword matching
        roleElements: [
          '.saml-role-name',
          '.saml-role-description',
          'label.saml-role'
        ]
      },
      console: {
        // AWS Console account info containers - targeting the account display area
        // These selectors target the top navigation bar account info section
        accountContainers: [
          // Main account dropdown trigger in top navigation
          '#nav-usernameMenu',
          '[data-testid="nav-username-menu"]',
          // Account detail menu popover
          '#nav-usernav-popover',
          '[data-testid="account-detail-menu"]',
          // Username display elements
          '.awsc-username-display',
          '[data-testid="current-user-name"]',
          // Account info section in navigation
          '.awsc-nav-account-info',
          '[data-testid="account-info-section"]',
          // Recent usernames section
          '#awsc-username-menu-recent-usernames',
          // Top bar account selector
          '.globalNav-2D-',
          '[data-testid="global-nav-account-selector"]'
        ],
        // Console role/account text elements for keyword highlighting
        roleElements: [
          '.awsc-username-display .awsc-username',
          '#nav-usernav-popover .nav-elt-label',
          '[data-testid="current-user-name"]',
          '.awsc-role-display-name',
          '.awsc-account-name',
          '[data-testid="account-name"]'
        ]
      }
    }
  },
  [CloudProvider.AWS_GLOBAL]: {
    provider: CloudProvider.AWS_GLOBAL,
    name: 'AWS Global',
    accountSelectionUrl: 'https://signin.aws.amazon.com/saml',
    consoleDomainPattern: '*://*.aws.amazon.com/*',
    samlUrl: '',
    selectors: {
      accountSelection: {
        // Match div.saml-account that:
        // 1. Is a direct child of fieldset
        // 2. Contains a .saml-account-name child (to exclude nested role containers)
        accountContainers: [
          'fieldset > div.saml-account:has(> .expandable-container .saml-account-name)'
        ],
        roleElements: [
          '.saml-role-name',
          '.saml-role-description',
          'label.saml-role'
        ]
      },
      console: {
        // AWS Console account info containers - targeting the account display area
        // These selectors target the top navigation bar account info section
        accountContainers: [
          // Main account dropdown trigger in top navigation
          '#nav-usernameMenu',
          '[data-testid="nav-username-menu"]',
          // Account detail menu popover
          '#nav-usernav-popover',
          '[data-testid="account-detail-menu"]',
          // Username display elements
          '.awsc-username-display',
          '[data-testid="current-user-name"]',
          // Account info section in navigation
          '.awsc-nav-account-info',
          '[data-testid="account-info-section"]',
          // Recent usernames section
          '#awsc-username-menu-recent-usernames',
          // Top bar account selector
          '.globalNav-2D-',
          '[data-testid="global-nav-account-selector"]'
        ],
        // Console role/account text elements for keyword highlighting
        roleElements: [
          '.awsc-username-display .awsc-username',
          '#nav-usernav-popover .nav-elt-label',
          '[data-testid="current-user-name"]',
          '.awsc-role-display-name',
          '.awsc-account-name',
          '[data-testid="account-name"]'
        ]
      }
    }
  }
};

/**
 * Get template by provider
 */
export function getCloudTemplate(provider: CloudProvider): CloudTemplate {
  return HARDCODED_CLOUD_TEMPLATES[provider];
}

/**
 * Get all available templates
 */
export function getAllCloudTemplates(): CloudTemplate[] {
  return Object.values(HARDCODED_CLOUD_TEMPLATES);
}

/**
 * Get template names for UI display
 */
export function getCloudTemplateNames(): Record<CloudProvider, string> {
  const names: Record<CloudProvider, string> = {} as Record<CloudProvider, string>;

  Object.entries(HARDCODED_CLOUD_TEMPLATES).forEach(([provider, template]) => {
    names[provider as CloudProvider] = template.name;
  });

  return names;
}