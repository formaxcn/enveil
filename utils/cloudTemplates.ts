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
    enableAutoRelogin: false,
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
    // SAML 登录 URL - 需要用户配置自己的 IdP 登录地址
    // 例如: 'https://login.microsoftonline.com/{tenant-id}/saml2'
    samlUrl: '',
    // 是否启用自动重新登录功能
    enableAutoRelogin: false,
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
        // AWS Console account info containers - targeting ONLY the top-right account dropdown
        // These selectors specifically target the username menu in the top navigation bar
        accountContainers: [
          // Primary: Main account dropdown trigger button in top-right corner
          '[data-testid="nav-username-menu"]',
          '[data-testid="awsc-nav-unified-account-menu-trigger"]',
          '[data-testid="more-menu__awsc-nav-account-menu-button"]',
          '#nav-usernameMenu',
          // The button inside the username menu
          '#nav-usernameMenu button',
          '[data-testid="nav-username-menu-button"]',
          // Alternative selectors for the account display area
          '.awsc-nav-account-info',
          '[data-testid="account-menu-trigger"]',
          '[data-testid="awsc-account-info-tile"]',
          // Fallback: any element with account-related classes
          '[class*="awsui_button-trigger"][class*="account"]'
        ],
        // Console role/account text elements for keyword highlighting
        roleElements: [
          '[data-testid="nav-username-menu"]',
          '[data-testid="awsc-nav-unified-account-menu-trigger"]',
          '#nav-usernameMenu',
          '#nav-usernameMenu button',
          '[data-testid="awsc-account-info-tile"]'
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
    enableAutoRelogin: false,
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
        // AWS Console account info containers - targeting ONLY the top-right account dropdown
        // These selectors specifically target the username menu in the top navigation bar
        accountContainers: [
          // Primary: Main account dropdown trigger button in top-right corner
          '[data-testid="nav-username-menu"]',
          '[data-testid="awsc-nav-unified-account-menu-trigger"]',
          '[data-testid="more-menu__awsc-nav-account-menu-button"]',
          '#nav-usernameMenu',
          // The button inside the username menu
          '#nav-usernameMenu button',
          '[data-testid="nav-username-menu-button"]',
          // Alternative selectors for the account display area
          '.awsc-nav-account-info',
          '[data-testid="account-menu-trigger"]',
          '[data-testid="awsc-account-info-tile"]',
          // Fallback: any element with account-related classes
          '[class*="awsui_button-trigger"][class*="account"]'
        ],
        // Console role/account text elements for keyword highlighting
        roleElements: [
          '[data-testid="nav-username-menu"]',
          '[data-testid="awsc-nav-unified-account-menu-trigger"]',
          '#nav-usernameMenu',
          '#nav-usernameMenu button',
          '[data-testid="awsc-account-info-tile"]'
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