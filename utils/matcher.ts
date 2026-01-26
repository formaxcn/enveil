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
                // Auto Match implementation
                const val = site.matchValue?.trim();
                if (!val) return false;

                // 1. Explicit Wildcard
                if (val === '*') return true;

                // 2. Exact URL Match
                if (currentUrl === val) return true;

                // 3. Domain Match (Exact or Subdomain)
                if (currentHost === val || currentHost.endsWith('.' + val)) return true;

                // 4. URL Prefix Match (Intelligently handle missing protocol)
                if (currentUrl.startsWith(val)) return true;
                if (val.indexOf('://') === -1) {
                    if (currentUrl.startsWith('http://' + val) || currentUrl.startsWith('https://' + val)) return true;
                }

                // 5. Explicit Regex Detection: Only if it starts and ends with /
                if (val.startsWith('/') && val.endsWith('/') && val.length > 2) {
                    try {
                        const regex = new RegExp(val.slice(1, -1));
                        return regex.test(currentUrl);
                    } catch (e) {
                        // Invalid regex
                    }
                }

                return false;

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
