import { CloudEnvironment, CloudAccount, CloudRole, CloudAccountPattern, CloudProvider } from '../entrypoints/options/types';
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
  backgroundColor: string = '#4a9eff',
  highlightColor: string = '#ffeb3b'
): CloudAccount {
  const now = Date.now();
  
  return {
    id: generateCloudId(),
    name,
    enable: true,
    backgroundEnable: true,
    backgroundColor,
    highlightEnable: true,
    highlightColor,
    accountPatterns: [],
    roles: [],
    created: now,
    modified: now
  };
}

/**
 * Create a new cloud role with default values
 */
export function createCloudRole(
  matchPattern: string = 'keyword',
  matchValue: string = ''
): CloudRole {
  const now = Date.now();
  
  return {
    id: generateCloudId(),
    enable: true,
    matchPattern,
    matchValue,
    created: now,
    modified: now
  };
}

/**
 * Create a new cloud account pattern with default values
 */
export function createCloudAccountPattern(
  matchPattern: string = 'keyword',
  matchValue: string = ''
): CloudAccountPattern {
  const now = Date.now();
  
  return {
    id: generateCloudId(),
    enable: true,
    matchPattern,
    matchValue,
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
  
  if (!account.backgroundColor) {
    errors.push('Background color is required');
  }
  
  if (!account.highlightColor) {
    errors.push('Highlight color is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Export cloud configuration to JSON string
 */
export function exportCloudConfig(environments: CloudEnvironment[]): string {
  return JSON.stringify(environments, null, 2);
}

/**
 * Import cloud configuration from JSON string
 */
export function importCloudConfig(jsonString: string): CloudEnvironment[] | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      return parsed as CloudEnvironment[];
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get all unique colors used in cloud accounts
 */
export function getUniqueColors(environments: CloudEnvironment[]): string[] {
  const colors = new Set<string>();
  
  environments.forEach(env => {
    env.accounts.forEach(account => {
      colors.add(account.backgroundColor);
      colors.add(account.highlightColor);
    });
  });
  
  return Array.from(colors);
}

/**
 * Find a cloud account by ID across all environments
 */
export function findAccountById(
  environments: CloudEnvironment[], 
  accountId: string
): CloudAccount | null {
  for (const env of environments) {
    const account = env.accounts.find(acc => acc.id === accountId);
    if (account) {
      return account;
    }
  }
  return null;
}

/**
 * Find a cloud environment by ID
 */
export function findEnvironmentById(
  environments: CloudEnvironment[], 
  environmentId: string
): CloudEnvironment | null {
  return environments.find(env => env.id === environmentId) || null;
}

/**
 * Duplicate a cloud account
 */
export function duplicateCloudAccount(account: CloudAccount): CloudAccount {
  const now = Date.now();
  
  return {
    ...account,
    id: generateCloudId(),
    name: `${account.name} (Copy)`,
    accountPatterns: account.accountPatterns.map(pattern => ({
      ...pattern,
      id: generateCloudId(),
      created: now,
      modified: now
    })),
    roles: account.roles.map(role => ({
      ...role,
      id: generateCloudId(),
      created: now,
      modified: now
    })),
    created: now,
    modified: now
  };
}

/**
 * Duplicate a cloud environment with all its accounts
 */
export function duplicateCloudEnvironment(env: CloudEnvironment): CloudEnvironment {
  const now = Date.now();
  
  return {
    ...env,
    id: generateCloudId(),
    name: `${env.name} (Copy)`,
    accounts: env.accounts.map(account => duplicateCloudAccount(account)),
    created: now,
    modified: now
  };
}
