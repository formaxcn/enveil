import { SiteConfig } from '../entrypoints/options/types';

export class Matcher {
    /**
     * Checks if a site configuration matches the current URL/host.
     * @param site The site configuration to check
     * @param currentUrl The URL to match against (defaults to window.location.href)
     * @param currentHost The host to match against (defaults to window.location.host)
     * @returns boolean
     */
    static isMatch(site: SiteConfig, currentUrl: string, currentHost: string): boolean {
        if (!site.enable) return false;

        switch (site.matchPattern) {
            case 'everything':
                return true;

            case 'domain':
                return currentHost === site.matchValue || currentHost.endsWith('.' + site.matchValue);

            case 'urlPrefix':
                return currentUrl.startsWith(site.matchValue);

            case 'url':
                return currentUrl === site.matchValue;

            case 'regex':
                try {
                    const regex = new RegExp(site.matchValue);
                    return regex.test(currentUrl);
                } catch (e) {
                    console.error('[Enveil] Invalid regex:', site.matchValue);
                    return false;
                }

            default:
                return false;
        }
    }

    /**
     * Utility to get matching info for logging
     */
    static getMatchInfo(site: SiteConfig): string {
        return `[Match] Group Rule: ${site.envName} | Pattern: ${site.matchPattern} | Value: ${site.matchValue}`;
    }
}
