import { AppConfig, CloudEnvironment, CloudAccount, CloudRole } from '../types';
import { CloudConfigValidator, ValidationResult } from '../../../utils/cloudConfigValidator';
import { 
  updateModifiedTimestamp,
  findCloudEnvironmentById,
  findCloudAccountById
} from '../../../utils/cloudUtils';

/**
 * CloudConfigurationManager
 * Manages cloud configuration CRUD operations and integrates with existing systems
 */
export class CloudConfigurationManager {
  private appConfig: AppConfig;
  private notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  private saveConfigCallback: () => void;

  constructor(
    appConfig: AppConfig,
    notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void,
    saveConfigCallback: () => void
  ) {
    this.appConfig = appConfig;
    this.notificationCallback = notificationCallback;
    this.saveConfigCallback = saveConfigCallback;
  }

  /**
   * Update configuration reference
   */
  public updateConfig(config: AppConfig): void {
    this.appConfig = config;
  }

  /**
   * Initialize cloud environments array if not present (backward compatibility)
   */
  public initializeCloudEnvironments(): void {
    if (!this.appConfig.cloudEnvironments) {
      this.appConfig.cloudEnvironments = [];
      this.saveConfigCallback();
    }
  }

  /**
   * Get all cloud environments
   */
  public getCloudEnvironments(): CloudEnvironment[] {
    this.initializeCloudEnvironments();
    return this.appConfig.cloudEnvironments || [];
  }

  /**
   * Add a new cloud environment
   */
  public addCloudEnvironment(environment: CloudEnvironment): ValidationResult {
    const validation = CloudConfigValidator.validateEnvironment(environment);
    
    if (!validation.isValid) {
      this.notificationCallback(`Failed to add environment: ${validation.errors.join(', ')}`, 'error');
      return validation;
    }

    this.initializeCloudEnvironments();
    
    // Check for duplicate names
    const existingEnv = this.appConfig.cloudEnvironments!.find(env => env.name === environment.name);
    if (existingEnv) {
      const error = 'Environment with this name already exists';
      this.notificationCallback(error, 'error');
      return {
        isValid: false,
        errors: [error],
        warnings: []
      };
    }

    this.appConfig.cloudEnvironments!.push(environment);
    this.saveConfigCallback();
    
    this.notificationCallback(`Cloud environment "${environment.name}" added successfully`, 'success');
    
    // Show warnings if any
    if (validation.warnings.length > 0) {
      this.notificationCallback(`Warnings: ${validation.warnings.join(', ')}`, 'warning');
    }

    return validation;
  }

  /**
   * Update an existing cloud environment
   */
  public updateCloudEnvironment(environmentId: string, updatedEnvironment: CloudEnvironment): ValidationResult {
    const validation = CloudConfigValidator.validateEnvironment(updatedEnvironment);
    
    if (!validation.isValid) {
      this.notificationCallback(`Failed to update environment: ${validation.errors.join(', ')}`, 'error');
      return validation;
    }

    this.initializeCloudEnvironments();
    
    const envIndex = this.appConfig.cloudEnvironments!.findIndex(env => env.id === environmentId);
    if (envIndex === -1) {
      const error = 'Environment not found';
      this.notificationCallback(error, 'error');
      return {
        isValid: false,
        errors: [error],
        warnings: []
      };
    }

    // Check for duplicate names (excluding current environment)
    const existingEnv = this.appConfig.cloudEnvironments!.find(env => 
      env.name === updatedEnvironment.name && env.id !== environmentId
    );
    if (existingEnv) {
      const error = 'Another environment with this name already exists';
      this.notificationCallback(error, 'error');
      return {
        isValid: false,
        errors: [error],
        warnings: []
      };
    }

    // Update with modified timestamp
    this.appConfig.cloudEnvironments![envIndex] = updateModifiedTimestamp(updatedEnvironment);
    this.saveConfigCallback();
    
    this.notificationCallback(`Cloud environment "${updatedEnvironment.name}" updated successfully`, 'success');
    
    // Show warnings if any
    if (validation.warnings.length > 0) {
      this.notificationCallback(`Warnings: ${validation.warnings.join(', ')}`, 'warning');
    }

    return validation;
  }

  /**
   * Delete a cloud environment
   */
  public deleteCloudEnvironment(environmentId: string): boolean {
    this.initializeCloudEnvironments();
    
    const envIndex = this.appConfig.cloudEnvironments!.findIndex(env => env.id === environmentId);
    if (envIndex === -1) {
      this.notificationCallback('Environment not found', 'error');
      return false;
    }

    const environmentName = this.appConfig.cloudEnvironments![envIndex].name;
    this.appConfig.cloudEnvironments!.splice(envIndex, 1);
    this.saveConfigCallback();
    
    this.notificationCallback(`Cloud environment "${environmentName}" deleted successfully`, 'success');
    return true;
  }

  /**
   * Add a cloud account to an environment
   */
  public addCloudAccount(environmentId: string, account: CloudAccount): ValidationResult {
    const validation = CloudConfigValidator.validateAccount(account);
    
    if (!validation.isValid) {
      this.notificationCallback(`Failed to add account: ${validation.errors.join(', ')}`, 'error');
      return validation;
    }

    const environment = findCloudEnvironmentById(this.getCloudEnvironments(), environmentId);
    if (!environment) {
      const error = 'Environment not found';
      this.notificationCallback(error, 'error');
      return {
        isValid: false,
        errors: [error],
        warnings: []
      };
    }

    // Check for duplicate names within the environment
    const existingAccount = environment.accounts.find(acc => acc.name === account.name);
    if (existingAccount) {
      const error = 'Account with this name already exists in this environment';
      this.notificationCallback(error, 'error');
      return {
        isValid: false,
        errors: [error],
        warnings: []
      };
    }

    environment.accounts.push(account);
    this.saveConfigCallback();
    
    this.notificationCallback(`Cloud account "${account.name}" added successfully`, 'success');
    
    // Show warnings if any
    if (validation.warnings.length > 0) {
      this.notificationCallback(`Warnings: ${validation.warnings.join(', ')}`, 'warning');
    }

    return validation;
  }

  /**
   * Update a cloud account
   */
  public updateCloudAccount(environmentId: string, accountId: string, updatedAccount: CloudAccount): ValidationResult {
    const validation = CloudConfigValidator.validateAccount(updatedAccount);
    
    if (!validation.isValid) {
      this.notificationCallback(`Failed to update account: ${validation.errors.join(', ')}`, 'error');
      return validation;
    }

    const environment = findCloudEnvironmentById(this.getCloudEnvironments(), environmentId);
    if (!environment) {
      const error = 'Environment not found';
      this.notificationCallback(error, 'error');
      return {
        isValid: false,
        errors: [error],
        warnings: []
      };
    }

    const accountIndex = environment.accounts.findIndex(acc => acc.id === accountId);
    if (accountIndex === -1) {
      const error = 'Account not found';
      this.notificationCallback(error, 'error');
      return {
        isValid: false,
        errors: [error],
        warnings: []
      };
    }

    // Check for duplicate names (excluding current account)
    const existingAccount = environment.accounts.find(acc => 
      acc.name === updatedAccount.name && acc.id !== accountId
    );
    if (existingAccount) {
      const error = 'Another account with this name already exists in this environment';
      this.notificationCallback(error, 'error');
      return {
        isValid: false,
        errors: [error],
        warnings: []
      };
    }

    // Update with modified timestamp
    environment.accounts[accountIndex] = updateModifiedTimestamp(updatedAccount);
    this.saveConfigCallback();
    
    this.notificationCallback(`Cloud account "${updatedAccount.name}" updated successfully`, 'success');
    
    // Show warnings if any
    if (validation.warnings.length > 0) {
      this.notificationCallback(`Warnings: ${validation.warnings.join(', ')}`, 'warning');
    }

    return validation;
  }

  /**
   * Delete a cloud account
   */
  public deleteCloudAccount(environmentId: string, accountId: string): boolean {
    const environment = findCloudEnvironmentById(this.getCloudEnvironments(), environmentId);
    if (!environment) {
      this.notificationCallback('Environment not found', 'error');
      return false;
    }

    const accountIndex = environment.accounts.findIndex(acc => acc.id === accountId);
    if (accountIndex === -1) {
      this.notificationCallback('Account not found', 'error');
      return false;
    }

    const accountName = environment.accounts[accountIndex].name;
    environment.accounts.splice(accountIndex, 1);
    this.saveConfigCallback();
    
    this.notificationCallback(`Cloud account "${accountName}" deleted successfully`, 'success');
    return true;
  }

  /**
   * Add a cloud role to an account
   */
  public addCloudRole(environmentId: string, accountId: string, role: CloudRole): ValidationResult {
    const validation = CloudConfigValidator.validateRole(role);
    
    if (!validation.isValid) {
      this.notificationCallback(`Failed to add role: ${validation.errors.join(', ')}`, 'error');
      return validation;
    }

    const environment = findCloudEnvironmentById(this.getCloudEnvironments(), environmentId);
    if (!environment) {
      const error = 'Environment not found';
      this.notificationCallback(error, 'error');
      return {
        isValid: false,
        errors: [error],
        warnings: []
      };
    }

    const account = findCloudAccountById(environment, accountId);
    if (!account) {
      const error = 'Account not found';
      this.notificationCallback(error, 'error');
      return {
        isValid: false,
        errors: [error],
        warnings: []
      };
    }

    // Check for duplicate names within the account
    const existingRole = account.roles.find(r => r.name === role.name);
    if (existingRole) {
      const error = 'Role with this name already exists in this account';
      this.notificationCallback(error, 'error');
      return {
        isValid: false,
        errors: [error],
        warnings: []
      };
    }

    account.roles.push(role);
    this.saveConfigCallback();
    
    this.notificationCallback(`Cloud role "${role.name}" added successfully`, 'success');
    
    // Show warnings if any
    if (validation.warnings.length > 0) {
      this.notificationCallback(`Warnings: ${validation.warnings.join(', ')}`, 'warning');
    }

    return validation;
  }

  /**
   * Update a cloud role
   */
  public updateCloudRole(environmentId: string, accountId: string, roleId: string, updatedRole: CloudRole): ValidationResult {
    const validation = CloudConfigValidator.validateRole(updatedRole);
    
    if (!validation.isValid) {
      this.notificationCallback(`Failed to update role: ${validation.errors.join(', ')}`, 'error');
      return validation;
    }

    const environment = findCloudEnvironmentById(this.getCloudEnvironments(), environmentId);
    if (!environment) {
      const error = 'Environment not found';
      this.notificationCallback(error, 'error');
      return {
        isValid: false,
        errors: [error],
        warnings: []
      };
    }

    const account = findCloudAccountById(environment, accountId);
    if (!account) {
      const error = 'Account not found';
      this.notificationCallback(error, 'error');
      return {
        isValid: false,
        errors: [error],
        warnings: []
      };
    }

    const roleIndex = account.roles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
      const error = 'Role not found';
      this.notificationCallback(error, 'error');
      return {
        isValid: false,
        errors: [error],
        warnings: []
      };
    }

    // Check for duplicate names (excluding current role)
    const existingRole = account.roles.find(r => 
      r.name === updatedRole.name && r.id !== roleId
    );
    if (existingRole) {
      const error = 'Another role with this name already exists in this account';
      this.notificationCallback(error, 'error');
      return {
        isValid: false,
        errors: [error],
        warnings: []
      };
    }

    // Update with modified timestamp
    account.roles[roleIndex] = updateModifiedTimestamp(updatedRole);
    this.saveConfigCallback();
    
    this.notificationCallback(`Cloud role "${updatedRole.name}" updated successfully`, 'success');
    
    // Show warnings if any
    if (validation.warnings.length > 0) {
      this.notificationCallback(`Warnings: ${validation.warnings.join(', ')}`, 'warning');
    }

    return validation;
  }

  /**
   * Delete a cloud role
   */
  public deleteCloudRole(environmentId: string, accountId: string, roleId: string): boolean {
    const environment = findCloudEnvironmentById(this.getCloudEnvironments(), environmentId);
    if (!environment) {
      this.notificationCallback('Environment not found', 'error');
      return false;
    }

    const account = findCloudAccountById(environment, accountId);
    if (!account) {
      this.notificationCallback('Account not found', 'error');
      return false;
    }

    const roleIndex = account.roles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) {
      this.notificationCallback('Role not found', 'error');
      return false;
    }

    const roleName = account.roles[roleIndex].name;
    account.roles.splice(roleIndex, 1);
    this.saveConfigCallback();
    
    this.notificationCallback(`Cloud role "${roleName}" deleted successfully`, 'success');
    return true;
  }

  /**
   * Validate entire cloud configuration
   */
  public validateCloudConfiguration(): ValidationResult {
    const environments = this.getCloudEnvironments();
    const configValidation = CloudConfigValidator.validateAppConfig(this.appConfig);
    const uniqueIdValidation = CloudConfigValidator.validateUniqueIds(environments);

    const combinedErrors = [...configValidation.errors, ...uniqueIdValidation.errors];
    const combinedWarnings = [...configValidation.warnings, ...uniqueIdValidation.warnings];

    return {
      isValid: combinedErrors.length === 0,
      errors: combinedErrors,
      warnings: combinedWarnings
    };
  }

  /**
   * Sanitize and fix cloud configuration
   */
  public sanitizeCloudConfiguration(): void {
    this.appConfig = CloudConfigValidator.sanitizeCloudConfig(this.appConfig);
    this.saveConfigCallback();
    this.notificationCallback('Cloud configuration sanitized successfully', 'success');
  }

  /**
   * Get cloud configuration statistics
   */
  public getCloudConfigStats(): {
    environmentCount: number;
    accountCount: number;
    roleCount: number;
    enabledEnvironments: number;
    enabledAccounts: number;
    enabledRoles: number;
  } {
    const environments = this.getCloudEnvironments();
    
    let accountCount = 0;
    let roleCount = 0;
    let enabledEnvironments = 0;
    let enabledAccounts = 0;
    let enabledRoles = 0;

    environments.forEach(env => {
      if (env.enable) enabledEnvironments++;
      
      env.accounts.forEach(account => {
        accountCount++;
        if (account.enable) enabledAccounts++;
        
        account.roles.forEach(role => {
          roleCount++;
          if (role.enable) enabledRoles++;
        });
      });
    });

    return {
      environmentCount: environments.length,
      accountCount,
      roleCount,
      enabledEnvironments,
      enabledAccounts,
      enabledRoles
    };
  }

  /**
   * Export cloud configurations for backup or sharing
   */
  public exportCloudConfigurations(): string {
    const cloudData = {
      cloudEnvironments: this.getCloudEnvironments(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    return JSON.stringify(cloudData, null, 2);
  }

  /**
   * Import cloud configurations from exported data
   */
  public importCloudConfigurations(jsonData: string): ValidationResult {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.cloudEnvironments || !Array.isArray(importData.cloudEnvironments)) {
        const error = 'Invalid cloud configuration format: missing cloudEnvironments array';
        this.notificationCallback(error, 'error');
        return {
          isValid: false,
          errors: [error],
          warnings: []
        };
      }

      // Validate all environments before importing
      const validationResults = importData.cloudEnvironments.map((env: CloudEnvironment, index: number) => {
        const result = CloudConfigValidator.validateEnvironment(env);
        if (!result.isValid) {
          result.errors = result.errors.map(err => `Environment ${index + 1}: ${err}`);
        }
        return result;
      });

      const allErrors = validationResults.flatMap((r: ValidationResult) => r.errors);
      const allWarnings = validationResults.flatMap((r: ValidationResult) => r.warnings);

      if (allErrors.length > 0) {
        this.notificationCallback(`Import failed: ${allErrors.join(', ')}`, 'error');
        return {
          isValid: false,
          errors: allErrors,
          warnings: allWarnings
        };
      }

      // Import the environments
      this.appConfig.cloudEnvironments = importData.cloudEnvironments;
      this.saveConfigCallback();
      
      this.notificationCallback(`Successfully imported ${importData.cloudEnvironments.length} cloud environments`, 'success');
      
      if (allWarnings.length > 0) {
        this.notificationCallback(`Import warnings: ${allWarnings.join(', ')}`, 'warning');
      }

      return {
        isValid: true,
        errors: [],
        warnings: allWarnings
      };
    } catch (error) {
      const errorMessage = `Failed to parse cloud configuration data: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.notificationCallback(errorMessage, 'error');
      return {
        isValid: false,
        errors: [errorMessage],
        warnings: []
      };
    }
  }

  /**
   * Reset all cloud configurations (with confirmation)
   */
  public resetCloudConfigurations(): boolean {
    const stats = this.getCloudConfigStats();
    const confirmMessage = `This will delete all cloud configurations:\n` +
      `- ${stats.environmentCount} environments\n` +
      `- ${stats.accountCount} accounts\n` +
      `- ${stats.roleCount} roles\n\n` +
      `Are you sure you want to continue?`;

    if (!confirm(confirmMessage)) {
      return false;
    }

    this.appConfig.cloudEnvironments = [];
    this.saveConfigCallback();
    
    this.notificationCallback('All cloud configurations have been reset', 'success');
    return true;
  }

  /**
   * Get cloud environments for a specific provider
   */
  public getEnvironmentsByProvider(provider: string): CloudEnvironment[] {
    return this.getCloudEnvironments().filter(env => env.provider === provider);
  }

  /**
   * Find cloud environment by name
   */
  public findEnvironmentByName(name: string): CloudEnvironment | undefined {
    return this.getCloudEnvironments().find(env => env.name === name);
  }

  /**
   * Get all enabled cloud accounts across all environments
   */
  public getAllEnabledAccounts(): Array<{ environment: CloudEnvironment; account: CloudAccount }> {
    const result: Array<{ environment: CloudEnvironment; account: CloudAccount }> = [];
    
    this.getCloudEnvironments().forEach(env => {
      if (env.enable) {
        env.accounts.forEach(account => {
          if (account.enable) {
            result.push({ environment: env, account });
          }
        });
      }
    });
    
    return result;
  }

  /**
   * Get all enabled cloud roles across all environments and accounts
   */
  public getAllEnabledRoles(): Array<{ 
    environment: CloudEnvironment; 
    account: CloudAccount; 
    role: CloudRole 
  }> {
    const result: Array<{ environment: CloudEnvironment; account: CloudAccount; role: CloudRole }> = [];
    
    this.getCloudEnvironments().forEach(env => {
      if (env.enable) {
        env.accounts.forEach(account => {
          if (account.enable) {
            account.roles.forEach(role => {
              if (role.enable) {
                result.push({ environment: env, account, role });
              }
            });
          }
        });
      }
    });
    
    return result;
  }
}