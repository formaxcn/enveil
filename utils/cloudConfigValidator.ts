import { CloudEnvironment, CloudAccount, CloudRole, CloudAccountPattern, AppConfig } from '../entrypoints/options/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Cloud Configuration Validator
 * Provides validation functions for cloud configurations with detailed error reporting
 */
export class CloudConfigValidator {
  
  /**
   * Validate a complete AppConfig including cloud environments
   */
  public static validateAppConfig(config: AppConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate existing fields
    if (!config.settings || !Array.isArray(config.settings)) {
      errors.push('Settings array is required');
    }

    if (!config.defaultColors || !Array.isArray(config.defaultColors)) {
      errors.push('Default colors array is required');
    }

    if (typeof config.browserSync !== 'boolean') {
      errors.push('Browser sync must be a boolean value');
    }

    // Validate cloud environments if present
    if (config.cloudEnvironments) {
      if (!Array.isArray(config.cloudEnvironments)) {
        errors.push('Cloud environments must be an array');
      } else {
        config.cloudEnvironments.forEach((env, index) => {
          const envResult = this.validateEnvironment(env);
          if (!envResult.isValid) {
            errors.push(...envResult.errors.map(err => `Environment ${index + 1}: ${err}`));
          }
          warnings.push(...envResult.warnings.map(warn => `Environment ${index + 1}: ${warn}`));
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate cloud environment configuration
   */
  public static validateEnvironment(env: CloudEnvironment): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!env.id || typeof env.id !== 'string' || env.id.trim().length === 0) {
      errors.push('Environment ID is required and must be a non-empty string');
    }

    if (!env.name || typeof env.name !== 'string' || env.name.trim().length === 0) {
      errors.push('Environment name is required and must be a non-empty string');
    }

    if (typeof env.enable !== 'boolean') {
      errors.push('Environment enable flag must be a boolean');
    }

    if (!env.provider || typeof env.provider !== 'string') {
      errors.push('Cloud provider is required');
    }

    if (!env.template || typeof env.template !== 'object') {
      errors.push('Cloud template is required');
    } else {
      const templateResult = this.validateTemplate(env.template);
      if (!templateResult.isValid) {
        errors.push(...templateResult.errors.map(err => `Template: ${err}`));
      }
      warnings.push(...templateResult.warnings.map(warn => `Template: ${warn}`));
    }

    // Validate timestamps
    if (typeof env.created !== 'number' || env.created <= 0) {
      errors.push('Created timestamp must be a positive number');
    }

    if (typeof env.modified !== 'number' || env.modified <= 0) {
      errors.push('Modified timestamp must be a positive number');
    }

    // Validate accounts array
    if (!env.accounts || !Array.isArray(env.accounts)) {
      errors.push('Accounts must be an array');
    } else {
      env.accounts.forEach((account, index) => {
        const accountResult = this.validateAccount(account);
        if (!accountResult.isValid) {
          errors.push(...accountResult.errors.map(err => `Account ${index + 1}: ${err}`));
        }
        warnings.push(...accountResult.warnings.map(warn => `Account ${index + 1}: ${warn}`));
      });
    }

    // Warnings
    if (env.accounts && env.accounts.length === 0) {
      warnings.push('Environment has no accounts configured');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate cloud account configuration
   */
  public static validateAccount(account: CloudAccount): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!account.id || typeof account.id !== 'string' || account.id.trim().length === 0) {
      errors.push('Account ID is required and must be a non-empty string');
    }

    if (!account.name || typeof account.name !== 'string' || account.name.trim().length === 0) {
      errors.push('Account name is required and must be a non-empty string');
    }

    if (typeof account.enable !== 'boolean') {
      errors.push('Account enable flag must be a boolean');
    }

    if (typeof account.backgroundEnable !== 'boolean') {
      errors.push('Background enable flag must be a boolean');
    }

    if (!account.backgroundColor || typeof account.backgroundColor !== 'string' || account.backgroundColor.trim().length === 0) {
      errors.push('Background color is required and must be a non-empty string');
    } else {
      // Validate color format (hex color)
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!colorRegex.test(account.backgroundColor)) {
        errors.push('Background color must be a valid hex color (e.g., #FF0000 or #F00)');
      }
    }

    if (typeof account.highlightEnable !== 'boolean') {
      errors.push('Highlight enable flag must be a boolean');
    }

    if (!account.highlightColor || typeof account.highlightColor !== 'string' || account.highlightColor.trim().length === 0) {
      errors.push('Highlight color is required and must be a non-empty string');
    } else {
      // Validate color format (hex color)
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!colorRegex.test(account.highlightColor)) {
        errors.push('Highlight color must be a valid hex color (e.g., #FF0000 or #F00)');
      }
    }

    // Validate timestamps
    if (typeof account.created !== 'number' || account.created <= 0) {
      errors.push('Created timestamp must be a positive number');
    }

    if (typeof account.modified !== 'number' || account.modified <= 0) {
      errors.push('Modified timestamp must be a positive number');
    }

    // Validate roles array
    if (!account.roles || !Array.isArray(account.roles)) {
      errors.push('Roles must be an array');
    } else {
      account.roles.forEach((role, index) => {
        const roleResult = this.validateRole(role);
        if (!roleResult.isValid) {
          errors.push(...roleResult.errors.map(err => `Role ${index + 1}: ${err}`));
        }
        warnings.push(...roleResult.warnings.map(warn => `Role ${index + 1}: ${warn}`));
      });
    }

    // Validate account patterns array
    if (account.accountPatterns && !Array.isArray(account.accountPatterns)) {
      errors.push('Account patterns must be an array');
    } else if (account.accountPatterns) {
      account.accountPatterns.forEach((pattern, index) => {
        const patternResult = this.validateAccountPattern(pattern);
        if (!patternResult.isValid) {
          errors.push(...patternResult.errors.map(err => `Account Pattern ${index + 1}: ${err}`));
        }
        warnings.push(...patternResult.warnings.map(warn => `Account Pattern ${index + 1}: ${warn}`));
      });
    }

    // Warnings
    if (account.roles && account.roles.length === 0 && (!account.accountPatterns || account.accountPatterns.length === 0)) {
      warnings.push('Account has no roles or account patterns configured');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate cloud role configuration
   */
  public static validateRole(role: CloudRole): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!role.id || typeof role.id !== 'string' || role.id.trim().length === 0) {
      errors.push('Role ID is required and must be a non-empty string');
    }

    if (typeof role.enable !== 'boolean') {
      errors.push('Role enable flag must be a boolean');
    }

    if (!role.matchPattern || typeof role.matchPattern !== 'string' || role.matchPattern.trim().length === 0) {
      errors.push('Match pattern is required and must be a non-empty string');
    } else {
      const validPatterns = ['keyword', 'regex'];
      if (!validPatterns.includes(role.matchPattern)) {
        errors.push(`Match pattern must be one of: ${validPatterns.join(', ')}`);
      }
    }

    if (!role.matchValue || typeof role.matchValue !== 'string' || role.matchValue.trim().length === 0) {
      errors.push('Match value is required and must be a non-empty string');
    } else if (role.matchPattern === 'regex') {
      try {
        new RegExp(role.matchValue);
      } catch (e) {
        errors.push('Match value must be a valid regular expression when pattern is "regex"');
      }
    }

    // Validate timestamps
    if (typeof role.created !== 'number' || role.created <= 0) {
      errors.push('Created timestamp must be a positive number');
    }

    if (typeof role.modified !== 'number' || role.modified <= 0) {
      errors.push('Modified timestamp must be a positive number');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate cloud account pattern configuration
   */
  public static validateAccountPattern(pattern: CloudAccountPattern): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!pattern.id || typeof pattern.id !== 'string' || pattern.id.trim().length === 0) {
      errors.push('Pattern ID is required and must be a non-empty string');
    }

    if (typeof pattern.enable !== 'boolean') {
      errors.push('Pattern enable flag must be a boolean');
    }

    if (!pattern.matchPattern || typeof pattern.matchPattern !== 'string' || pattern.matchPattern.trim().length === 0) {
      errors.push('Match pattern is required and must be a non-empty string');
    } else {
      const validPatterns = ['keyword', 'regex'];
      if (!validPatterns.includes(pattern.matchPattern)) {
        errors.push(`Match pattern must be one of: ${validPatterns.join(', ')}`);
      }
    }

    if (!pattern.matchValue || typeof pattern.matchValue !== 'string' || pattern.matchValue.trim().length === 0) {
      errors.push('Match value is required and must be a non-empty string');
    } else if (pattern.matchPattern === 'regex') {
      try {
        new RegExp(pattern.matchValue);
      } catch (e) {
        errors.push('Match value must be a valid regular expression when pattern is "regex"');
      }
    }

    if (typeof pattern.created !== 'number' || pattern.created <= 0) {
      errors.push('Created timestamp must be a positive number');
    }

    if (typeof pattern.modified !== 'number' || pattern.modified <= 0) {
      errors.push('Modified timestamp must be a positive number');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate cloud template configuration
   */
  public static validateTemplate(template: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!template.provider || typeof template.provider !== 'string') {
      errors.push('Template provider is required');
    }

    if (!template.name || typeof template.name !== 'string' || template.name.trim().length === 0) {
      errors.push('Template name is required and must be a non-empty string');
    }

    if (!template.accountSelectionUrl || typeof template.accountSelectionUrl !== 'string') {
      errors.push('Account selection URL is required');
    } else {
      // Validate URL format for non-custom providers
      if (template.provider !== 'custom' && template.accountSelectionUrl.trim().length > 0) {
        try {
          new URL(template.accountSelectionUrl);
        } catch {
          errors.push('Account selection URL must be a valid URL');
        }
      }
    }

    if (!template.consoleDomainPattern || typeof template.consoleDomainPattern !== 'string') {
      errors.push('Console domain pattern is required');
    }

    // SAML URL is optional
    if (template.samlUrl && typeof template.samlUrl !== 'string') {
      errors.push('SAML URL must be a string if provided');
    } else if (template.samlUrl && template.samlUrl.trim().length > 0) {
      try {
        new URL(template.samlUrl);
      } catch {
        warnings.push('SAML URL should be a valid URL');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate role highlight style configuration
   */
  public static validateHighlightStyle(style: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!style.textColor || typeof style.textColor !== 'string') {
      errors.push('Text color is required');
    } else {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!colorRegex.test(style.textColor)) {
        errors.push('Text color must be a valid hex color');
      }
    }

    if (!style.backgroundColor || typeof style.backgroundColor !== 'string') {
      errors.push('Background color is required');
    } else {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!colorRegex.test(style.backgroundColor)) {
        errors.push('Background color must be a valid hex color');
      }
    }

    if (!style.fontWeight || typeof style.fontWeight !== 'string') {
      errors.push('Font weight is required');
    } else if (!['normal', 'bold'].includes(style.fontWeight)) {
      errors.push('Font weight must be either "normal" or "bold"');
    }

    if (!style.textDecoration || typeof style.textDecoration !== 'string') {
      errors.push('Text decoration is required');
    } else if (!['none', 'underline'].includes(style.textDecoration)) {
      errors.push('Text decoration must be either "none" or "underline"');
    }

    if (style.border !== undefined && typeof style.border !== 'string') {
      errors.push('Border must be a string if provided');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate that cloud configuration IDs are unique within their scope
   */
  public static validateUniqueIds(environments: CloudEnvironment[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check environment ID uniqueness
    const envIds = new Set<string>();
    environments.forEach((env, envIndex) => {
      if (envIds.has(env.id)) {
        errors.push(`Duplicate environment ID "${env.id}" found at position ${envIndex + 1}`);
      } else {
        envIds.add(env.id);
      }

      // Check account ID uniqueness within environment
      const accountIds = new Set<string>();
      env.accounts.forEach((account, accountIndex) => {
        if (accountIds.has(account.id)) {
          errors.push(`Duplicate account ID "${account.id}" in environment "${env.name}" at position ${accountIndex + 1}`);
        } else {
          accountIds.add(account.id);
        }

        // Check role ID uniqueness within account
        const roleIds = new Set<string>();
        account.roles.forEach((role, roleIndex) => {
          if (roleIds.has(role.id)) {
            errors.push(`Duplicate role ID "${role.id}" in account "${account.name}" at position ${roleIndex + 1}`);
          } else {
            roleIds.add(role.id);
          }
        });

        // Check account pattern ID uniqueness within account
        const patternIds = new Set<string>();
        account.accountPatterns?.forEach((pattern, patternIndex) => {
          if (patternIds.has(pattern.id)) {
            errors.push(`Duplicate account pattern ID "${pattern.id}" in account "${account.name}" at position ${patternIndex + 1}`);
          } else {
            patternIds.add(pattern.id);
          }
        });
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Sanitize and fix common configuration issues
   */
  public static sanitizeCloudConfig(config: AppConfig): AppConfig {
    const sanitized = { ...config };

    // Ensure cloudEnvironments exists
    if (!sanitized.cloudEnvironments) {
      sanitized.cloudEnvironments = [];
    }

    // Sanitize each environment
    sanitized.cloudEnvironments = sanitized.cloudEnvironments.map(env => ({
      ...env,
      name: env.name?.trim() || 'Unnamed Environment',
      enable: typeof env.enable === 'boolean' ? env.enable : true,
      accounts: env.accounts?.map(account => ({
        ...account,
        name: account.name?.trim() || 'Unnamed Account',
        enable: typeof account.enable === 'boolean' ? account.enable : true,
        backgroundEnable: typeof account.backgroundEnable === 'boolean' ? account.backgroundEnable : true,
        backgroundColor: account.backgroundColor?.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/) ? account.backgroundColor : '#4a9eff',
        highlightEnable: typeof account.highlightEnable === 'boolean' ? account.highlightEnable : true,
        highlightColor: account.highlightColor?.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/) ? account.highlightColor : '#ffeb3b',
        roles: account.roles?.map(role => ({
          ...role,
          enable: typeof role.enable === 'boolean' ? role.enable : true,
          matchPattern: role.matchPattern?.trim() || 'keyword',
          matchValue: role.matchValue?.trim() || ''
        })) || [],
        accountPatterns: account.accountPatterns?.map(pattern => ({
          ...pattern,
          enable: typeof pattern.enable === 'boolean' ? pattern.enable : true,
          matchPattern: pattern.matchPattern?.trim() || 'keyword',
          matchValue: pattern.matchValue?.trim() || ''
        })) || []
      })) || []
    }));

    return sanitized;
  }
}