import { CloudProvider, CloudTemplate } from '../entrypoints/options/types';

/**
 * Hardcoded cloud templates for quick setup
 * These templates provide pre-configured settings for common cloud providers
 */
export const HARDCODED_CLOUD_TEMPLATES: Record<CloudProvider, CloudTemplate> = {
  [CloudProvider.AWS_CN]: {
    provider: CloudProvider.AWS_CN,
    name: 'AWS China',
    accountSelectionUrl: 'https://signin.amazonaws.cn/saml',
    consoleDomainPattern: '*://*.amazonaws.cn/*',
    samlUrl: 'https://signin.amazonaws.cn/saml',
    selectors: {
      accountSelection: {
        // AWS CN SAML account selection containers
        accountContainers: [
          'fieldset > div.saml-account',
          '.saml-account-name',
          '[data-testid="account-list-item"]'
        ],
        // Role text elements for keyword matching
        roleElements: [
          '.saml-role-name',
          '.saml-role-description',
          'fieldset > div.saml-account .saml-role-name',
          '[data-testid="role-name"]'
        ]
      },
      console: {
        // AWS Console account info containers
        accountContainers: [
          '#nav-usernav-popover',
          '.awsc-username-display',
          '[data-testid="account-detail-menu"]',
          '#awsc-username-menu-recent-usernames'
        ],
        // Console role/account text elements
        roleElements: [
          '.awsc-username-display .awsc-username',
          '#nav-usernav-popover .nav-elt-label',
          '[data-testid="current-user-name"]',
          '.awsc-role-display-name'
        ]
      }
    }
  },
  [CloudProvider.AWS_GLOBAL]: {
    provider: CloudProvider.AWS_GLOBAL,
    name: 'AWS Global',
    accountSelectionUrl: 'https://signin.aws.amazon.com/saml',
    consoleDomainPattern: '*://*.aws.amazon.com/*',
    samlUrl: 'https://signin.aws.amazon.com/saml',
    selectors: {
      accountSelection: {
        accountContainers: [
          'fieldset > div.saml-account',
          '.saml-account-name',
          '[data-testid="account-list-item"]'
        ],
        roleElements: [
          '.saml-role-name',
          '.saml-role-description',
          'fieldset > div.saml-account .saml-role-name',
          '[data-testid="role-name"]'
        ]
      },
      console: {
        accountContainers: [
          '#nav-usernav-popover',
          '.awsc-username-display',
          '[data-testid="account-detail-menu"]',
          '#awsc-username-menu-recent-usernames'
        ],
        roleElements: [
          '.awsc-username-display .awsc-username',
          '#nav-usernav-popover .nav-elt-label',
          '[data-testid="current-user-name"]',
          '.awsc-role-display-name'
        ]
      }
    }
  },
  [CloudProvider.AZURE]: {
    provider: CloudProvider.AZURE,
    name: 'Microsoft Azure',
    accountSelectionUrl: 'https://portal.azure.com',
    consoleDomainPattern: '*://*.azure.com/*',
    samlUrl: 'https://login.microsoftonline.com',
    selectors: {
      accountSelection: {
        accountContainers: [
          '.tenant-picker-item',
          '[data-automation-id="tenant-switcher-item"]',
          '.directory-item'
        ],
        roleElements: [
          '.tenant-name',
          '.directory-name',
          '[data-automation-id="tenant-name"]'
        ]
      },
      console: {
        accountContainers: [
          '#meControl',
          '.fxs-topbar-user',
          '[data-automation-id="user-menu"]'
        ],
        roleElements: [
          '.fxs-topbar-user-name',
          '.user-display-name',
          '[data-automation-id="user-name"]'
        ]
      }
    }
  },
  [CloudProvider.GCP]: {
    provider: CloudProvider.GCP,
    name: 'Google Cloud Platform',
    accountSelectionUrl: 'https://console.cloud.google.com',
    consoleDomainPattern: '*://*.cloud.google.com/*',
    samlUrl: 'https://accounts.google.com',
    selectors: {
      accountSelection: {
        accountContainers: [
          '.cfc-project-switcher-item',
          '[data-value*="project"]',
          '.p6n-project-switcher-item'
        ],
        roleElements: [
          '.cfc-project-name',
          '.p6n-project-name',
          '[data-automation-id="project-name"]'
        ]
      },
      console: {
        accountContainers: [
          '.gb_Aa',
          '.p6n-header-user-menu',
          '[data-automation-id="user-menu"]'
        ],
        roleElements: [
          '.gb_Ab',
          '.p6n-user-name',
          '[data-automation-id="user-display-name"]'
        ]
      }
    }
  },
  [CloudProvider.CUSTOM]: {
    provider: CloudProvider.CUSTOM,
    name: 'Custom Cloud Provider',
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