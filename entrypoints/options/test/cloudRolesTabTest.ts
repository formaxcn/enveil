import { CloudProvider, CloudEnvironment, CloudAccount, CloudRole, RoleHighlightStyle } from '../types';

/**
 * Test function to create sample cloud environments for testing CloudRolesTab
 */
export function createSampleCloudEnvironments(): CloudEnvironment[] {
  const now = Date.now();

  // Create sample role highlight style
  const defaultRoleStyle: RoleHighlightStyle = {
    textColor: '#ffffff',
    backgroundColor: '#ff0000',
    fontWeight: 'bold',
    textDecoration: 'none',
    border: '1px solid #ff0000'
  };

  // Create sample roles
  const adminRole: CloudRole = {
    id: 'role-admin-1',
    name: 'Admin Role',
    enable: true,
    keywords: ['admin', 'administrator', 'root'],
    highlightColor: '#ff0000',
    highlightStyle: defaultRoleStyle,
    created: now,
    modified: now
  };

  const devRole: CloudRole = {
    id: 'role-dev-1',
    name: 'Developer Role',
    enable: true,
    keywords: ['dev', 'developer', 'development'],
    highlightColor: '#00ff00',
    highlightStyle: { ...defaultRoleStyle, backgroundColor: '#00ff00', border: '1px solid #00ff00' },
    created: now,
    modified: now
  };

  const readOnlyRole: CloudRole = {
    id: 'role-readonly-1',
    name: 'ReadOnly Role',
    enable: false,
    keywords: ['readonly', 'read-only', 'viewer'],
    highlightColor: '#0000ff',
    highlightStyle: { ...defaultRoleStyle, backgroundColor: '#0000ff', border: '1px solid #0000ff' },
    created: now,
    modified: now
  };

  // Create sample accounts
  const prodAccount: CloudAccount = {
    id: 'account-prod-1',
    name: 'Production Account',
    enable: true,
    matchPattern: 'domain',
    matchValue: '*.amazonaws.cn/*',
    color: '#ff4444',
    backgroundEnable: true,
    roles: [adminRole, readOnlyRole],
    created: now,
    modified: now
  };

  const devAccount: CloudAccount = {
    id: 'account-dev-1',
    name: 'Development Account',
    enable: true,
    matchPattern: 'domain',
    matchValue: 'dev.amazonaws.cn/*',
    color: '#44ff44',
    backgroundEnable: true,
    roles: [devRole],
    created: now,
    modified: now
  };

  const testAccount: CloudAccount = {
    id: 'account-test-1',
    name: 'Test Account',
    enable: false,
    matchPattern: 'domain',
    matchValue: 'test.amazonaws.cn/*',
    color: '#4444ff',
    backgroundEnable: false,
    roles: [],
    created: now,
    modified: now
  };

  // Create sample environments
  const awsCnEnv: CloudEnvironment = {
    id: 'env-aws-cn-1',
    name: 'AWS China',
    enable: true,
    provider: CloudProvider.AWS_CN,
    template: {
      provider: CloudProvider.AWS_CN,
      name: 'AWS China',
      accountSelectionUrl: 'https://signin.amazonaws.cn/saml',
      consoleDomainPattern: '*://*.amazonaws.cn/*',
      selectors: {
        accountSelection: {
          accountContainers: ['fieldset > div.saml-account', '.saml-account-name'],
          roleElements: ['.saml-role-name', '.saml-role-description']
        },
        console: {
          accountContainers: ['#nav-usernav-popover', '.awsc-username-display'],
          roleElements: ['.awsc-username-display .awsc-username', '#nav-usernav-popover .nav-elt-label']
        }
      }
    },
    accounts: [prodAccount, devAccount, testAccount],
    created: now,
    modified: now
  };

  const awsGlobalEnv: CloudEnvironment = {
    id: 'env-aws-global-1',
    name: 'AWS Global',
    enable: false,
    provider: CloudProvider.AWS_GLOBAL,
    template: {
      provider: CloudProvider.AWS_GLOBAL,
      name: 'AWS Global',
      accountSelectionUrl: 'https://signin.aws.amazon.com/saml',
      consoleDomainPattern: '*://*.aws.amazon.com/*',
      selectors: {
        accountSelection: {
          accountContainers: ['fieldset > div.saml-account', '.saml-account-name'],
          roleElements: ['.saml-role-name', '.saml-role-description']
        },
        console: {
          accountContainers: ['#nav-usernav-popover', '.awsc-username-display'],
          roleElements: ['.awsc-username-display .awsc-username', '#nav-usernav-popover .nav-elt-label']
        }
      }
    },
    accounts: [],
    created: now,
    modified: now
  };

  return [awsCnEnv, awsGlobalEnv];
}

/**
 * Test function to add sample data to the current configuration
 */
export function addSampleDataToConfig(): void {
  // This function can be called from the browser console to add test data
  const appController = (window as any).enveilApp?.getController();
  if (!appController) {
    console.error('AppController not found. Make sure the options page is loaded.');
    return;
  }

  const cloudConfigManager = appController.getCloudConfigurationManager();
  const sampleEnvironments = createSampleCloudEnvironments();

  sampleEnvironments.forEach(env => {
    const result = cloudConfigManager.addCloudEnvironment(env);
    if (result.isValid) {
      console.log(`Added environment: ${env.name}`);
    } else {
      console.error(`Failed to add environment ${env.name}:`, result.errors);
    }
  });

  console.log('Sample cloud environments added successfully!');
}

// Make the function available globally for testing
(window as any).addSampleCloudData = addSampleDataToConfig;