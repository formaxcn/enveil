import { CloudAccount, CloudRole, CloudEnvironment, CloudProvider } from '../../entrypoints/options/types';
import { logger, Component, log, warn, error } from '../../utils/logger';

/**
 * Generic Account Selection Handler
 * Used for custom cloud providers with configurable selectors
 */
export class GenericAccountSelectionHandler {
    private static readonly ACCOUNT_HIGHLIGHT_CLASS = 'enveil-generic-account-highlight';
    private static readonly ROLE_HIGHLIGHT_CLASS = 'enveil-generic-role-highlight';
    private static readonly STYLE_ID = 'enveil-generic-account-selection-styles';

    private highlightedAccounts: Map<string, HTMLElement[]> = new Map();
    private highlightedRoles: HTMLElement[] = [];
    private styleElement: HTMLStyleElement | null = null;
    private mutationObserver: MutationObserver | null = null;
    private currentEnvironment: CloudEnvironment | null = null;

    /**
     * Applies highlighting to generic account selection page.
     */
    public applyHighlighting(environment: CloudEnvironment, accounts: CloudAccount[]): void {
        if (!environment || !accounts || accounts.length === 0) {
            return;
        }

        this.currentEnvironment = environment;
        const enabledAccounts = accounts.filter(acc => acc.enable);

        this.removeHighlighting();
        this.createStyles();

        for (const account of enabledAccounts) {
            this.highlightAccount(account);
        }

        this.setupMutationObserver();

        log(Component.GENERIC_ACCOUNT_SELECTION, `Applied highlighting for ${enabledAccounts.length} accounts`);
    }

    /**
     * Removes all highlighting from the page.
     */
    public removeHighlighting(): void {
        this.highlightedAccounts.forEach((elements) => {
            elements.forEach(el => {
                el.style.backgroundColor = '';
                el.style.border = '';
                el.style.boxShadow = '';
                el.removeAttribute('data-enveil-account-id');
                el.classList.remove(GenericAccountSelectionHandler.ACCOUNT_HIGHLIGHT_CLASS);
            });
        });
        this.highlightedAccounts.clear();

        this.highlightedRoles.forEach(el => {
            const parent = el.parentNode;
            if (parent) {
                const originalText = el.getAttribute('data-original-text');
                if (originalText) {
                    const textNode = document.createTextNode(originalText);
                    parent.replaceChild(textNode, el);
                }
            }
        });
        this.highlightedRoles = [];

        if (this.styleElement) {
            this.styleElement.remove();
            this.styleElement = null;
        }

        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
    }

    /**
     * Highlights a specific account container.
     */
    private highlightAccount(account: CloudAccount): void {
        const selectors = this.currentEnvironment?.template?.selectors?.accountSelection;
        if (!selectors) return;

        const containers = this.findAccountContainers(selectors.accountContainers, account);

        if (containers.length === 0) {
            log(Component.GENERIC_ACCOUNT_SELECTION, `No containers found for account: ${account.name}`);
            return;
        }

        this.highlightedAccounts.set(account.id, containers);

        containers.forEach(container => {
            this.applyAccountBackground(container, account);

            if (account.roles && account.roles.length > 0) {
                const highlightColor = account.highlightEnable ? account.highlightColor : undefined;
                this.highlightRolesInContainer(container, account.roles, highlightColor);
            }
        });

        log(Component.GENERIC_ACCOUNT_SELECTION, `Highlighted account: ${account.name} (${containers.length} containers)`);
    }

    /**
     * Finds account containers that match the given account.
     */
    private findAccountContainers(selectors: string[], account: CloudAccount): HTMLElement[] {
        const containers: HTMLElement[] = [];

        log(Component.GENERIC_ACCOUNT_SELECTION, `findAccountContainers: selectors=${JSON.stringify(selectors)}, account=${account.name}`);

        for (const selector of selectors) {
            if (!selector) continue;

            try {
                const elements = document.querySelectorAll<HTMLElement>(selector);
                log(Component.GENERIC_ACCOUNT_SELECTION, `findAccountContainers: Selector "${selector}" found ${elements.length} elements`);

                elements.forEach((el, index) => {
                    log(Component.GENERIC_ACCOUNT_SELECTION, `findAccountContainers: Checking element ${index}`);
                    const isMatch = this.isAccountMatch(el, account);
                    const hasRoles = this.hasRoleElements(el);
                    log(Component.GENERIC_ACCOUNT_SELECTION, `findAccountContainers: Element ${index} - isMatch=${isMatch}, hasRoles=${hasRoles}`);
                    
                    // Only match elements that contain account identifier
                    // and have role elements as children (to avoid matching wrapper/parent elements)
                    if (isMatch && hasRoles) {
                        log(Component.GENERIC_ACCOUNT_SELECTION, `findAccountContainers: -> MATCHED! Adding element ${index}`);
                        containers.push(el);
                    }
                });
            } catch (e) {
                warn(Component.GENERIC_ACCOUNT_SELECTION, `Invalid selector: ${selector}`, e);
            }
        }

        log(Component.GENERIC_ACCOUNT_SELECTION, `findAccountContainers: Total containers found: ${containers.length}`);
        return containers;
    }

    /**
     * Checks if an element contains role elements.
     * This helps distinguish actual account containers from wrapper elements.
     */
    private hasRoleElements(element: HTMLElement): boolean {
        // Check for role radio buttons or checkboxes
        const radioButtons = element.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        const hasRadioButtons = radioButtons.length > 0;
        
        // Check for role elements using configured selectors
        const roleSelectors = this.currentEnvironment?.template?.selectors?.accountSelection?.roleElements || [];
        let hasRoleNames = false;
        for (const selector of roleSelectors) {
            if (element.querySelector(selector)) {
                hasRoleNames = true;
                break;
            }
        }
        
        log(Component.GENERIC_ACCOUNT_SELECTION, `hasRoleElements: hasRadioButtons=${hasRadioButtons} (${radioButtons.length} buttons), hasRoleNames=${hasRoleNames}`);
        
        // For generic providers, be flexible about role elements
        return hasRadioButtons || hasRoleNames || true;
    }

    /**
     * Checks if an account container matches the given account.
     */
    private isAccountMatch(element: HTMLElement, account: CloudAccount): boolean {
        const accountName = account.name?.trim();
        const patterns = account.accountPatterns || [];

        log(Component.GENERIC_ACCOUNT_SELECTION, `isAccountMatch: accountName="${accountName}", patterns=${patterns.length}`);

        if (!accountName && patterns.length === 0) {
            log(Component.GENERIC_ACCOUNT_SELECTION, `isAccountMatch: No accountName or patterns, returning false`);
            return false;
        }

        // Find the account name element within this container
        let accountNameElement: Element | null = null;
        
        // Try various common selectors for account name elements
        const accountNameSelectors = [
            // Configured role elements (might contain account names too)
            ...(this.currentEnvironment?.template?.selectors?.accountSelection?.roleElements || []),
            // Common account name selectors
            '.saml-account-name',
            '.account-name',
            '[data-testid="account-name"]',
            'td',                            // Fallback to table cells
            'div'                            // Final fallback
        ];
        
        // Try all selectors
        for (const selector of accountNameSelectors) {
            try {
                accountNameElement = element.querySelector(selector);
                if (accountNameElement) {
                    log(Component.GENERIC_ACCOUNT_SELECTION, `isAccountMatch: Found account name element with selector "${selector}"`);
                    break;
                }
            } catch (e) {
                warn(Component.GENERIC_ACCOUNT_SELECTION, `Invalid selector: ${selector}`, e);
            }
        }
        
        if (!accountNameElement) {
            log(Component.GENERIC_ACCOUNT_SELECTION, `isAccountMatch: No account name element found`);
            return false;
        }

        // Get the text content of the account name element only
        const accountNameText = accountNameElement.textContent || '';
        log(Component.GENERIC_ACCOUNT_SELECTION, `isAccountMatch: accountNameText="${accountNameText}"`);

        // Check all account patterns
        for (const pattern of patterns) {
            if (!pattern.enable) continue;
            
            const matchValue = pattern.matchValue?.trim();
            if (!matchValue) continue;
            
            log(Component.GENERIC_ACCOUNT_SELECTION, `isAccountMatch: Checking pattern "${matchValue}"`);
            
            // For AWS, check for 12-digit account ID pattern with word boundaries
            if (/^\d{12}$/.test(matchValue)) {
                const accountIdPattern = new RegExp(`\\b${matchValue}\\b`);
                const isMatch = accountIdPattern.test(accountNameText);
                log(Component.GENERIC_ACCOUNT_SELECTION, `isAccountMatch: 12-digit ID pattern result=${isMatch}`);
                if (isMatch) return true;
            } else {
                // For non-numeric match values, use flexible matching (no word boundaries)
                const escapedMatchValue = matchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const matchPattern = new RegExp(escapedMatchValue, 'i');
                const isMatch = matchPattern.test(accountNameText);
                log(Component.GENERIC_ACCOUNT_SELECTION, `isAccountMatch: Pattern "${matchPattern}" result=${isMatch}`);
                if (isMatch) return true;
            }
        }

        // Check account name with flexible matching (no word boundaries)
        if (accountName) {
            const escapedAccountName = accountName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const namePattern = new RegExp(escapedAccountName, 'i');
            const isMatch = namePattern.test(accountNameText);
            log(Component.GENERIC_ACCOUNT_SELECTION, `isAccountMatch: Account name "${accountName}" pattern "${namePattern}" result=${isMatch}`);
            if (isMatch) {
                return true;
            }
        }

        log(Component.GENERIC_ACCOUNT_SELECTION, `isAccountMatch: No match found, returning false`);
        return false;
    }

    /**
     * Applies background color to an account container.
     */
    private applyAccountBackground(element: HTMLElement, account: CloudAccount): void {
        if (!account.backgroundEnable || !account.backgroundColor) {
            return;
        }

        element.style.backgroundColor = this.hexToRgba(account.backgroundColor, 0.25);
        element.style.border = `2px solid ${account.backgroundColor}`;
        element.style.boxShadow = `0 0 8px ${this.hexToRgba(account.backgroundColor, 0.35)}`;
        element.style.borderRadius = '4px';
        element.style.transition = 'all 0.3s ease';

        element.setAttribute('data-enveil-account-id', account.id);
        element.classList.add(GenericAccountSelectionHandler.ACCOUNT_HIGHLIGHT_CLASS);
    }

    /**
     * Highlights role keywords within an account container.
     */
    private highlightRolesInContainer(container: HTMLElement, roles: CloudRole[], highlightColor?: string): void {
        const enabledRoles = roles.filter(role => role.enable && role.matchValue && role.matchValue.trim().length > 0);

        const selectors = this.currentEnvironment?.template?.selectors?.accountSelection?.roleElements || [];

        const searchRoots: HTMLElement[] = selectors.length > 0
            ? selectors.map(sel => {
                try {
                    return Array.from(container.querySelectorAll<HTMLElement>(sel));
                } catch (e) {
                    return [];
                }
            }).flat()
            : [container];

        for (const root of searchRoots) {
            if (!root) continue;
            this.highlightRoleKeywordsInElement(root, enabledRoles, highlightColor);
        }
    }

    /**
     * Highlights role patterns within a specific element.
     */
    private highlightRoleKeywordsInElement(element: HTMLElement, roles: CloudRole[], highlightColor?: string): void {
        for (const role of roles) {
            if (!role.matchValue || role.matchValue.trim().length === 0) continue;

            const matchValue = role.matchValue.trim();
            let regex: RegExp | null = null;

            if (role.matchPattern === 'regex') {
                try {
                    regex = new RegExp(`(${matchValue})`, 'gi');
                } catch (e) {
                    error(Component.GENERIC_ACCOUNT_SELECTION, 'Invalid role regex:', matchValue);
                    continue;
                }
            } else {
                regex = new RegExp(`(${this.escapeRegExp(matchValue)})`, 'gi');
            }

            if (!regex) continue;

            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        const parent = node.parentElement;
                        if (!parent) return NodeFilter.FILTER_REJECT;

                        const tagName = parent.tagName.toLowerCase();
                        if (['script', 'style', 'noscript'].includes(tagName)) {
                            return NodeFilter.FILTER_REJECT;
                        }

                        if (parent.classList.contains(GenericAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS)) {
                            return NodeFilter.FILTER_REJECT;
                        }

                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );

            const textNodes: Text[] = [];
            let node;
            while (node = walker.nextNode()) {
                textNodes.push(node as Text);
            }

            const className = `${GenericAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS}-${role.id}`;

            textNodes.forEach(textNode => {
                const originalText = textNode.textContent || '';
                
                if (!regex.test(originalText)) return;

                const modifiedText = originalText.replace(
                    regex,
                    `<span class="${className} ${GenericAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS}" data-role-id="${role.id}" data-original-text="$1">$1</span>`
                );

                if (modifiedText !== originalText && textNode.parentNode) {
                    const wrapper = document.createElement('span');
                    wrapper.innerHTML = modifiedText;

                    const highlightedElements = wrapper.querySelectorAll(`.${GenericAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS}`);
                    highlightedElements.forEach(el => {
                        this.highlightedRoles.push(el as HTMLElement);
                        this.applyRoleHighlightStyle(el as HTMLElement, role, highlightColor);
                    });

                    textNode.parentNode.replaceChild(wrapper, textNode);
                }
            });
        }
    }

    /**
     * Applies highlight style to a role element.
     */
    private applyRoleHighlightStyle(element: HTMLElement, role: CloudRole, highlightColor?: string): void {
        // Use configured highlight color or default
        const bgColor = highlightColor || '#bee3f8';
        const textColor = this.getContrastColor(bgColor);
        const borderColor = this.darkenColor(bgColor, 20);
        
        Object.assign(element.style, {
            color: textColor,
            backgroundColor: this.hexToRgba(bgColor, 0.85),
            fontWeight: '600',
            textDecoration: 'none',
            border: `1px solid ${borderColor}`,
            padding: '1px 4px',
            borderRadius: '3px',
            display: 'inline'
        });
    }

    /**
     * Creates CSS styles for highlighting.
     */
    private createStyles(): void {
        if (this.styleElement) return;

        this.styleElement = document.createElement('style');
        this.styleElement.id = GenericAccountSelectionHandler.STYLE_ID;

        this.styleElement.textContent = `
            .${GenericAccountSelectionHandler.ACCOUNT_HIGHLIGHT_CLASS} {
                transition: all 0.3s ease !important;
            }
            .${GenericAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS} {
                display: inline !important;
            }
        `;

        document.head.appendChild(this.styleElement);
    }

    /**
     * Sets up mutation observer for dynamic content changes.
     */
    private setupMutationObserver(): void {
        if (typeof MutationObserver === 'undefined') return;

        this.mutationObserver = new MutationObserver((mutations) => {
            let shouldReapply = false;

            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of Array.from(mutation.addedNodes)) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            shouldReapply = true;
                            break;
                        }
                    }
                }
                if (shouldReapply) break;
            }

            if (shouldReapply && this.currentEnvironment) {
                clearTimeout((this as any)._reapplyTimeout);
                (this as any)._reapplyTimeout = setTimeout(() => {
                    this.reapplyHighlighting();
                }, 100);
            }
        });

        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Re-applies highlighting to newly added content.
     */
    private reapplyHighlighting(): void {
        if (!this.currentEnvironment) return;

        const accounts = this.currentEnvironment.accounts?.filter(acc => acc.enable) || [];

        for (const account of accounts) {
            const selectors = this.currentEnvironment.template?.selectors?.accountSelection;
            if (!selectors) continue;

            const existingContainers = this.highlightedAccounts.get(account.id) || [];

            for (const selector of selectors.accountContainers) {
                if (!selector) continue;

                try {
                    const elements = document.querySelectorAll<HTMLElement>(selector);

                    elements.forEach(el => {
                        if (existingContainers.includes(el)) return;

                        if (this.isAccountMatch(el, account)) {
                            existingContainers.push(el);
                            this.applyAccountBackground(el, account);

                            if (account.roles && account.roles.length > 0) {
                                this.highlightRolesInContainer(el, account.roles);
                            }
                        }
                    });
                } catch (e) {
                    warn(Component.GENERIC_ACCOUNT_SELECTION, `Invalid selector during reapply: ${selector}`, e);
                }
            }

            this.highlightedAccounts.set(account.id, existingContainers);
        }
    }

    /**
     * Converts hex color to rgba with alpha.
     */
    private hexToRgba(hex: string, alpha: number): string {
        hex = hex.replace('#', '');

        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }

        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Gets contrast color (black or white) for given background color
     */
    private getContrastColor(hexColor: string): string {
        hexColor = hexColor.replace('#', '');
        if (hexColor.length === 3) {
            hexColor = hexColor.split('').map(c => c + c).join('');
        }

        const r = parseInt(hexColor.substring(0, 2), 16);
        const g = parseInt(hexColor.substring(2, 4), 16);
        const b = parseInt(hexColor.substring(4, 6), 16);

        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#1a365d' : '#ffffff';
    }

    /**
     * Darkens a hex color by percentage
     */
    private darkenColor(hexColor: string, percent: number): string {
        hexColor = hexColor.replace('#', '');
        if (hexColor.length === 3) {
            hexColor = hexColor.split('').map(c => c + c).join('');
        }

        let r = parseInt(hexColor.substring(0, 2), 16);
        let g = parseInt(hexColor.substring(2, 4), 16);
        let b = parseInt(hexColor.substring(4, 6), 16);

        r = Math.floor(r * (100 - percent) / 100);
        g = Math.floor(g * (100 - percent) / 100);
        b = Math.floor(b * (100 - percent) / 100);

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    /**
     * Escapes special regex characters.
     */
    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
