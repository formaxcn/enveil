import { Matcher } from './matcher';
import { CloudAccount, CloudRole, CloudEnvironment } from '../entrypoints/options/types';

/**
 * CloudMatcher extends the existing Matcher utility class for cloud-specific pattern matching.
 * Provides cloud account URL pattern matching and role keyword matching functionality.
 */
export class CloudMatcher extends Matcher {
    /**
     * Checks if a cloud account configuration matches the current URL/host.
     * Uses the same matching logic as the base Matcher class but for CloudAccount objects.
     * 
     * @param account The cloud account configuration to check
     * @param currentUrl The URL to match against
     * @param currentHost The host to match against
     * @returns boolean indicating if the account matches
     */
    static isCloudAccountMatch(account: CloudAccount, currentUrl: string, currentHost: string): boolean {
        if (!account.enable) return false;

        // Convert CloudAccount to SiteConfig-like structure for reusing base matching logic
        const siteConfigLike = {
            enable: account.enable,
            matchPattern: account.matchPattern,
            matchValue: account.matchValue,
            envName: account.name, // Not used in matching logic
            color: account.color, // Not used in matching logic
            backgroudEnable: account.backgroundEnable, // Not used in matching logic
            Position: '', // Not used in matching logic
            flagEnable: false // Not used in matching logic
        };

        return this.isMatch(siteConfigLike, currentUrl, currentHost);
    }

    /**
     * Finds all cloud roles that have keywords matching the provided page content.
     * Performs case-insensitive keyword matching against the page content.
     * 
     * @param roles Array of cloud roles to check
     * @param pageContent The page content to search for keywords
     * @returns Array of CloudRole objects that have matching keywords
     */
    static findMatchingRoles(roles: CloudRole[], pageContent: string): CloudRole[] {
        if (!roles || roles.length === 0 || !pageContent) {
            return [];
        }

        const matchingRoles: CloudRole[] = [];
        const lowerPageContent = pageContent.toLowerCase();

        for (const role of roles) {
            if (!role.enable || !role.keywords || role.keywords.length === 0) {
                continue;
            }

            // Check if any of the role's keywords match the page content
            const hasMatchingKeyword = role.keywords.some(keyword => {
                if (!keyword || keyword.trim() === '') {
                    return false;
                }
                
                const lowerKeyword = keyword.toLowerCase().trim();
                return lowerPageContent.includes(lowerKeyword);
            });

            if (hasMatchingKeyword) {
                matchingRoles.push(role);
            }
        }

        return matchingRoles;
    }

    /**
     * Extracts role keywords from page content that match any of the provided roles.
     * Returns the actual keyword strings found in the content for highlighting purposes.
     * 
     * @param content The page content to search
     * @param roles Array of cloud roles with keywords to search for
     * @returns Array of keyword strings found in the content
     */
    static extractRoleKeywords(content: string, roles: CloudRole[]): string[] {
        if (!content || !roles || roles.length === 0) {
            return [];
        }

        const foundKeywords: string[] = [];
        const lowerContent = content.toLowerCase();

        for (const role of roles) {
            if (!role.enable || !role.keywords || role.keywords.length === 0) {
                continue;
            }

            for (const keyword of role.keywords) {
                if (!keyword || keyword.trim() === '') {
                    continue;
                }

                const lowerKeyword = keyword.toLowerCase().trim();
                if (lowerContent.includes(lowerKeyword)) {
                    // Add the original keyword (preserving case) if not already added
                    if (!foundKeywords.some(k => k.toLowerCase() === lowerKeyword)) {
                        foundKeywords.push(keyword.trim());
                    }
                }
            }
        }

        return foundKeywords;
    }

    /**
     * Finds all cloud accounts within an environment that match the current URL.
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

        return environment.accounts.filter(account => 
            this.isCloudAccountMatch(account, currentUrl, currentHost)
        );
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
        return `[CloudMatch] Account: ${account.name} | Pattern: ${account.matchPattern} | Value: ${account.matchValue}`;
    }

    /**
     * Gets comprehensive matching information for a cloud role (for logging purposes).
     * 
     * @param role The cloud role configuration
     * @returns Formatted string with role information
     */
    static getCloudRoleMatchInfo(role: CloudRole): string {
        const keywords = role.keywords ? role.keywords.join(', ') : 'none';
        return `[CloudMatch] Role: ${role.name} | Keywords: ${keywords}`;
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