import { CloudEnvironment, CloudAccount, CloudRole, CloudProvider, RoleHighlightStyle } from '../entrypoints/options/types';
import { getCloudTemplate } from './cloudTemplates';

/**
 * Generate a unique ID for cloud configurations
 */
export function generateCloudId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Create a new cloud environment with default values
 */
export function createCloudEnvironment(
  name: string, 
  provider: CloudProvider
): CloudEnvironment {
  const template = getCloudTemplate(provider);
  const now = Date.now();
  
  return {
    id: generateCloudId(),
    name,
    enable: true,
    provider,
    template,
    accounts: [],
    created: now,
    modified: now
  };
}

/**
 * Create a new cloud account with default values
 */
export function createCloudAccount(
  name: string,
  matchPattern: string = 'domain',
  matchValue: string = '',
  color: string = '#4a9eff'
): CloudAccount {
  const now = Date.now();
  
  return {
    id: generateCloudId(),
    name,
    enable: true,
    matchPattern,
    matchValue,
    color,
    backgroundEnable: true,
    roles: [],
    created: now,
    modified: now
  };
}

/**
 * Create a new cloud role with default values
 */
export function createCloudRole(
  name: string,
  keywords: string[] = [],
  highlightColor: string = '#ffeb3b'
): CloudRole {
  const now = Date.now();
  
  const defaultStyle: RoleHighlightStyle = {
    textColor: '#000000',
    backgroundColor: highlightColor,
    fontWeight: 'bold',
    textDecoration: 'none',
    border: '1px solid transparent'
  };
  
  return {
    id: generateCloudId(),
    name,
    enable: true,
    keywords,
    highlightColor,
    highlightStyle: defaultStyle,
    created: now,
    modified: now
  };
}

/**
 * Update the modified timestamp for a cloud configuration
 */
export function updateModifiedTimestamp<T extends { modified: number }>(config: T): T {
  return {
    ...config,
    modified: Date.now()
  };
}

/**
 * Validate cloud environment configuration
 */
export function validateCloudEnvironment(env: CloudEnvironment): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!env.name || env.name.trim().length === 0) {
    errors.push('Environment name is required');
  }
  
  if (!env.provider) {
    errors.push('Cloud provider is required');
  }
  
  if (!env.template) {
    errors.push('Cloud template is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate cloud account configuration
 */
export function validateCloudAccount(account: CloudAccount): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!account.name || account.name.trim().length === 0) {
    errors.push('Account name is required');
  }
  
  if (!account.matchPattern) {
    errors.push('Match pattern is required');
  }
  
  if (!account.matchValue || account.matchValue.trim().length === 0) {
    errors.push('Match value is required');
  }
  
  if (!account.color || account.color.trim().length === 0) {
    errors.push('Color is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate cloud role configuration
 */
export function validateCloudRole(role: CloudRole): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!role.name || role.name.trim().length === 0) {
    errors.push('Role name is required');
  }
  
  if (!role.keywords || role.keywords.length === 0) {
    errors.push('At least one keyword is required');
  }
  
  if (!role.highlightColor || role.highlightColor.trim().length === 0) {
    errors.push('Highlight color is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Find a cloud environment by ID
 */
export function findCloudEnvironmentById(environments: CloudEnvironment[], id: string): CloudEnvironment | undefined {
  return environments.find(env => env.id === id);
}

/**
 * Find a cloud account by ID within an environment
 */
export function findCloudAccountById(environment: CloudEnvironment, accountId: string): CloudAccount | undefined {
  return environment.accounts.find(account => account.id === accountId);
}

/**
 * Find a cloud role by ID within an account
 */
export function findCloudRoleById(account: CloudAccount, roleId: string): CloudRole | undefined {
  return account.roles.find(role => role.id === roleId);
}

/**
 * Get all enabled cloud accounts from all environments
 */
export function getAllEnabledCloudAccounts(environments: CloudEnvironment[]): CloudAccount[] {
  const accounts: CloudAccount[] = [];
  
  environments.forEach(env => {
    if (env.enable) {
      env.accounts.forEach(account => {
        if (account.enable) {
          accounts.push(account);
        }
      });
    }
  });
  
  return accounts;
}

/**
 * Get all enabled cloud roles from all accounts
 */
export function getAllEnabledCloudRoles(environments: CloudEnvironment[]): CloudRole[] {
  const roles: CloudRole[] = [];
  
  environments.forEach(env => {
    if (env.enable) {
      env.accounts.forEach(account => {
        if (account.enable) {
          account.roles.forEach(role => {
            if (role.enable) {
              roles.push(role);
            }
          });
        }
      });
    }
  });
  
  return roles;
}