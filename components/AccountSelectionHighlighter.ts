import { CloudAccount, CloudRole, CloudEnvironment, CloudProvider, RoleHighlightStyle } from '../entrypoints/options/types';

/**
 * Base interface for account selection page handlers
 */
interface IAccountSelectionHandler {
    applyHighlighting(environment: CloudEnvironment, accounts: CloudAccount[]): void;
    removeHighlighting(): void;
}

/**
 * AWS Account Selection Page Handler
 * Specifically designed for AWS SAML account selection pages
 */
class AWSAccountSelectionHandler implements IAccountSelectionHandler {
    private static readonly ACCOUNT_HIGHLIGHT_CLASS = 'enveil-aws-account-highlight';
    private static readonly ROLE_HIGHLIGHT_CLASS = 'enveil-aws-role-highlight';
    private static readonly STYLE_ID = 'enveil-aws-account-selection-styles';

    private highlightedAccounts: Map<string, HTMLElement[]> = new Map();
    private highlightedRoles: HTMLElement[] = [];
    private styleElement: HTMLStyleElement | null = null;
    private mutationObserver: MutationObserver | null = null;
    private currentEnvironment: CloudEnvironment | null = null;

    /**
     * Applies highlighting to AWS account selection page.
     * 
     * AWS SAML page structure:
     * - Account containers: fieldset > div.saml-account
     * - Account name: .saml-account-name or first label
     * - Role containers: .saml-role within account
     * - Role names: .saml-role-name
     */
    public applyHighlighting(environment: CloudEnvironment, accounts: CloudAccount[]): void {
        if (!environment || !accounts || accounts.length === 0) {
            return;
        }

        this.currentEnvironment = environment;
        const enabledAccounts = accounts.filter(acc => acc.enable);

        // Remove existing highlighting
        this.removeHighlighting();

        // Create styles
        this.createStyles();

        // Apply highlighting for each account
        for (const account of enabledAccounts) {
            this.highlightAccount(account);
        }

        // Setup mutation observer for dynamic content
        this.setupMutationObserver();

        console.log(`[AWSAccountSelectionHandler] Applied highlighting for ${enabledAccounts.length} accounts`);
    }

    /**
     * Removes all highlighting from the page.
     */
    public removeHighlighting(): void {
        // Remove account highlights
        this.highlightedAccounts.forEach((elements) => {
            elements.forEach(el => {
                el.style.backgroundColor = '';
                el.style.border = '';
                el.style.boxShadow = '';
                el.removeAttribute('data-enveil-account-id');
                el.classList.remove(AWSAccountSelectionHandler.ACCOUNT_HIGHLIGHT_CLASS);
            });
        });
        this.highlightedAccounts.clear();

        // Remove role highlights
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

        // Remove style element
        if (this.styleElement) {
            this.styleElement.remove();
            this.styleElement = null;
        }

        // Disconnect observer
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
    }

    /**
     * Highlights a specific AWS account container.
     */
    private highlightAccount(account: CloudAccount): void {
        // Get selectors from environment template
        const selectors = this.currentEnvironment?.template?.selectors?.accountSelection;
        const accountContainerSelectors = selectors?.accountContainers || [
            'fieldset > div.saml-account:has(> .expandable-container .saml-account-name)'
        ];

        const containers = this.findAccountContainers(accountContainerSelectors, account);

        if (containers.length === 0) {
            console.log(`[AWSAccountSelectionHandler] No containers found for account: ${account.name}`);
            return;
        }

        this.highlightedAccounts.set(account.id, containers);

        containers.forEach(container => {
            this.applyAccountBackground(container, account);

            // Highlight role keywords within this container
            if (account.roles && account.roles.length > 0) {
                this.highlightRolesInContainer(container, account.roles);
            }
        });

        console.log(`[AWSAccountSelectionHandler] Highlighted account: ${account.name} (${containers.length} containers)`);
    }

    /**
     * Finds AWS account containers that match the given account.
     */
    private findAccountContainers(selectors: string[], account: CloudAccount): HTMLElement[] {
        const containers: HTMLElement[] = [];

        console.log(`[AWSAccountSelectionHandler] Finding containers for account: ${account.name}, patterns: ${account.accountPatterns?.length || 0}`);

        for (const selector of selectors) {
            if (!selector) continue;

            try {
                const elements = document.querySelectorAll<HTMLElement>(selector);
                console.log(`[AWSAccountSelectionHandler] Selector "${selector}" found ${elements.length} elements`);

                elements.forEach((el, index) => {
                    // Check if it's an actual account container
                    const isActualContainer = this.isActualAccountContainer(el);
                    // Check if it matches the account
                    const isMatch = this.isAccountMatch(el, account);

                    console.log(`[AWSAccountSelectionHandler] Element ${index}: isActualContainer=${isActualContainer}, isMatch=${isMatch}`);

                    // Only match elements that:
                    // 1. Contain the account identifier (account ID or name)
                    // 2. Have radio buttons for roles (actual account container)
                    if (isMatch && isActualContainer) {
                        console.log(`[AWSAccountSelectionHandler] -> MATCHED! Adding container ${index}`);
                        containers.push(el);
                    }
                });
            } catch (e) {
                console.warn(`[AWSAccountSelectionHandler] Invalid selector: ${selector}`, e);
            }
        }

        console.log(`[AWSAccountSelectionHandler] Total containers found: ${containers.length}`);
        return containers;
    }

    /**
     * Checks if an element is an actual account container (not a wrapper).
     * An actual account container must have radio buttons for role selection.
     */
    private isActualAccountContainer(element: HTMLElement): boolean {
        // Check for role radio buttons - this is the key indicator of an actual account container
        const radioButtons = element.querySelectorAll('input[type="radio"]');
        const hasSamlAccountClass = element.classList.contains('saml-account');

        console.log(`[AWSAccountSelectionHandler] isActualAccountContainer: radioButtons=${radioButtons.length}, hasSamlAccountClass=${hasSamlAccountClass}`);

        // Must have at least one radio button (for role selection)
        if (radioButtons.length === 0) {
            return false;
        }

        // Additional check: the element should be a div.saml-account
        // This ensures we're matching the right level of element
        return hasSamlAccountClass;
    }

    /**
     * Checks if an AWS account container matches the given account.
     * Matches based on account name, ID, or other identifying text in the container.
     * Uses word boundary matching to avoid partial matches.
     * Checks the account name element specifically to avoid matching wrong containers.
     * Priority: matchValue (account ID) > accountName
     */
    private isAccountMatch(element: HTMLElement, account: CloudAccount): boolean {
        const accountName = account.name?.trim();
        const patterns = account.accountPatterns || [];

        console.log(`[AWSAccountSelectionHandler] isAccountMatch: accountName="${accountName}", patterns=${patterns.length}`);

        if (!accountName && patterns.length === 0) {
            console.log(`[AWSAccountSelectionHandler] isAccountMatch: No accountName or patterns, returning false`);
            return false;
        }

        // Find the account name element within this container
        // AWS SAML pages have .saml-account-name element with the account info
        const accountNameElement = element.querySelector('.saml-account-name');
        if (!accountNameElement) {
            console.log(`[AWSAccountSelectionHandler] isAccountMatch: No .saml-account-name element found`);
            return false;
        }

        // Get the text content of the account name element only
        const accountNameText = accountNameElement.textContent || '';
        console.log(`[AWSAccountSelectionHandler] isAccountMatch: accountNameText="${accountNameText}"`);

        // Check all account patterns
        for (const pattern of patterns) {
            if (!pattern.enable) continue;
            
            const matchValue = pattern.matchValue?.trim();
            if (!matchValue) continue;
            
            // For AWS, check for 12-digit account ID pattern with word boundaries
            if (/^\d{12}$/.test(matchValue)) {
                const accountIdPattern = new RegExp(`\\b${matchValue}\\b`);
                const isMatch = accountIdPattern.test(accountNameText);
                console.log(`[AWSAccountSelectionHandler] isAccountMatch: Checking 12-digit ID "${matchValue}" against "${accountNameText}", result=${isMatch}`);
                if (isMatch) return true;
            } else {
                // For non-numeric match values, use word boundary matching
                const escapedMatchValue = matchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const matchPattern = new RegExp(
                    `\\b${escapedMatchValue}\\b|\\(${escapedMatchValue}\\)`,
                    'i'
                );
                const isMatch = matchPattern.test(accountNameText);
                console.log(`[AWSAccountSelectionHandler] isAccountMatch: Checking pattern "${matchPattern}" against "${accountNameText}", result=${isMatch}`);
                if (isMatch) return true;
            }
        }

        // Check account name with word boundaries
        if (accountName) {
            const escapedAccountName = accountName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const namePattern = new RegExp(`\\b${escapedAccountName}\\b`, 'i');
            const isMatch = namePattern.test(accountNameText);
            console.log(`[AWSAccountSelectionHandler] isAccountMatch: Checking account name "${accountName}" against "${accountNameText}", result=${isMatch}`);
            if (isMatch) {
                return true;
            }
        }

        console.log(`[AWSAccountSelectionHandler] isAccountMatch: No match found, returning false`);
        return false;
    }

    /**
     * Applies background color to an AWS account container.
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
        element.classList.add(AWSAccountSelectionHandler.ACCOUNT_HIGHLIGHT_CLASS);
    }

    /**
     * Highlights role keywords within an AWS account container.
     */
    private highlightRolesInContainer(container: HTMLElement, roles: CloudRole[]): void {
        const enabledRoles = roles.filter(role => role.enable && role.matchValue && role.matchValue.trim().length > 0);

        // Get role element selectors from template
        const selectors = this.currentEnvironment?.template?.selectors?.accountSelection?.roleElements || [
            '.saml-role-name',
            '.saml-role-description',
            'label.saml-role'
        ];

        // Find role elements within the container
        const roleElements: HTMLElement[] = [];
        for (const selector of selectors) {
            try {
                const elements = container.querySelectorAll<HTMLElement>(selector);
                elements.forEach(el => roleElements.push(el));
            } catch (e) {
                // Ignore invalid selectors
            }
        }

        // If no role elements found with specific selectors, fall back to searching for radio inputs
        // This ensures we only highlight containers that actually contain roles
        if (roleElements.length === 0) {
            const radioInputs = container.querySelectorAll('input[type="radio"]');
            radioInputs.forEach(radio => {
                const label = radio.closest('label');
                if (label) roleElements.push(label as HTMLElement);
            });
        }

        // If no specific role elements found, search entire container
        const searchRoots = roleElements.length > 0 ? roleElements : [container];

        for (const root of searchRoots) {
            this.highlightRoleKeywordsInElement(root, enabledRoles);
        }
    }

    /**
     * Highlights role patterns within a specific element.
     */
    private highlightRoleKeywordsInElement(element: HTMLElement, roles: CloudRole[]): void {
        for (const role of roles) {
            if (!role.matchValue || role.matchValue.trim() === '') continue;

            const matchValue = role.matchValue.trim();
            let regex: RegExp | null = null;

            if (role.matchPattern === 'regex') {
                try {
                    regex = new RegExp(`(${matchValue})`, 'gi');
                } catch (e) {
                    console.error('[Enveil] Invalid role regex:', matchValue);
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

                        if (parent.classList.contains(AWSAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS)) {
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

            const className = `${AWSAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS}-${role.id}`;

            textNodes.forEach(textNode => {
                const originalText = textNode.textContent || '';
                
                if (!regex.test(originalText)) return;

                const modifiedText = originalText.replace(
                    regex,
                    `<span class="${className} ${AWSAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS}" data-role-id="${role.id}" data-original-text="$1">$1</span>`
                );

                if (modifiedText !== originalText && textNode.parentNode) {
                    const wrapper = document.createElement('span');
                    wrapper.innerHTML = modifiedText;

                    const highlightedElements = wrapper.querySelectorAll(`.${AWSAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS}`);
                    highlightedElements.forEach(el => {
                        this.highlightedRoles.push(el as HTMLElement);
                        this.applyRoleHighlightStyle(el as HTMLElement, role);
                    });

                    textNode.parentNode.replaceChild(wrapper, textNode);
                }
            });
        }
    }

    /**
     * Applies highlight style to a role element.
     */
    private applyRoleHighlightStyle(element: HTMLElement, role: CloudRole): void {
        Object.assign(element.style, {
            color: '#000000',
            backgroundColor: '#ffeb3b',
            fontWeight: 'bold',
            textDecoration: 'none',
            border: 'none',
            padding: '1px 3px',
            borderRadius: '2px',
            display: 'inline'
        });
    }

    /**
     * Creates CSS styles for highlighting.
     */
    private createStyles(): void {
        if (this.styleElement) return;

        this.styleElement = document.createElement('style');
        this.styleElement.id = AWSAccountSelectionHandler.STYLE_ID;

        this.styleElement.textContent = `
            .${AWSAccountSelectionHandler.ACCOUNT_HIGHLIGHT_CLASS} {
                transition: all 0.3s ease !important;
            }
            .${AWSAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS} {
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

                        if (this.isAccountMatch(el, account) && this.isActualAccountContainer(el)) {
                            existingContainers.push(el);
                            this.applyAccountBackground(el, account);

                            if (account.roles && account.roles.length > 0) {
                                this.highlightRolesInContainer(el, account.roles);
                            }
                        }
                    });
                } catch (e) {
                    console.warn(`[AWSAccountSelectionHandler] Invalid selector during reapply: ${selector}`, e);
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
     * Escapes special regex characters.
     */
    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

/**
 * Generic Account Selection Handler
 * Used for custom cloud providers with configurable selectors
 */
class GenericAccountSelectionHandler implements IAccountSelectionHandler {
    private static readonly ACCOUNT_HIGHLIGHT_CLASS = 'enveil-generic-account-highlight';
    private static readonly ROLE_HIGHLIGHT_CLASS = 'enveil-generic-role-highlight';
    private static readonly STYLE_ID = 'enveil-generic-account-selection-styles';

    private highlightedAccounts: Map<string, HTMLElement[]> = new Map();
    private highlightedRoles: HTMLElement[] = [];
    private styleElement: HTMLStyleElement | null = null;
    private mutationObserver: MutationObserver | null = null;
    private currentEnvironment: CloudEnvironment | null = null;

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

        console.log(`[GenericAccountSelectionHandler] Applied highlighting for ${enabledAccounts.length} accounts`);
    }

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

    private highlightAccount(account: CloudAccount): void {
        const selectors = this.currentEnvironment?.template?.selectors?.accountSelection;
        if (!selectors) return;

        const containers = this.findAccountContainers(selectors.accountContainers, account);

        if (containers.length === 0) {
            console.log(`[GenericAccountSelectionHandler] No containers found for account: ${account.name}`);
            return;
        }

        this.highlightedAccounts.set(account.id, containers);

        containers.forEach(container => {
            this.applyAccountBackground(container, account);

            if (account.roles && account.roles.length > 0) {
                this.highlightRolesInContainer(container, account.roles);
            }
        });

        console.log(`[GenericAccountSelectionHandler] Highlighted account: ${account.name} (${containers.length} containers)`);
    }

    private findAccountContainers(selectors: string[], account: CloudAccount): HTMLElement[] {
        const containers: HTMLElement[] = [];

        for (const selector of selectors) {
            if (!selector) continue;

            try {
                const elements = document.querySelectorAll<HTMLElement>(selector);

                elements.forEach(el => {
                    // Only match elements that contain account identifier
                    // and have role elements as children (to avoid matching wrapper/parent elements)
                    if (this.isAccountMatch(el, account) && this.hasRoleElements(el)) {
                        containers.push(el);
                    }
                });
            } catch (e) {
                console.warn(`[GenericAccountSelectionHandler] Invalid selector: ${selector}`, e);
            }
        }

        return containers;
    }

    /**
     * Checks if an element contains role elements.
     * This helps distinguish actual account containers from wrapper elements.
     */
    private hasRoleElements(element: HTMLElement): boolean {
        // Check for role radio buttons or checkboxes
        const hasRadioButtons = element.querySelectorAll('input[type="radio"], input[type="checkbox"]').length > 0;
        
        // Check for role elements using configured selectors
        const roleSelectors = this.currentEnvironment?.template?.selectors?.accountSelection?.roleElements || [];
        let hasRoleNames = false;
        for (const selector of roleSelectors) {
            if (element.querySelector(selector)) {
                hasRoleNames = true;
                break;
            }
        }
        
        // An account container should have role elements
        return hasRadioButtons || hasRoleNames;
    }

    private isAccountMatch(element: HTMLElement, account: CloudAccount): boolean {
        const accountName = account.name?.trim();
        const patterns = account.accountPatterns || [];

        if (!accountName && patterns.length === 0) return false;

        // Find the account name element within this container
        // Try common selectors for account name elements
        const accountNameElement = element.querySelector('.saml-account-name, .account-name, [data-testid="account-name"]');
        if (!accountNameElement) {
            return false;
        }

        // Get the text content of the account name element only
        const accountNameText = accountNameElement.textContent || '';

        // Check all account patterns
        for (const pattern of patterns) {
            if (!pattern.enable) continue;
            
            const matchValue = pattern.matchValue?.trim();
            if (!matchValue) continue;
            
            // For AWS, check for 12-digit account ID pattern with word boundaries
            if (/^\d{12}$/.test(matchValue)) {
                const accountIdPattern = new RegExp(`\\b${matchValue}\\b`);
                if (accountIdPattern.test(accountNameText)) return true;
            } else {
                // For non-numeric match values, use word boundary matching
                const escapedMatchValue = matchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const matchPattern = new RegExp(
                    `\\b${escapedMatchValue}\\b|\\(${escapedMatchValue}\\)`,
                    'i'
                );
                if (matchPattern.test(accountNameText)) return true;
            }
        }

        // Check account name with word boundaries
        if (accountName) {
            const escapedAccountName = accountName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const namePattern = new RegExp(`\\b${escapedAccountName}\\b`, 'i');
            if (namePattern.test(accountNameText)) {
                return true;
            }
        }

        return false;
    }

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

    private highlightRolesInContainer(container: HTMLElement, roles: CloudRole[]): void {
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
            this.highlightRoleKeywordsInElement(root, enabledRoles);
        }
    }

    private highlightRoleKeywordsInElement(element: HTMLElement, roles: CloudRole[]): void {
        for (const role of roles) {
            if (!role.matchValue || role.matchValue.trim().length === 0) continue;

            const matchValue = role.matchValue.trim();
            let regex: RegExp | null = null;

            if (role.matchPattern === 'regex') {
                try {
                    regex = new RegExp(`(${matchValue})`, 'gi');
                } catch (e) {
                    console.error('[Enveil] Invalid role regex:', matchValue);
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
                        this.applyRoleHighlightStyle(el as HTMLElement, role);
                    });

                    textNode.parentNode.replaceChild(wrapper, textNode);
                }
            });
        }
    }

    private applyRoleHighlightStyle(element: HTMLElement, role: CloudRole): void {
        Object.assign(element.style, {
            color: '#000000',
            backgroundColor: '#ffeb3b',
            fontWeight: 'bold',
            textDecoration: 'none',
            border: 'none',
            padding: '1px 3px',
            borderRadius: '2px',
            display: 'inline'
        });
    }

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
                    console.warn(`[GenericAccountSelectionHandler] Invalid selector during reapply: ${selector}`, e);
                }
            }

            this.highlightedAccounts.set(account.id, existingContainers);
        }
    }

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

    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

/**
 * AccountSelectionHighlighter - Main entry point
 * Routes to appropriate handler based on cloud provider type
 */
export class AccountSelectionHighlighter {
    private awsHandler: AWSAccountSelectionHandler;
    private genericHandler: GenericAccountSelectionHandler;
    private currentHandler: IAccountSelectionHandler | null = null;

    constructor() {
        this.awsHandler = new AWSAccountSelectionHandler();
        this.genericHandler = new GenericAccountSelectionHandler();
    }

    /**
     * Applies highlighting to account selection page.
     * Routes to the appropriate handler based on cloud provider.
     * 
     * @param environment The cloud environment configuration
     * @param accounts Array of cloud accounts to highlight
     */
    public applyHighlighting(environment: CloudEnvironment, accounts: CloudAccount[]): void {
        // Select appropriate handler based on provider
        if (environment.provider === CloudProvider.AWS_CN || 
            environment.provider === CloudProvider.AWS_GLOBAL) {
            this.currentHandler = this.awsHandler;
        } else {
            this.currentHandler = this.genericHandler;
        }

        this.currentHandler.applyHighlighting(environment, accounts);
    }

    /**
     * Removes all highlighting from the page.
     */
    public removeHighlighting(): void {
        // Remove from both handlers to be safe
        this.awsHandler.removeHighlighting();
        this.genericHandler.removeHighlighting();
        this.currentHandler = null;
    }
}
