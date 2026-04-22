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

        const elementToAccount = new Map<HTMLElement, CloudAccount>();
        const selectors = environment.template?.selectors?.accountSelection;
        
        if (selectors) {
            for (const account of enabledAccounts) {
                for (const selector of selectors.accountContainers) {
                    if (!selector) continue;
                    
                    try {
                        const elements = document.querySelectorAll<HTMLElement>(selector);
                        elements.forEach(el => {
                            if (this.isAccountMatch(el, account)) {
                                elementToAccount.set(el, account);
                            }
                        });
                    } catch (e) {
                        console.warn(`[VolcengineAccountSelectionHandler] Invalid selector: ${selector}`, e);
                    }
                }
            }
            
            const allElements: HTMLElement[] = [];
            for (const selector of selectors.accountContainers) {
                if (!selector) continue;
                
                try {
                    const elements = document.querySelectorAll<HTMLElement>(selector);
                    elements.forEach(el => {
                        if (!allElements.includes(el)) {
                            allElements.push(el);
                        }
                    });
                } catch (e) {
                    console.warn(`[VolcengineAccountSelectionHandler] Invalid selector: ${selector}`, e);
                }
            }
            
            allElements.sort((a, b) => {
                const position = a.compareDocumentPosition(b);
                if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
                if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
                return 0;
            });
            
            let lastMatchedAccount: CloudAccount | null = null;
            let inChildTable = false;
            
            allElements.forEach(el => {
                const account = elementToAccount.get(el);
                
                if (account) {
                    lastMatchedAccount = account;
                    inChildTable = false;
                } else if (lastMatchedAccount && !elementToAccount.has(el)) {
                    const rowText = el.textContent?.trim() || '';
                    
                    const isChildTable = 
                        rowText.includes('权限') || 
                        rowText.includes('描述') ||
                        rowText.includes('操作') ||
                        rowText.includes('登录') ||
                        rowText.includes('查看编程访问凭证') ||
                        el.querySelector('table') !== null ||
                        el.classList.contains('arco-table-expand-content');
                    
                    if (isChildTable || inChildTable) {
                        inChildTable = true;
                        elementToAccount.set(el, lastMatchedAccount);
                    }
                }
            });
            
            elementToAccount.forEach((account, el) => {
                this.applyAccountBackground(el, account);
                
                if (account.roles && account.roles.length > 0) {
                    const highlightColor = account.highlightEnable ? account.highlightColor : undefined;
                    this.highlightRolesInContainer(el, account.roles, highlightColor);
                }
                
                if (!this.highlightedAccounts.has(account.id)) {
                    this.highlightedAccounts.set(account.id, []);
                }
                this.highlightedAccounts.get(account.id)?.push(el);
            });
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
                
                // 恢复td的背景色
                if (el.tagName.toLowerCase() === 'tr') {
                    const tds = el.querySelectorAll('td');
                    tds.forEach((td: HTMLElement) => {
                        td.style.backgroundColor = '';
                        td.style.transition = '';
                    });
                }
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

    private isAccountMatch(element: HTMLElement, account: CloudAccount): boolean {
        const accountName = account.name?.trim();
        const patterns = account.accountPatterns || [];

        console.log(`[VolcengineAccountSelectionHandler] isAccountMatch: accountName="${accountName}", patterns=${patterns.length}`);

        if (!accountName && patterns.length === 0) {
            console.log(`[VolcengineAccountSelectionHandler] isAccountMatch: No accountName or patterns, returning false`);
            return false;
        }

        const elementText = element.textContent || '';
        console.log(`[VolcengineAccountSelectionHandler] isAccountMatch: elementText="${elementText}"`);

        for (const pattern of patterns) {
            if (!pattern.enable) continue;

            const matchValue = pattern.matchValue?.trim();
            if (!matchValue) continue;

            console.log(`[VolcengineAccountSelectionHandler] isAccountMatch: Checking pattern "${matchValue}"`);

            if (pattern.matchPattern === 'regex') {
                try {
                    const regex = new RegExp(matchValue, 'i');
                    const isMatch = regex.test(elementText);
                    console.log(`[VolcengineAccountSelectionHandler] isAccountMatch: Regex "${matchValue}" result=${isMatch}`);
                    if (isMatch) return true;
                } catch (e) {
                    console.warn(`[VolcengineAccountSelectionHandler] Invalid regex: ${matchValue}`, e);
                }
            } else {
                const isMatch = elementText.toLowerCase().includes(matchValue.toLowerCase());
                console.log(`[VolcengineAccountSelectionHandler] isAccountMatch: Keyword "${matchValue}" result=${isMatch}`);
                if (isMatch) return true;
            }
        }

        if (accountName) {
            const isMatch = elementText.toLowerCase().includes(accountName.toLowerCase());
            console.log(`[VolcengineAccountSelectionHandler] isAccountMatch: Account name "${accountName}" result=${isMatch}`);
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

        element.style.backgroundColor = this.hexToRgba(account.backgroundColor, 0.5);
        element.style.border = `2px solid ${account.backgroundColor}`;
        element.style.boxShadow = `0 0 12px ${this.hexToRgba(account.backgroundColor, 0.6)}`;
        element.style.borderRadius = '4px';
        element.style.transition = 'all 0.3s ease';

        // 直接给tr里面的td也应用同样的背景色
        if (element.tagName.toLowerCase() === 'tr') {
            const tds = element.querySelectorAll('td');
            tds.forEach((td: HTMLElement) => {
                td.style.backgroundColor = this.hexToRgba(account.backgroundColor, 0.5);
                td.style.transition = 'all 0.3s ease';
            });
        }

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
        
        const tempStyles = this.styleElement;
        this.styleElement = null;
        this.highlightedAccounts.clear();
        
        document.querySelectorAll('.' + VolcengineAccountSelectionHandler.ACCOUNT_HIGHLIGHT_CLASS).forEach(el => {
            el.classList.remove(VolcengineAccountSelectionHandler.ACCOUNT_HIGHLIGHT_CLASS);
            el.style.backgroundColor = '';
            el.style.border = '';
            el.style.boxShadow = '';
        });
        
        this.styleElement = tempStyles;
        
        this.applyHighlighting(this.currentEnvironment, accounts);
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
        return string.replace(/[.*+?^${}()[\]\\]/g, '\\$&');
    }
}
