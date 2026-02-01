import { CloudAccount, CloudRole, RoleHighlightStyle, CloudEnvironment } from '../entrypoints/options/types';

/**
 * CloudHighlighter handles the visual highlighting of cloud accounts and roles.
 * Provides both background highlighting for accounts and text highlighting for role keywords.
 * Coordinates dual-layer highlighting to ensure both layers work together without conflicts.
 */
export class CloudHighlighter {
    private static readonly CLOUD_OVERLAY_ID = 'enveil-cloud-overlay';
    private static readonly CLOUD_ROLE_HIGHLIGHT_CLASS = 'enveil-cloud-role-highlight';
    private static readonly CLOUD_ROLE_STYLE_ID = 'enveil-cloud-role-styles';
    private static readonly CLOUD_ACCOUNT_HIGHLIGHT_CLASS = 'enveil-cloud-account-highlight';
    private static readonly CLOUD_ACCOUNT_STYLE_ID = 'enveil-cloud-account-styles';

    private currentAccountOverlay: HTMLElement | null = null;
    private currentRoleHighlights: HTMLElement[] = [];
    private currentStyleElement: HTMLStyleElement | null = null;
    private roleHighlightingActive: boolean = false; // Track role highlighting state
    private currentRoles: CloudRole[] = []; // Store current roles for dynamic updates
    private mutationObserver: MutationObserver | null = null; // Observer for dynamic content
    private highlightedAccountContainers: Map<string, HTMLElement[]> = new Map(); // Track highlighted account containers
    private accountStyleElement: HTMLStyleElement | null = null; // Style element for account highlighting
    private currentEnvironment: CloudEnvironment | null = null; // Current environment for selectors
    private accountMutationObserver: MutationObserver | null = null; // Observer for account container changes

    /**
     * Applies account-level background highlighting using the account's configured color.
     * Creates a semi-transparent overlay similar to existing site highlighting.
     * Supports multiple accounts - creates overlay for each account.
     * 
     * @param accounts Array of cloud account configurations
     */
    public applyAccountHighlighting(accounts: CloudAccount[]): void {
        console.log('[CloudHighlighter] applyAccountHighlighting called with accounts:', accounts.length);
        
        // Remove existing account overlay if present
        this.removeAccountHighlighting();

        // Filter enabled accounts with background
        const enabledAccounts = accounts.filter(acc => acc.enable && acc.backgroundEnable && acc.backgroundColor);
        console.log('[CloudHighlighter] Enabled accounts with background:', enabledAccounts.length);
        
        if (enabledAccounts.length === 0) {
            console.log('[CloudHighlighter] No enabled accounts with background');
            return;
        }

        // Use the first account's color for the global overlay
        const primaryAccount = enabledAccounts[0];
        
        // Create new account overlay
        this.currentAccountOverlay = this.createAccountOverlay(primaryAccount.backgroundColor);
        
        // Add to shadow root if available, otherwise to document
        const shadowRoot = this.getShadowRoot();
        if (shadowRoot) {
            shadowRoot.appendChild(this.currentAccountOverlay);
        } else {
            document.body.appendChild(this.currentAccountOverlay);
        }

        console.log(`[CloudHighlighter] Applied account background highlighting for: ${primaryAccount.name} (${primaryAccount.backgroundColor})`);
    }

    /**
     * Applies role-level keyword text highlighting for multiple roles.
     * Each role can have different keywords and highlighting styles.
     * Sets up mutation observer for dynamic content changes.
     * 
     * @param roles Array of cloud roles to apply highlighting for
     */
    public applyRoleHighlighting(roles: CloudRole[]): void {
        if (!roles || roles.length === 0) {
            return;
        }

        this.removeRoleHighlighting();

        const enabledRoles = roles.filter(role => role.enable && role.matchValue && role.matchValue.trim().length > 0);
        if (enabledRoles.length === 0) {
            return;
        }

        this.currentRoles = enabledRoles;

        this.createRoleStyles(enabledRoles);

        for (const role of enabledRoles) {
            this.highlightRoleText(role);
        }

        this.setupMutationObserver();

        this.roleHighlightingActive = true;

        console.log(`[CloudHighlighter] Applied role text highlighting for ${enabledRoles.length} roles`);
    }

    /**
     * Removes all cloud highlighting (both account and role).
     */
    public removeHighlighting(): void {
        this.removeAccountHighlighting();
        this.removeRoleHighlighting();
        this.removeAccountContainerHighlighting();
        console.log('[CloudHighlighter] Removed all cloud highlighting');
    }

    /**
     * Applies account container highlighting for console pages.
     * Highlights specific account container elements using the configured selectors.
     * 
     * @param environment The cloud environment configuration
     * @param accounts Array of cloud accounts to highlight
     */
    public applyAccountContainerHighlighting(environment: CloudEnvironment, accounts: CloudAccount[]): void {
        console.log('[CloudHighlighter] applyAccountContainerHighlighting called:', {
            environment: environment?.name,
            provider: environment?.provider,
            accountsCount: accounts?.length,
            selectors: environment?.template?.selectors?.console
        });

        if (!environment || !accounts || accounts.length === 0) {
            console.log('[CloudHighlighter] Early return - no environment or accounts');
            return;
        }

        this.currentEnvironment = environment;
        const enabledAccounts = accounts.filter(acc => acc.enable);
        
        console.log(`[CloudHighlighter] Enabled accounts: ${enabledAccounts.length}`, 
            enabledAccounts.map(acc => ({ name: acc.name, id: acc.id, backgroundEnable: acc.backgroundEnable, backgroundColor: acc.backgroundColor })));

        // Remove existing highlighting
        this.removeAccountContainerHighlighting();

        // Create styles
        this.createAccountStyles();

        // Apply highlighting for each account
        for (const account of enabledAccounts) {
            this.highlightAccountContainers(account);
        }

        // Setup mutation observer for dynamic content
        this.setupAccountMutationObserver();

        console.log(`[CloudHighlighter] Applied account container highlighting for ${enabledAccounts.length} accounts`);
    }

    /**
     * Highlights account containers for a specific account.
     */
    private highlightAccountContainers(account: CloudAccount): void {
        const selectors = this.currentEnvironment?.template?.selectors?.console;
        const accountContainerSelectors = selectors?.accountContainers || [];

        console.log(`[CloudHighlighter] highlightAccountContainers for ${account.name}:`, {
            selectorsCount: accountContainerSelectors.length,
            selectors: accountContainerSelectors,
            patterns: account.accountPatterns
        });

        if (accountContainerSelectors.length === 0) {
            console.log(`[CloudHighlighter] No console account container selectors configured`);
            return;
        }

        const containers = this.findAccountContainers(accountContainerSelectors, account);

        console.log(`[CloudHighlighter] Found ${containers.length} containers for account ${account.name}`);

        if (containers.length === 0) {
            console.log(`[CloudHighlighter] No containers found for account: ${account.name}`);
            return;
        }

        this.highlightedAccountContainers.set(account.id, containers);

        containers.forEach((container, idx) => {
            console.log(`[CloudHighlighter] Applying styles to container ${idx}:`, container.tagName, container.className);
            this.applyAccountContainerStyles(container, account);
        });

        console.log(`[CloudHighlighter] Highlighted account containers for: ${account.name} (${containers.length} containers)`);
    }

    /**
     * Finds account containers matching the given selectors and account.
     */
    private findAccountContainers(selectors: string[], account: CloudAccount): HTMLElement[] {
        const containers: HTMLElement[] = [];

        for (const selector of selectors) {
            if (!selector) continue;

            try {
                const elements = document.querySelectorAll<HTMLElement>(selector);
                console.log(`[CloudHighlighter] Selector "${selector}" found ${elements.length} elements`);

                elements.forEach((el, idx) => {
                    const textContent = el.textContent?.substring(0, 100) || '';
                    console.log(`[CloudHighlighter] Element ${idx}:`, {
                        tagName: el.tagName,
                        className: el.className,
                        id: el.id,
                        textPreview: textContent.substring(0, 50)
                    });
                    
                    // Check if container matches the account patterns
                    const isMatch = this.isAccountContainerMatch(el, account);
                    console.log(`[CloudHighlighter] Element ${idx} match result:`, isMatch);
                    
                    if (isMatch) {
                        containers.push(el);
                    }
                });
            } catch (e) {
                console.warn(`[CloudHighlighter] Invalid selector: ${selector}`, e);
            }
        }

        return containers;
    }

    /**
     * Checks if an account container matches the given account.
     */
    private isAccountContainerMatch(element: HTMLElement, account: CloudAccount): boolean {
        const patterns = account.accountPatterns || [];
        const elementText = element.textContent || '';

        console.log(`[CloudHighlighter] isAccountContainerMatch:`, {
            accountName: account.name,
            patternsCount: patterns.length,
            elementTextPreview: elementText.substring(0, 100)
        });

        if (patterns.length === 0) {
            // If no patterns, match all containers (for template-based matching)
            console.log(`[CloudHighlighter] No patterns, matching all containers`);
            return true;
        }

        // Check all account patterns
        for (const pattern of patterns) {
            if (!pattern.enable) {
                console.log(`[CloudHighlighter] Pattern disabled, skipping`);
                continue;
            }
            
            const matchValue = pattern.matchValue?.trim();
            if (!matchValue) {
                console.log(`[CloudHighlighter] Empty matchValue, skipping`);
                continue;
            }
            
            console.log(`[CloudHighlighter] Checking pattern:`, {
                matchPattern: pattern.matchPattern,
                matchValue: matchValue
            });
            
            // For 12-digit account ID pattern with word boundaries
            if (/^\d{12}$/.test(matchValue)) {
                const accountIdPattern = new RegExp(`\\b${matchValue}\\b`);
                const isMatch = accountIdPattern.test(elementText);
                console.log(`[CloudHighlighter] 12-digit ID check: ${matchValue} -> ${isMatch}`);
                if (isMatch) return true;
            } else {
                // For non-numeric match values, use word boundary matching
                const escapedMatchValue = matchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const matchPattern = new RegExp(
                    `\\b${escapedMatchValue}\\b|\\(${escapedMatchValue}\\)`,
                    'i'
                );
                const isMatch = matchPattern.test(elementText);
                console.log(`[CloudHighlighter] Keyword check: ${matchPattern} -> ${isMatch}`);
                if (isMatch) return true;
            }
        }

        // Check account name with word boundaries
        const accountName = account.name?.trim();
        if (accountName) {
            const escapedAccountName = accountName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const namePattern = new RegExp(`\\b${escapedAccountName}\\b`, 'i');
            const isMatch = namePattern.test(elementText);
            console.log(`[CloudHighlighter] Account name check: ${accountName} -> ${isMatch}`);
            if (isMatch) {
                return true;
            }
        }

        console.log(`[CloudHighlighter] No match found`);
        return false;
    }

    /**
     * Applies styles to an account container element.
     */
    private applyAccountContainerStyles(element: HTMLElement, account: CloudAccount): void {
        // Apply background color if enabled
        if (account.backgroundEnable && account.backgroundColor) {
            element.style.backgroundColor = this.hexToRgba(account.backgroundColor, 0.25);
            element.style.border = `2px solid ${account.backgroundColor}`;
            element.style.boxShadow = `0 0 8px ${this.hexToRgba(account.backgroundColor, 0.35)}`;
            element.style.borderRadius = '4px';
            element.style.transition = 'all 0.3s ease';
        }

        // Apply highlight color if enabled
        if (account.highlightEnable && account.highlightColor) {
            // Add highlight color as a data attribute for potential text highlighting
            element.setAttribute('data-highlight-color', account.highlightColor);
        }

        element.setAttribute('data-enveil-account-id', account.id);
        element.classList.add(CloudHighlighter.CLOUD_ACCOUNT_HIGHLIGHT_CLASS);
    }

    /**
     * Creates CSS styles for account container highlighting.
     */
    private createAccountStyles(): void {
        if (this.accountStyleElement) return;

        this.accountStyleElement = document.createElement('style');
        this.accountStyleElement.id = CloudHighlighter.CLOUD_ACCOUNT_STYLE_ID;

        this.accountStyleElement.textContent = `
            .${CloudHighlighter.CLOUD_ACCOUNT_HIGHLIGHT_CLASS} {
                transition: all 0.3s ease !important;
            }
        `;

        document.head.appendChild(this.accountStyleElement);
    }

    /**
     * Sets up mutation observer for account container dynamic content changes.
     */
    private setupAccountMutationObserver(): void {
        if (typeof MutationObserver === 'undefined') return;

        this.accountMutationObserver = new MutationObserver((mutations) => {
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
                clearTimeout((this as any)._accountReapplyTimeout);
                (this as any)._accountReapplyTimeout = setTimeout(() => {
                    this.reapplyAccountContainerHighlighting();
                }, 100);
            }
        });

        this.accountMutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Re-applies account container highlighting to newly added content.
     */
    private reapplyAccountContainerHighlighting(): void {
        if (!this.currentEnvironment) return;

        const accounts = this.currentEnvironment.accounts?.filter(acc => acc.enable) || [];
        const selectors = this.currentEnvironment.template?.selectors?.console;
        if (!selectors) return;

        for (const account of accounts) {
            const existingContainers = this.highlightedAccountContainers.get(account.id) || [];

            for (const selector of selectors.accountContainers) {
                if (!selector) continue;

                try {
                    const elements = document.querySelectorAll<HTMLElement>(selector);

                    elements.forEach(el => {
                        if (existingContainers.includes(el)) return;

                        if (this.isAccountContainerMatch(el, account)) {
                            existingContainers.push(el);
                            this.applyAccountContainerStyles(el, account);
                        }
                    });
                } catch (e) {
                    console.warn(`[CloudHighlighter] Invalid selector during reapply: ${selector}`, e);
                }
            }

            this.highlightedAccountContainers.set(account.id, existingContainers);
        }
    }

    /**
     * Removes account container highlighting.
     */
    public removeAccountContainerHighlighting(): void {
        // Remove account container highlights
        this.highlightedAccountContainers.forEach((elements) => {
            elements.forEach(el => {
                el.style.backgroundColor = '';
                el.style.border = '';
                el.style.boxShadow = '';
                el.style.borderRadius = '';
                el.style.transition = '';
                el.removeAttribute('data-enveil-account-id');
                el.removeAttribute('data-highlight-color');
                el.classList.remove(CloudHighlighter.CLOUD_ACCOUNT_HIGHLIGHT_CLASS);
            });
        });
        this.highlightedAccountContainers.clear();

        // Remove style element
        if (this.accountStyleElement) {
            this.accountStyleElement.remove();
            this.accountStyleElement = null;
        }

        // Disconnect observer
        if (this.accountMutationObserver) {
            this.accountMutationObserver.disconnect();
            this.accountMutationObserver = null;
        }

        this.currentEnvironment = null;
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
     * Removes only account-level background highlighting.
     */
    public removeAccountHighlighting(): void {
        if (this.currentAccountOverlay) {
            this.currentAccountOverlay.remove();
            this.currentAccountOverlay = null;
        }
    }

    /**
     * Removes only role-level text highlighting.
     */
    public removeRoleHighlighting(): void {
        // Disconnect mutation observer
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }

        // Remove all highlighted elements
        this.currentRoleHighlights.forEach(element => {
            if (element.parentNode) {
                // Restore original text content
                const originalText = element.getAttribute('data-original-text');
                if (originalText) {
                    const textNode = document.createTextNode(originalText);
                    element.parentNode.replaceChild(textNode, element);
                }
            }
        });
        this.currentRoleHighlights = [];

        // Remove style element
        if (this.currentStyleElement) {
            this.currentStyleElement.remove();
            this.currentStyleElement = null;
        }

        // Clear stored roles
        this.currentRoles = [];

        // Mark role highlighting as inactive
        this.roleHighlightingActive = false;
    }

    /**
     * Creates a semi-transparent background overlay for account highlighting.
     * 
     * @param color The background color for the overlay
     * @returns HTMLElement representing the overlay
     */
    private createAccountOverlay(color: string): HTMLElement {
        const overlay = document.createElement('div');
        overlay.id = CloudHighlighter.CLOUD_OVERLAY_ID;

        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: color,
            opacity: '0.05',
            zIndex: '2147483646', // Same as existing site overlay, but for cloud accounts
            pointerEvents: 'none'
        });

        return overlay;
    }

    /**
     * Creates CSS styles for role text highlighting.
     * 
     * @param roles Array of cloud roles to create styles for
     */
    private createRoleStyles(roles: CloudRole[]): void {
        const styleElement = document.createElement('style');
        styleElement.id = CloudHighlighter.CLOUD_ROLE_STYLE_ID;
        
        let cssRules = '';
        
        roles.forEach((role, index) => {
            if (!role.enable) return;
            
            const className = `${CloudHighlighter.CLOUD_ROLE_HIGHLIGHT_CLASS}-${role.id}`;
            
            cssRules += `
                .${className} {
                    color: #000000 !important;
                    background-color: #ffeb3b !important;
                    font-weight: bold !important;
                    text-decoration: none !important;
                    border: none !important;
                    padding: 1px 2px !important;
                    border-radius: 2px !important;
                    display: inline !important;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
                }
            `;
        });

        styleElement.textContent = cssRules;
        document.head.appendChild(styleElement);
        this.currentStyleElement = styleElement;
    }

    /**
     * Highlights text content for a specific role's pattern.
     * 
     * @param role The cloud role configuration
     */
    private highlightRoleText(role: CloudRole): void {
        if (!role.matchValue || role.matchValue.trim().length === 0) {
            return;
        }

        if (typeof document === 'undefined' || typeof NodeFilter === 'undefined') {
            console.warn('[CloudHighlighter] DOM APIs not available, skipping role text highlighting');
            return;
        }

        const matchValue = role.matchValue.trim();
        let regex: RegExp | null = null;

        if (role.matchPattern === 'regex') {
            try {
                regex = new RegExp(`(${matchValue})`, 'gi');
            } catch (e) {
                console.error('[CloudHighlighter] Invalid role regex:', matchValue);
                return;
            }
        } else {
            regex = new RegExp(`(${this.escapeRegExp(matchValue)})`, 'gi');
        }

        if (!regex) return;

        const className = `${CloudHighlighter.CLOUD_ROLE_HIGHLIGHT_CLASS}-${role.id}`;
        
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    
                    const tagName = parent.tagName.toLowerCase();
                    if (['script', 'style', 'noscript'].includes(tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    if (parent.classList.contains(CloudHighlighter.CLOUD_ROLE_HIGHLIGHT_CLASS) ||
                        parent.closest(`.${CloudHighlighter.CLOUD_ROLE_HIGHLIGHT_CLASS}`)) {
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

        textNodes.forEach(textNode => {
            const originalText = textNode.textContent || '';
            
            if (!regex.test(originalText)) return;

            const modifiedText = originalText.replace(regex, `<span class="${className}" data-role-id="${role.id}">$1</span>`);

            if (modifiedText !== originalText && textNode.parentNode) {
                const wrapper = document.createElement('span');
                wrapper.innerHTML = modifiedText;
                wrapper.setAttribute('data-original-text', originalText);
                wrapper.setAttribute('data-enveil-processed', 'true');
                
                const highlightedElements = wrapper.querySelectorAll(`.${className}`);
                highlightedElements.forEach(el => {
                    this.currentRoleHighlights.push(el as HTMLElement);
                });
                
                textNode.parentNode.replaceChild(wrapper, textNode);
            } else if (textNode.parentElement) {
                textNode.parentElement.setAttribute('data-enveil-processed', 'true');
            }
        });
    }

    /**
     * Escapes special regex characters in a string.
     * 
     * @param string The string to escape
     * @returns Escaped string safe for regex
     */
    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Gets the shadow root if available, for proper DOM isolation.
     * 
     * @returns ShadowRoot if available, null otherwise
     */
    private getShadowRoot(): ShadowRoot | null {
        const shadowHost = document.getElementById('enveil-host');
        return shadowHost?.shadowRoot || null;
    }

    /**
     * Checks if dual-layer highlighting is currently active.
     * 
     * @returns Object indicating which highlighting layers are active
     */
    public getHighlightingStatus(): { accountHighlighting: boolean; roleHighlighting: boolean } {
        return {
            accountHighlighting: this.currentAccountOverlay !== null,
            roleHighlighting: this.roleHighlightingActive
        };
    }

    /**
     * Updates role highlighting for dynamic content changes.
     * This method can be called when page content changes dynamically.
     * 
     * @param roles Array of cloud roles to re-apply highlighting for
     */
    public updateRoleHighlighting(roles: CloudRole[]): void {
        // Remove existing role highlighting
        this.removeRoleHighlighting();
        
        // Re-apply role highlighting
        this.applyRoleHighlighting(roles);
    }

    /**
     * Sets up mutation observer to handle dynamic content changes.
     * Automatically re-applies role highlighting when new content is added.
     */
    private setupMutationObserver(): void {
        // Check if MutationObserver is available
        if (typeof MutationObserver === 'undefined') {
            return;
        }

        // Disconnect existing observer
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }

        // Create new observer
        this.mutationObserver = new MutationObserver((mutations) => {
            let shouldReapplyHighlighting = false;

            mutations.forEach((mutation) => {
                // Check for added nodes
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of Array.from(mutation.addedNodes)) {
                        // Only process element nodes and text nodes
                        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
                            shouldReapplyHighlighting = true;
                            break;
                        }
                    }
                }
                
                // Check for text content changes
                if (mutation.type === 'characterData') {
                    shouldReapplyHighlighting = true;
                }
            });

            // Debounce re-highlighting to avoid excessive updates
            if (shouldReapplyHighlighting && this.currentRoles.length > 0) {
                // Use a small delay to batch multiple mutations
                setTimeout(() => {
                    if (this.roleHighlightingActive) {
                        this.reapplyRoleHighlighting();
                    }
                }, 100);
            }
        });

        // Start observing
        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    /**
     * Re-applies role highlighting to newly added content without removing existing highlights.
     * More efficient than full re-highlighting for dynamic content updates.
     */
    private reapplyRoleHighlighting(): void {
        if (!this.currentRoles || this.currentRoles.length === 0) {
            return;
        }

        // Apply highlighting for each current role to new content
        for (const role of this.currentRoles) {
            this.highlightNewRoleText(role);
        }
    }

    /**
     * Highlights text content for a specific role's pattern in newly added content only.
     * More efficient than full DOM scan for dynamic updates.
     * 
     * @param role The cloud role configuration
     */
    private highlightNewRoleText(role: CloudRole): void {
        if (!role.matchValue || role.matchValue.trim().length === 0) {
            return;
        }

        if (typeof document === 'undefined' || typeof NodeFilter === 'undefined') {
            return;
        }

        const matchValue = role.matchValue.trim();
        let regex: RegExp | null = null;

        if (role.matchPattern === 'regex') {
            try {
                regex = new RegExp(`(${matchValue})`, 'gi');
            } catch (e) {
                console.error('[CloudHighlighter] Invalid role regex:', matchValue);
                return;
            }
        } else {
            regex = new RegExp(`(${this.escapeRegExp(matchValue)})`, 'gi');
        }

        if (!regex) return;

        const className = `${CloudHighlighter.CLOUD_ROLE_HIGHLIGHT_CLASS}-${role.id}`;
        
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    
                    const tagName = parent.tagName.toLowerCase();
                    if (['script', 'style', 'noscript'].includes(tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    if (parent.classList.contains(CloudHighlighter.CLOUD_ROLE_HIGHLIGHT_CLASS) ||
                        parent.closest(`.${CloudHighlighter.CLOUD_ROLE_HIGHLIGHT_CLASS}`) ||
                        parent.hasAttribute('data-enveil-processed')) {
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

        textNodes.forEach(textNode => {
            const originalText = textNode.textContent || '';
            
            if (!regex.test(originalText)) return;

            const modifiedText = originalText.replace(regex, `<span class="${className}" data-role-id="${role.id}">$1</span>`);

            if (modifiedText !== originalText && textNode.parentNode) {
                const wrapper = document.createElement('span');
                wrapper.innerHTML = modifiedText;
                wrapper.setAttribute('data-original-text', originalText);
                wrapper.setAttribute('data-enveil-processed', 'true');
                
                const highlightedElements = wrapper.querySelectorAll(`.${className}`);
                highlightedElements.forEach(el => {
                    this.currentRoleHighlights.push(el as HTMLElement);
                });
                
                textNode.parentNode.replaceChild(wrapper, textNode);
            } else if (textNode.parentElement) {
                textNode.parentElement.setAttribute('data-enveil-processed', 'true');
            }
        });
    }

    /**
     * Gets information about currently highlighted roles for debugging.
     * 
     * @returns Array of role information objects
     */
    public getHighlightedRolesInfo(): Array<{ roleId: string; highlightCount: number }> {
        const roleInfo: { [roleId: string]: number } = {};
        
        this.currentRoleHighlights.forEach(element => {
            const roleId = element.getAttribute('data-role-id');
            if (roleId) {
                roleInfo[roleId] = (roleInfo[roleId] || 0) + 1;
            }
        });

        return Object.entries(roleInfo).map(([roleId, count]) => ({
            roleId,
            highlightCount: count
        }));
    }
}