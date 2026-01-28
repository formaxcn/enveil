"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudHighlighter = void 0;
/**
 * CloudHighlighter handles the visual highlighting of cloud accounts and roles.
 * Provides both background highlighting for accounts and text highlighting for role keywords.
 * Coordinates dual-layer highlighting to ensure both layers work together without conflicts.
 */
class CloudHighlighter {
    constructor() {
        this.currentAccountOverlay = null;
        this.currentRoleHighlights = [];
        this.currentStyleElement = null;
        this.roleHighlightingActive = false; // Track role highlighting state
        this.currentRoles = []; // Store current roles for dynamic updates
        this.mutationObserver = null; // Observer for dynamic content
    }
    /**
     * Applies account-level background highlighting using the account's configured color.
     * Creates a semi-transparent overlay similar to existing site highlighting.
     *
     * @param account The cloud account configuration
     */
    applyAccountHighlighting(account) {
        if (!account || !account.backgroundEnable || !account.color) {
            return;
        }
        // Remove existing account overlay if present
        this.removeAccountHighlighting();
        // Create new account overlay
        this.currentAccountOverlay = this.createAccountOverlay(account.color);
        // Add to shadow root if available, otherwise to document
        const shadowRoot = this.getShadowRoot();
        if (shadowRoot) {
            shadowRoot.appendChild(this.currentAccountOverlay);
        }
        else {
            document.body.appendChild(this.currentAccountOverlay);
        }
        console.log(`[CloudHighlighter] Applied account background highlighting for: ${account.name} (${account.color})`);
    }
    /**
     * Applies role-level keyword text highlighting for multiple roles.
     * Each role can have different keywords and highlighting styles.
     * Sets up mutation observer for dynamic content changes.
     *
     * @param roles Array of cloud roles to apply highlighting for
     */
    applyRoleHighlighting(roles) {
        if (!roles || roles.length === 0) {
            return;
        }
        // Remove existing role highlighting
        this.removeRoleHighlighting();
        // Check if any roles are enabled and have keywords
        const enabledRoles = roles.filter(role => role.enable && role.keywords && role.keywords.length > 0);
        if (enabledRoles.length === 0) {
            return;
        }
        // Store current roles for dynamic updates
        this.currentRoles = enabledRoles;
        // Create styles for all roles
        this.createRoleStyles(enabledRoles);
        // Apply highlighting for each enabled role
        for (const role of enabledRoles) {
            this.highlightRoleText(role);
        }
        // Set up mutation observer for dynamic content
        this.setupMutationObserver();
        // Mark role highlighting as active
        this.roleHighlightingActive = true;
        console.log(`[CloudHighlighter] Applied role text highlighting for ${enabledRoles.length} roles`);
    }
    /**
     * Removes all cloud highlighting (both account and role).
     */
    removeHighlighting() {
        this.removeAccountHighlighting();
        this.removeRoleHighlighting();
        console.log('[CloudHighlighter] Removed all cloud highlighting');
    }
    /**
     * Removes only account-level background highlighting.
     */
    removeAccountHighlighting() {
        if (this.currentAccountOverlay) {
            this.currentAccountOverlay.remove();
            this.currentAccountOverlay = null;
        }
    }
    /**
     * Removes only role-level text highlighting.
     */
    removeRoleHighlighting() {
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
    createAccountOverlay(color) {
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
    createRoleStyles(roles) {
        const styleElement = document.createElement('style');
        styleElement.id = CloudHighlighter.CLOUD_ROLE_STYLE_ID;
        let cssRules = '';
        roles.forEach((role, index) => {
            if (!role.enable)
                return;
            const className = `${CloudHighlighter.CLOUD_ROLE_HIGHLIGHT_CLASS}-${role.id}`;
            const style = role.highlightStyle;
            cssRules += `
                .${className} {
                    color: ${style.textColor} !important;
                    background-color: ${style.backgroundColor} !important;
                    font-weight: ${style.fontWeight} !important;
                    text-decoration: ${style.textDecoration} !important;
                    border: ${style.border} !important;
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
     * Highlights text content for a specific role's keywords.
     *
     * @param role The cloud role configuration
     */
    highlightRoleText(role) {
        if (!role.keywords || role.keywords.length === 0) {
            return;
        }
        // Check if we're in a browser environment
        if (typeof document === 'undefined' || typeof NodeFilter === 'undefined') {
            console.warn('[CloudHighlighter] DOM APIs not available, skipping role text highlighting');
            return;
        }
        const className = `${CloudHighlighter.CLOUD_ROLE_HIGHLIGHT_CLASS}-${role.id}`;
        // Find all text nodes in the document
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
                // Skip nodes that are already highlighted or in script/style tags
                const parent = node.parentElement;
                if (!parent)
                    return NodeFilter.FILTER_REJECT;
                const tagName = parent.tagName.toLowerCase();
                if (['script', 'style', 'noscript'].includes(tagName)) {
                    return NodeFilter.FILTER_REJECT;
                }
                // Skip if already highlighted
                if (parent.classList.contains(CloudHighlighter.CLOUD_ROLE_HIGHLIGHT_CLASS) ||
                    parent.closest(`.${CloudHighlighter.CLOUD_ROLE_HIGHLIGHT_CLASS}`)) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        // Process each text node for keyword matches
        textNodes.forEach(textNode => {
            const originalText = textNode.textContent || '';
            let modifiedText = originalText;
            let hasMatches = false;
            // Check each keyword
            role.keywords.forEach(keyword => {
                if (!keyword || keyword.trim() === '')
                    return;
                const trimmedKeyword = keyword.trim();
                const regex = new RegExp(`(${this.escapeRegExp(trimmedKeyword)})`, 'gi');
                if (regex.test(originalText)) {
                    hasMatches = true;
                    modifiedText = modifiedText.replace(regex, `<span class="${className}" data-role-id="${role.id}">$1</span>`);
                }
            });
            // Replace text node with highlighted content if matches found
            if (hasMatches && textNode.parentNode) {
                const wrapper = document.createElement('span');
                wrapper.innerHTML = modifiedText;
                wrapper.setAttribute('data-original-text', originalText);
                wrapper.setAttribute('data-enveil-processed', 'true');
                // Track highlighted elements for cleanup
                const highlightedElements = wrapper.querySelectorAll(`.${className}`);
                highlightedElements.forEach(el => {
                    this.currentRoleHighlights.push(el);
                });
                textNode.parentNode.replaceChild(wrapper, textNode);
            }
            else if (textNode.parentElement) {
                // Mark as processed even if no matches to avoid re-processing
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
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    /**
     * Gets the shadow root if available, for proper DOM isolation.
     *
     * @returns ShadowRoot if available, null otherwise
     */
    getShadowRoot() {
        const shadowHost = document.getElementById('enveil-host');
        return shadowHost?.shadowRoot || null;
    }
    /**
     * Checks if dual-layer highlighting is currently active.
     *
     * @returns Object indicating which highlighting layers are active
     */
    getHighlightingStatus() {
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
    updateRoleHighlighting(roles) {
        // Remove existing role highlighting
        this.removeRoleHighlighting();
        // Re-apply role highlighting
        this.applyRoleHighlighting(roles);
    }
    /**
     * Sets up mutation observer to handle dynamic content changes.
     * Automatically re-applies role highlighting when new content is added.
     */
    setupMutationObserver() {
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
    reapplyRoleHighlighting() {
        if (!this.currentRoles || this.currentRoles.length === 0) {
            return;
        }
        // Apply highlighting for each current role to new content
        for (const role of this.currentRoles) {
            this.highlightNewRoleText(role);
        }
    }
    /**
     * Highlights text content for a specific role's keywords in newly added content only.
     * More efficient than full DOM scan for dynamic updates.
     *
     * @param role The cloud role configuration
     */
    highlightNewRoleText(role) {
        if (!role.keywords || role.keywords.length === 0) {
            return;
        }
        // Check if we're in a browser environment
        if (typeof document === 'undefined' || typeof NodeFilter === 'undefined') {
            return;
        }
        const className = `${CloudHighlighter.CLOUD_ROLE_HIGHLIGHT_CLASS}-${role.id}`;
        // Find text nodes that haven't been processed yet
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
                const parent = node.parentElement;
                if (!parent)
                    return NodeFilter.FILTER_REJECT;
                const tagName = parent.tagName.toLowerCase();
                if (['script', 'style', 'noscript'].includes(tagName)) {
                    return NodeFilter.FILTER_REJECT;
                }
                // Skip if already highlighted
                if (parent.classList.contains(CloudHighlighter.CLOUD_ROLE_HIGHLIGHT_CLASS) ||
                    parent.closest(`.${CloudHighlighter.CLOUD_ROLE_HIGHLIGHT_CLASS}`) ||
                    parent.hasAttribute('data-enveil-processed')) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        // Process each new text node
        textNodes.forEach(textNode => {
            const originalText = textNode.textContent || '';
            let modifiedText = originalText;
            let hasMatches = false;
            // Check each keyword
            role.keywords.forEach(keyword => {
                if (!keyword || keyword.trim() === '')
                    return;
                const trimmedKeyword = keyword.trim();
                const regex = new RegExp(`(${this.escapeRegExp(trimmedKeyword)})`, 'gi');
                if (regex.test(originalText)) {
                    hasMatches = true;
                    modifiedText = modifiedText.replace(regex, `<span class="${className}" data-role-id="${role.id}">$1</span>`);
                }
            });
            // Replace text node with highlighted content if matches found
            if (hasMatches && textNode.parentNode) {
                const wrapper = document.createElement('span');
                wrapper.innerHTML = modifiedText;
                wrapper.setAttribute('data-original-text', originalText);
                wrapper.setAttribute('data-enveil-processed', 'true');
                // Track highlighted elements for cleanup
                const highlightedElements = wrapper.querySelectorAll(`.${className}`);
                highlightedElements.forEach(el => {
                    this.currentRoleHighlights.push(el);
                });
                textNode.parentNode.replaceChild(wrapper, textNode);
            }
            else if (textNode.parentElement) {
                // Mark as processed even if no matches to avoid re-processing
                textNode.parentElement.setAttribute('data-enveil-processed', 'true');
            }
        });
    }
    /**
     * Gets information about currently highlighted roles for debugging.
     *
     * @returns Array of role information objects
     */
    getHighlightedRolesInfo() {
        const roleInfo = {};
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
exports.CloudHighlighter = CloudHighlighter;
CloudHighlighter.CLOUD_OVERLAY_ID = 'enveil-cloud-overlay';
CloudHighlighter.CLOUD_ROLE_HIGHLIGHT_CLASS = 'enveil-cloud-role-highlight';
CloudHighlighter.CLOUD_ROLE_STYLE_ID = 'enveil-cloud-role-styles';
