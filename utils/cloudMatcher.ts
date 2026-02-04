import { Matcher } from './matcher';
import { CloudAccount, CloudRole, CloudEnvironment, CloudAccountPattern } from '../entrypoints/options/types';

/**
 * CloudMatcher extends from existing Matcher utility class for cloud-specific pattern matching.
 * Provides cloud account URL pattern matching and role keyword matching functionality.
 */
export class CloudMatcher extends Matcher {
    /**
     * Checks if a cloud account pattern matches to current URL/host.
     * 
     * @param pattern The cloud account pattern to check
     * @param currentUrl The URL to match against
     * @param currentHost The host to match against
     * @returns boolean indicating if pattern matches
     */
    static isAccountPatternMatch(pattern: CloudAccountPattern, currentUrl: string, currentHost: string): boolean {
        if (!pattern.enable) return false;

        const siteConfigLike = {
            enable: pattern.enable,
            matchPattern: pattern.matchPattern,
            matchValue: pattern.matchValue,
            envName: '',
            color: '#4a9eff',
            backgroudEnable: true,
            Position: '',
            flagEnable: false
        };

        return this.isMatch(siteConfigLike, currentUrl, currentHost);
    }
    static isCloudAccountMatch(account: CloudAccount, currentUrl: string, currentHost: string): boolean {
        if (!account.enable) return false;

        // Check if account has account patterns
        if (account.accountPatterns && account.accountPatterns.length > 0) {
            for (const pattern of account.accountPatterns) {
                if (!pattern.enable) continue;
                
                const siteConfigLike = {
                    enable: pattern.enable,
                    matchPattern: pattern.matchPattern,
                    matchValue: pattern.matchValue,
                    envName: account.name,
                    color: account.backgroundColor,
                    backgroudEnable: account.backgroundEnable,
                    Position: '',
                    flagEnable: false
                };
                
                if (this.isMatch(siteConfigLike, currentUrl, currentHost)) {
                    return true;
                }
            }
            return false;
        }
        
        return false;
    }

    /**
     * Finds all cloud roles that have patterns matching the provided page content.
     * Performs pattern-based matching (keyword or regex) against the page content.
     * 
     * @param roles Array of cloud roles to check
     * @param pageContent The page content to search for patterns
     * @returns Array of CloudRole objects that have matching patterns
     */
    static findMatchingRoles(roles: CloudRole[], pageContent: string): CloudRole[] {
        if (!roles || roles.length === 0 || !pageContent) {
            return [];
        }

        const matchingRoles: CloudRole[] = [];

        for (const role of roles) {
            if (!role.enable || !role.matchValue || role.matchValue.trim() === '') {
                continue;
            }

            const matchValue = role.matchValue.trim();
            let isMatch = false;

            if (role.matchPattern === 'regex') {
                try {
                    const regex = new RegExp(matchValue, 'i');
                    isMatch = regex.test(pageContent);
                } catch (e) {
                    console.error('[Enveil] Invalid role regex:', matchValue);
                }
            } else {
                const lowerMatchValue = matchValue.toLowerCase();
                const lowerPageContent = pageContent.toLowerCase();
                isMatch = lowerPageContent.includes(lowerMatchValue);
            }

            if (isMatch) {
                matchingRoles.push(role);
            }
        }

        return matchingRoles;
    }

    /**
     * Extracts role patterns from page content that match any of the provided roles.
     * Returns the actual matched strings found in the content for highlighting purposes.
     * 
     * @param content The page content to search
     * @param roles Array of cloud roles with patterns to search for
     * @returns Array of matched strings found in the content
     */
    static extractRoleKeywords(content: string, roles: CloudRole[]): string[] {
        if (!content || !roles || roles.length === 0) {
            return [];
        }

        const foundMatches: string[] = [];

        for (const role of roles) {
            if (!role.enable || !role.matchValue || role.matchValue.trim() === '') {
                continue;
            }

            const matchValue = role.matchValue.trim();

            if (role.matchPattern === 'regex') {
                try {
                    const regex = new RegExp(matchValue, 'gi');
                    const matches = content.match(regex);
                    if (matches) {
                        matches.forEach(match => {
                            if (!foundMatches.includes(match)) {
                                foundMatches.push(match);
                            }
                        });
                    }
                } catch (e) {
                    console.error('[Enveil] Invalid role regex:', matchValue);
                }
            } else {
                const lowerMatchValue = matchValue.toLowerCase();
                const lowerContent = content.toLowerCase();
                if (lowerContent.includes(lowerMatchValue)) {
                    if (!foundMatches.includes(matchValue)) {
                        foundMatches.push(matchValue);
                    }
                }
            }
        }

        return foundMatches;
    }

    /**
     * Checks if a URL matches the environment's template patterns (accountSelectionUrl or consoleDomainPattern).
     * 
     * @param environment The cloud environment to check
     * @param currentUrl The URL to match against
     * @returns boolean indicating if the URL matches the environment template
     */
    static isEnvironmentTemplateMatch(environment: CloudEnvironment, currentUrl: string): boolean {
        if (!environment.template) return false;

        const template = environment.template;

        // Check account selection URL
        if (template.accountSelectionUrl && currentUrl.includes(template.accountSelectionUrl)) {
            return true;
        }

        // Check console domain pattern
        if (template.consoleDomainPattern) {
            // Convert simple wildcard pattern to regex-like matching
            // Handle patterns like "*://*.amazonaws.cn/*"
            let pattern = template.consoleDomainPattern;

            // First escape dots that are not part of wildcards
            pattern = pattern.replace(/\./g, '\\.');
            // Then handle wildcards
            pattern = pattern.replace(/\*:/g, 'https?:');  // Replace *: with https?:
            pattern = pattern.replace(/\*\\\./g, '.*\\.');   // Replace *\. with .*\. (matches any subdomain)
            pattern = pattern.replace(/\*/g, '.*');        // Replace remaining * with .*

            try {
                const regex = new RegExp('^' + pattern + '$');
                return regex.test(currentUrl);
            } catch (e) {
                // Fallback to simple string matching if regex fails
                return currentUrl.includes(template.consoleDomainPattern.replace(/\*/g, ''));
            }
        }

        return false;
    }

    /**
     * Finds all cloud accounts within an environment that match the current URL.
     * Also returns all accounts if the URL matches the environment's template patterns.
     * Also checks environment-level account patterns.
     * 
     * @param environment The cloud environment to search within
     * @param currentUrl The URL to match against
     * @param currentHost The host to match against
     * @returns Array of matching CloudAccount objects
     */
    static findMatchingAccounts(environment: CloudEnvironment, currentUrl: string, currentHost: string): CloudAccount[] {
        if (!environment.enable || !environment.accounts || environment.accounts.length === 0) {
            return [];
        }

        // Check each account's account patterns first
        const matchingAccounts: CloudAccount[] = [];

        for (const account of environment.accounts) {
            if (!account.enable) continue;

            // Check if account has account patterns
            if (account.accountPatterns && account.accountPatterns.length > 0) {
                const matchingPatterns = account.accountPatterns.filter(pattern =>
                    this.isAccountPatternMatch(pattern, currentUrl, currentHost)
                );

                if (matchingPatterns.length > 0) {
                    matchingAccounts.push(account);
                    continue;
                }
            }

            // Fall back to checking account's own match pattern
            if (this.isCloudAccountMatch(account, currentUrl, currentHost)) {
                matchingAccounts.push(account);
            }
        }

        // If no accounts matched, check if URL matches environment template patterns
        if (matchingAccounts.length === 0 && this.isEnvironmentTemplateMatch(environment, currentUrl)) {
            return environment.accounts.filter(account => account.enable);
        }

        return matchingAccounts;
    }

    /**
     * Finds all cloud accounts within an environment that match the current URL,
     * including disabled accounts. This is used for popup display to show all
     * matching accounts with their toggle state.
     * 
     * @param environment The cloud environment to search within
     * @param currentUrl The URL to match against
     * @param currentHost The host to match against
     * @returns Array of matching CloudAccount objects (including disabled ones)
     */
    static findMatchingAccountsWithDisabled(environment: CloudEnvironment, currentUrl: string, currentHost: string): CloudAccount[] {
        if (!environment.enable || !environment.accounts || environment.accounts.length === 0) {
            return [];
        }

        // Check each account's account patterns first (including disabled accounts)
        const matchingAccounts: CloudAccount[] = [];

        for (const account of environment.accounts) {
            // Check if account has account patterns
            if (account.accountPatterns && account.accountPatterns.length > 0) {
                const matchingPatterns = account.accountPatterns.filter(pattern =>
                    this.isAccountPatternMatch(pattern, currentUrl, currentHost)
                );

                if (matchingPatterns.length > 0) {
                    matchingAccounts.push(account);
                    continue;
                }
            }

            // Fall back to checking account's own match pattern (including disabled accounts)
            // Create a temporary enabled version to check pattern match
            const tempEnabledAccount = { ...account, enable: true };
            if (this.isCloudAccountMatch(tempEnabledAccount, currentUrl, currentHost)) {
                matchingAccounts.push(account);
            }
        }

        // If no accounts matched, check if URL matches environment template patterns
        if (matchingAccounts.length === 0 && this.isEnvironmentTemplateMatch(environment, currentUrl)) {
            return environment.accounts;
        }

        return matchingAccounts;
    }

    /**
     * Finds all cloud environments that have at least one matching account for the current URL.
     * 
     * @param environments Array of cloud environments to check
     * @param currentUrl The URL to match against
     * @param currentHost The host to match against
     * @returns Array of CloudEnvironment objects that have matching accounts
     */
    static findMatchingEnvironments(environments: CloudEnvironment[], currentUrl: string, currentHost: string): CloudEnvironment[] {
        if (!environments || environments.length === 0) {
            return [];
        }

        return environments.filter(environment => {
            const matchingAccounts = this.findMatchingAccounts(environment, currentUrl, currentHost);
            return matchingAccounts.length > 0;
        });
    }

    /**
     * Gets comprehensive matching information for a cloud account (for logging purposes).
     * 
     * @param account The cloud account configuration
     * @returns Formatted string with matching information
     */
    static getCloudAccountMatchInfo(account: CloudAccount): string {
        const patternCount = account.accountPatterns?.length || 0;
        return `[CloudMatch] Account: ${account.name} | Patterns: ${patternCount}`;
    }

    /**
     * Gets comprehensive matching information for a cloud role (for logging purposes).
     * 
     * @param role The cloud role configuration
     * @returns Formatted string with role information
     */
    static getCloudRoleMatchInfo(role: CloudRole): string {
        return `[CloudMatch] Role Pattern: ${role.matchPattern} | Value: ${role.matchValue}`;
    }

    /**
     * Checks if a URL matches any cloud environment's template patterns.
     * This is useful for determining if cloud highlighting should be activated.
     * 
     * @param environments Array of cloud environments to check
     * @param currentUrl The URL to check
     * @param currentHost The host to check
     * @returns boolean indicating if this is a cloud environment URL
     */
    static isCloudEnvironmentUrl(environments: CloudEnvironment[], currentUrl: string, currentHost: string): boolean {
        if (!environments || environments.length === 0) {
            return false;
        }

        return environments.some(environment => {
            if (!environment.enable || !environment.template) {
                return false;
            }

            const template = environment.template;
            
            // Check account selection URL
            if (template.accountSelectionUrl && currentUrl.includes(template.accountSelectionUrl)) {
                return true;
            }

            // Check console domain pattern
            if (template.consoleDomainPattern) {
                // Convert simple wildcard pattern to regex-like matching
                // Handle patterns like "*://*.amazonaws.cn/*"
                let pattern = template.consoleDomainPattern;
                
                // First escape dots that are not part of wildcards
                pattern = pattern.replace(/\./g, '\\.');
                // Then handle wildcards
                pattern = pattern.replace(/\*:/g, 'https?:');  // Replace *: with https?:
                pattern = pattern.replace(/\*\\\./g, '.*\\.');   // Replace *\. with .*\.
                pattern = pattern.replace(/\*/g, '.*');        // Replace remaining * with .*
                
                try {
                    const regex = new RegExp('^' + pattern + '$');
                    return regex.test(currentUrl);
                } catch (e) {
                    // Fallback to simple string matching if regex fails
                    return currentUrl.includes(template.consoleDomainPattern.replace(/\*/g, ''));
                }
            }

            return false;
        });
    }
}