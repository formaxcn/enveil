import { CloudAccount, CloudRole, CloudEnvironment, CloudProvider } from '../../entrypoints/options/types';

export class VolcengineAccountSelectionHandler {
    private static readonly ACCOUNT_HIGHLIGHT_CLASS = 'enveil-volcengine-account-highlight';
    private static readonly ROLE_HIGHLIGHT_CLASS = 'enveil-volcengine-role-highlight';
    private static readonly STYLE_ID = 'enveil-volcengine-account-selection-styles';

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

        console.log(`[VolcengineAccountSelectionHandler] Applied highlighting for ${enabledAccounts.length} accounts`);
    }

    public removeHighlighting(): void {
        this.highlightedAccounts.forEach((elements) => {
            elements.forEach(el => {
                el.style.backgroundColor = '';
                el.style.border = '';
                el.style.boxShadow = '';
                el.removeAttribute('data-enveil-account-id');
                el.classList.remove(VolcengineAccountSelectionHandler.ACCOUNT_HIGHLIGHT_CLASS);
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
            console.log(`[VolcengineAccountSelectionHandler] No containers found for account: ${account.name}`);
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

        console.log(`[VolcengineAccountSelectionHandler] Highlighted account: ${account.name} (${containers.length} containers)`);
    }

    private findAccountContainers(selectors: string[], account: CloudAccount): HTMLElement[] {
        const containers: HTMLElement[] = [];

        console.log(`[VolcengineAccountSelectionHandler] findAccountContainers: selectors=${JSON.stringify(selectors)}, account=${account.name}`);

        for (const selector of selectors) {
            if (!selector) continue;

            try {
                const elements = document.querySelectorAll<HTMLElement>(selector);
                console.log(`[VolcengineAccountSelectionHandler] findAccountContainers: Selector "${selector}" found ${elements.length} elements`);

                elements.forEach((el, index) => {
                    const isMatch = this.isAccountMatch(el, account);
                    console.log(`[VolcengineAccountSelectionHandler] findAccountContainers: Element ${index} - isMatch=${isMatch}`);

                    if (isMatch) {
                        console.log(`[VolcengineAccountSelectionHandler] findAccountContainers: -> MATCHED! Adding element ${index}`);
                        containers.push(el);
                    }
                });
            } catch (e) {
                console.warn(`[VolcengineAccountSelectionHandler] Invalid selector: ${selector}`, e);
            }
        }

        console.log(`[VolcengineAccountSelectionHandler] findAccountContainers: Total containers found: ${containers.length}`);
        return containers;
    }

    private isAccountMatch(element: HTMLElement, account: CloudAccount): boolean {
        const accountName = account.name?.trim();
        const patterns = account.accountPatterns || [];

        console.log(`[VolcengineAccountSelectionHandler] isAccountMatch: accountName="${accountName}", patterns=${patterns.length}`);

        if (!accountName && patterns.length === 0) {
            console.log(`[VolcengineAccountSelectionHandler] isAccountMatch: No accountName or patterns, returning false`);
            return false;
        }

        const accountNameSelectors = [
            ...(this.currentEnvironment?.template?.selectors?.accountSelection?.roleElements || []),
            '.arco-table-cell',
            '.arco-table-cell-wrap-value',
            'td'
        ];

        let accountNameElement: Element | null = null;
        for (const selector of accountNameSelectors) {
            try {
                accountNameElement = element.querySelector(selector);
                if (accountNameElement) {
                    console.log(`[VolcengineAccountSelectionHandler] isAccountMatch: Found account name element with selector "${selector}"`);
                    break;
                }
            } catch (e) {
                console.warn(`[VolcengineAccountSelectionHandler] Invalid selector: ${selector}`, e);
            }
        }

        if (!accountNameElement) {
            console.log(`[VolcengineAccountSelectionHandler] isAccountMatch: No account name element found`);
            return false;
        }

        const accountNameText = accountNameElement.textContent || '';
        console.log(`[VolcengineAccountSelectionHandler] isAccountMatch: accountNameText="${accountNameText}"`);

        for (const pattern of patterns) {
            if (!pattern.enable) continue;

            const matchValue = pattern.matchValue?.trim();
            if (!matchValue) continue;

            console.log(`[VolcengineAccountSelectionHandler] isAccountMatch: Checking pattern "${matchValue}"`);

            if (/^\d{12}$/.test(matchValue)) {
                const accountIdPattern = new RegExp(`\\b${matchValue}\\b`);
                const isMatch = accountIdPattern.test(accountNameText);
                console.log(`[VolcengineAccountSelectionHandler] isAccountMatch: 12-digit ID pattern result=${isMatch}`);
                if (isMatch) return true;
            } else {
                const escapedMatchValue = matchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const matchPattern = new RegExp(escapedMatchValue, 'i');
                const isMatch = matchPattern.test(accountNameText);
                console.log(`[VolcengineAccountSelectionHandler] isAccountMatch: Pattern "${matchPattern}" result=${isMatch}`);
                if (isMatch) return true;
            }
        }

        if (accountName) {
            const escapedAccountName = accountName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const namePattern = new RegExp(escapedAccountName, 'i');
            const isMatch = namePattern.test(accountNameText);
            console.log(`[VolcengineAccountSelectionHandler] isAccountMatch: Account name "${accountName}" pattern "${namePattern}" result=${isMatch}`);
            if (isMatch) {
                return true;
            }
        }

        console.log(`[VolcengineAccountSelectionHandler] isAccountMatch: No match found, returning false`);
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
        element.classList.add(VolcengineAccountSelectionHandler.ACCOUNT_HIGHLIGHT_CLASS);
    }

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

    private highlightRoleKeywordsInElement(element: HTMLElement, roles: CloudRole[], highlightColor?: string): void {
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

                        if (parent.classList.contains(VolcengineAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS)) {
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

            const className = `${VolcengineAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS}-${role.id}`;

            textNodes.forEach(textNode => {
                const originalText = textNode.textContent || '';

                if (!regex.test(originalText)) return;

                const modifiedText = originalText.replace(
                    regex,
                    `<span class="${className} ${VolcengineAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS}" data-role-id="${role.id}" data-original-text="$1">$1</span>`
                );

                if (modifiedText !== originalText && textNode.parentNode) {
                    const wrapper = document.createElement('span');
                    wrapper.innerHTML = modifiedText;

                    const highlightedElements = wrapper.querySelectorAll(`.${VolcengineAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS}`);
                    highlightedElements.forEach(el => {
                        this.highlightedRoles.push(el as HTMLElement);
                        this.applyRoleHighlightStyle(el as HTMLElement, role, highlightColor);
                    });

                    textNode.parentNode.replaceChild(wrapper, textNode);
                }
            });
        }
    }

    private applyRoleHighlightStyle(element: HTMLElement, role: CloudRole, highlightColor?: string): void {
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

    private createStyles(): void {
        if (this.styleElement) return;

        this.styleElement = document.createElement('style');
        this.styleElement.id = VolcengineAccountSelectionHandler.STYLE_ID;

        this.styleElement.textContent = `
            .${VolcengineAccountSelectionHandler.ACCOUNT_HIGHLIGHT_CLASS} {
                transition: all 0.3s ease !important;
            }
            .${VolcengineAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS} {
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
                    console.warn(`[VolcengineAccountSelectionHandler] Invalid selector during reapply: ${selector}`, e);
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

    private getContrastColor(hexColor: string): string {
        hexColor = hexColor.replace('#', '');
        if (hexColor.length === 3) {
            hexColor = hexColor.split('').map(c => c + c).join('');
        }

        const r = parseInt(hexColor.substring(0, 2), 16);
        const g = parseInt(hexColor.substring(2, 4), 16);
        const b = parseInt(hexColor.substring(4, 6), 16);

        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#1a365d' : '#ffffff';
    }

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

    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}