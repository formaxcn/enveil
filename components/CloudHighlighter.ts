import { CloudAccount, CloudRole, RoleHighlightStyle } from '../entrypoints/options/types';

/**
 * CloudHighlighter handles the visual highlighting of cloud accounts and roles.
 * Provides both background highlighting for accounts and text highlighting for role keywords.
 * Coordinates dual-layer highlighting to ensure both layers work together without conflicts.
 */
export class CloudHighlighter {
    private static readonly CLOUD_OVERLAY_ID = 'enveil-cloud-overlay';
    private static readonly CLOUD_ROLE_HIGHLIGHT_CLASS = 'enveil-cloud-role-highlight';
    private static readonly CLOUD_ROLE_STYLE_ID = 'enveil-cloud-role-styles';

    private currentAccountOverlay: HTMLElement | null = null;
    private currentRoleHighlights: HTMLElement[] = [];
    private currentStyleElement: HTMLStyleElement | null = null;
    private roleHighlightingActive: boolean = false; // Track role highlighting state
    private currentRoles: CloudRole[] = []; // Store current roles for dynamic updates
    private mutationObserver: MutationObserver | null = null; // Observer for dynamic content

    /**
     * Applies account-level background highlighting using the account's configured color.
     * Creates a semi-transparent overlay similar to existing site highlighting.
     * 
     * @param account The cloud account configuration
     */
    public applyAccountHighlighting(account: CloudAccount): void {
        if (!account || !account.backgroundEnable || !account.backgroundColor) {
            return;
        }

        // Remove existing account overlay if present
        this.removeAccountHighlighting();

        // Create new account overlay
        this.currentAccountOverlay = this.createAccountOverlay(account.backgroundColor);
        
        // Add to shadow root if available, otherwise to document
        const shadowRoot = this.getShadowRoot();
        if (shadowRoot) {
            shadowRoot.appendChild(this.currentAccountOverlay);
        } else {
            document.body.appendChild(this.currentAccountOverlay);
        }

        console.log(`[CloudHighlighter] Applied account background highlighting for: ${account.name} (${account.backgroundColor})`);
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
        console.log('[CloudHighlighter] Removed all cloud highlighting');
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