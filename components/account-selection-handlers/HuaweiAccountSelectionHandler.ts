import { CloudAccount, CloudRole, CloudEnvironment, CloudProvider } from '../../entrypoints/options/types';

export class HuaweiAccountSelectionHandler {
    private static readonly ACCOUNT_HIGHLIGHT_CLASS = 'enveil-huawei-account-highlight';
    private static readonly ROLE_HIGHLIGHT_CLASS = 'enveil-huawei-role-highlight';
    private static readonly STYLE_ID = 'enveil-huawei-account-selection-styles';

    private highlightedAccounts: Map<string, HTMLElement[]> = new Map();
    private highlightedRoles: HTMLElement[] = [];
    private styleElement: HTMLStyleElement | null = null;
    private mutationObserver: MutationObserver | null = null;
    private currentEnvironment: CloudEnvironment | null = null;

    public applyHighlighting(environment: CloudEnvironment, accounts: CloudAccount[]): void {
        if (!environment || !accounts || accounts.length === 0) {
            return;
        }

        console.log('[HuaweiAccountSelectionHandler] Starting applyHighlighting');
        
        // 先打印页面基本结构，帮助调试
        this.logPageStructure();

        this.currentEnvironment = environment;
        const enabledAccounts = accounts.filter(acc => acc.enable);

        this.removeHighlighting();
        this.createStyles();

        // 先找到所有需要高亮的元素和对应的账户
        const elementToAccount = new Map<HTMLElement, CloudAccount>();
        const selectors = environment.template?.selectors?.accountSelection;
        
        if (selectors) {
            // 第一遍：先找到所有匹配的账户行
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
                        console.warn(`[HuaweiAccountSelectionHandler] Invalid selector: ${selector}`, e);
                    }
                }
            }
            
            // 第二遍：找到子表内容并关联到前面的账户
            // 先收集所有元素并按DOM顺序排序
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
                    console.warn(`[HuaweiAccountSelectionHandler] Invalid selector: ${selector}`, e);
                }
            }
            
            // 按文档顺序排序
            allElements.sort((a, b) => {
                const position = a.compareDocumentPosition(b);
                if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
                if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
                return 0;
            });
            
            // 按顺序处理，找到子表内容
            let lastMatchedAccount: CloudAccount | null = null;
            let inChildTable = false;
            
            allElements.forEach(el => {
                const account = elementToAccount.get(el);
                
                if (account) {
                    lastMatchedAccount = account;
                    inChildTable = false;
                } else if (lastMatchedAccount && !elementToAccount.has(el)) {
                    // 检查这是不是子表行
                    const rowText = el.textContent?.trim() || '';
                    
                    // 先检查是否包含展开的内容，或者距离上一个匹配的元素很近
                    const isChildTable = 
                        // 文本关键词判断
                        rowText.includes('权限集') || 
                        rowText.includes('总条数') ||
                        rowText.includes('描述') ||
                        rowText.includes('操作') ||
                        // 包含表格或嵌套列表
                        el.querySelector('table') !== null ||
                        el.querySelector('[class*="list"]') !== null ||
                        el.querySelector('[class*="table"]') !== null ||
                        // 或者文本较短但不是账户名
                        (rowText.length > 0 && rowText.length < 100 && !this.isAccountMatch(el, {name: '', accountPatterns: []} as any));
                    
                    if (isChildTable || inChildTable) {
                        inChildTable = true;
                        elementToAccount.set(el, lastMatchedAccount);
                        console.log(`[HuaweiAccountSelectionHandler] Found child table element, linking to account: ${lastMatchedAccount.name}`);
                    } else {
                        // 检查这个元素是不是在最近匹配元素的附近（在同一个父容器内）
                        let parentEl: HTMLElement | null = el.parentElement;
                        let foundMatchParent = false;
                        
                        // 查找是否在匹配元素的子树内或者同一个父容器下
                        while (parentEl) {
                            // 检查这个父元素下有没有匹配的账户
                            let hasMatchingSibling = false;
                            const siblings = Array.from(parentEl.children);
                            for (const sibling of siblings) {
                                if (elementToAccount.has(sibling as HTMLElement)) {
                                    hasMatchingSibling = true;
                                    break;
                                }
                            }
                            
                            if (hasMatchingSibling) {
                                foundMatchParent = true;
                                break;
                            }
                            parentEl = parentEl.parentElement;
                        }
                        
                        if (foundMatchParent) {
                            elementToAccount.set(el, lastMatchedAccount);
                            console.log(`[HuaweiAccountSelectionHandler] Found related element in same container, linking to account: ${lastMatchedAccount.name}`);
                        } else {
                            // 遇到完全不相关的行，重置
                            lastMatchedAccount = null;
                            inChildTable = false;
                        }
                    }
                }
            });
            
            // 应用高亮
            elementToAccount.forEach((account, el) => {
                this.applyAccountBackground(el, account);
                
                if (account.roles && account.roles.length > 0) {
                    const highlightColor = account.highlightEnable ? account.highlightColor : undefined;
                    this.highlightRolesInContainer(el, account.roles, highlightColor);
                }
                
                // 添加到高亮列表
                if (!this.highlightedAccounts.has(account.id)) {
                    this.highlightedAccounts.set(account.id, []);
                }
                this.highlightedAccounts.get(account.id)?.push(el);
            });
        }

        this.setupMutationObserver();

        console.log(`[HuaweiAccountSelectionHandler] Applied highlighting for ${enabledAccounts.length} accounts`);
    }

    private logPageStructure(): void {
        console.log('[HuaweiAccountSelectionHandler] === Page Structure ===');
        console.log('[HuaweiAccountSelectionHandler] document.body:', document.body);
        console.log('[HuaweiAccountSelectionHandler] document.body.children count:', document.body.children.length);
        console.log('[HuaweiAccountSelectionHandler] document.body.innerHTML preview:', document.body.innerHTML?.substring(0, 1000));
        console.log('[HuaweiAccountSelectionHandler] ==============');
        
        // 尝试找一些常见元素帮助调试
        const allDivs = document.querySelectorAll('div');
        console.log('[HuaweiAccountSelectionHandler] Found', allDivs.length, 'divs');
        const allLi = document.querySelectorAll('li');
        console.log('[HuaweiAccountSelectionHandler] Found', allLi.length, 'li');
        const allA = document.querySelectorAll('a');
        console.log('[HuaweiAccountSelectionHandler] Found', allA.length, 'a');
        const allCards = document.querySelectorAll('[class*="card"]');
        console.log('[HuaweiAccountSelectionHandler] Found', allCards.length, 'elements with "card" in class');
        const allItems = document.querySelectorAll('[class*="item"]');
        console.log('[HuaweiAccountSelectionHandler] Found', allItems.length, 'elements with "item" in class');
        const allApps = document.querySelectorAll('[class*="app"]');
        console.log('[HuaweiAccountSelectionHandler] Found', allApps.length, 'elements with "app" in class');
    }

    public removeHighlighting(): void {
        this.highlightedAccounts.forEach((elements) => {
            elements.forEach(el => {
                el.style.backgroundColor = '';
                el.style.border = '';
                el.style.boxShadow = '';
                el.removeAttribute('data-enveil-account-id');
                el.classList.remove(HuaweiAccountSelectionHandler.ACCOUNT_HIGHLIGHT_CLASS);
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
            console.log(`[HuaweiAccountSelectionHandler] No containers found for account: ${account.name}`);
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

        console.log(`[HuaweiAccountSelectionHandler] Highlighted account: ${account.name} (${containers.length} containers)`);
    }

    private findAccountContainers(selectors: string[], account: CloudAccount): HTMLElement[] {
        const containers: HTMLElement[] = [];
        const addedElements = new Set<HTMLElement>();
        const matchedRows = new Set<HTMLElement>();

        console.log(`[HuaweiAccountSelectionHandler] findAccountContainers: selectors=${JSON.stringify(selectors)}, account=${account.name}`);

        // 先找到所有匹配的行
        for (const selector of selectors) {
            if (!selector) continue;

            try {
                const elements = document.querySelectorAll<HTMLElement>(selector);

                elements.forEach((el) => {
                    if (addedElements.has(el)) return;
                    
                    const isMatch = this.isAccountMatch(el, account);
                    
                    if (isMatch) {
                        matchedRows.add(el);
                    }
                });
            } catch (e) {
                console.warn(`[HuaweiAccountSelectionHandler] Invalid selector: ${selector}`, e);
            }
        }

        // 然后处理所有行，包括子表
        for (const selector of selectors) {
            if (!selector) continue;

            try {
                const elements = document.querySelectorAll<HTMLElement>(selector);
                console.log(`[HuaweiAccountSelectionHandler] findAccountContainers: Selector "${selector}" found ${elements.length} elements`);

                elements.forEach((el, index) => {
                    if (addedElements.has(el)) return;
                    if (el.classList.contains(HuaweiAccountSelectionHandler.ACCOUNT_HIGHLIGHT_CLASS)) return;

                    const isDirectMatch = matchedRows.has(el);
                    const shouldHighlightWithParent = this.shouldHighlightWithParent(el, matchedRows);

                    if (isDirectMatch || shouldHighlightWithParent) {
                        console.log(`[HuaweiAccountSelectionHandler] findAccountContainers: Element ${index} - isDirectMatch=${isDirectMatch}, shouldHighlightWithParent=${shouldHighlightWithParent} - Adding`);
                        containers.push(el);
                        addedElements.add(el);
                    }
                });
            } catch (e) {
                console.warn(`[HuaweiAccountSelectionHandler] Invalid selector: ${selector}`, e);
            }
        }

        console.log(`[HuaweiAccountSelectionHandler] findAccountContainers: Total containers found: ${containers.length}`);
        return containers;
    }
    
    /**
     * 检查一个行是否应该跟随前面的匹配行高亮
     */
    private shouldHighlightWithParent(row: HTMLElement, matchedRows: Set<HTMLElement>): boolean {
        let prevSibling = row.previousElementSibling;
        
        // 向前查找，直到找到一个匹配行或者遇到非tr元素
        while (prevSibling) {
            if (matchedRows.has(prevSibling as HTMLElement)) {
                // 找到匹配的前面行，检查当前行是不是子表行（不包含账号信息）
                const rowText = row.textContent?.trim() || '';
                // 简单判断：如果行文本不太长，或者看起来像子表标题，就认为是子表行
                return rowText.length < 50 || rowText.includes('权限集') || rowText.includes('总条数');
            }
            
            // 如果前面遇到另一个不匹配的tr，停止（说明不是同一组）
            if (prevSibling.tagName === 'TR') {
                return false;
            }
            
            prevSibling = prevSibling.previousElementSibling;
        }
        
        return false;
    }

    private hasRoleElements(element: HTMLElement): boolean {
        // 简化逻辑，只要有内容即可
        const textContent = element.textContent?.trim() || '';
        const hasContent = textContent.length > 0;
        console.log(`[HuaweiAccountSelectionHandler] hasRoleElements: hasContent=${hasContent}, text="${textContent.substring(0, 100)}"`);
        return true; // 总是返回 true，简化逻辑
    }

    private isAccountMatch(element: HTMLElement, account: CloudAccount): boolean {
        const accountName = account.name?.trim();
        const patterns = account.accountPatterns || [];

        console.log(`[HuaweiAccountSelectionHandler] isAccountMatch: accountName="${accountName}", patterns=${patterns.length}`);

        if (!accountName && patterns.length === 0) {
            console.log(`[HuaweiAccountSelectionHandler] isAccountMatch: No accountName or patterns, returning false`);
            return false;
        }

        // 直接使用整个元素的文本进行匹配，更可靠
        const elementText = element.textContent || '';
        console.log(`[HuaweiAccountSelectionHandler] isAccountMatch: elementText="${elementText}"`);

        for (const pattern of patterns) {
            if (!pattern.enable) continue;

            const matchValue = pattern.matchValue?.trim();
            if (!matchValue) continue;

            console.log(`[HuaweiAccountSelectionHandler] isAccountMatch: Checking pattern "${matchValue}"`);

            // 如果是正则模式，使用正则匹配
            if (pattern.matchPattern === 'regex') {
                try {
                    const regex = new RegExp(matchValue, 'i');
                    const isMatch = regex.test(elementText);
                    console.log(`[HuaweiAccountSelectionHandler] isAccountMatch: Regex "${matchValue}" result=${isMatch}`);
                    if (isMatch) return true;
                } catch (e) {
                    console.warn(`[HuaweiAccountSelectionHandler] Invalid regex: ${matchValue}`, e);
                }
            } else {
                // 关键字模式，直接使用 includes（不转义，支持子字符串匹配）
                const isMatch = elementText.toLowerCase().includes(matchValue.toLowerCase());
                console.log(`[HuaweiAccountSelectionHandler] isAccountMatch: Keyword "${matchValue}" result=${isMatch}`);
                if (isMatch) return true;
            }
        }

        // 检查账户名
        if (accountName) {
            const isMatch = elementText.toLowerCase().includes(accountName.toLowerCase());
            console.log(`[HuaweiAccountSelectionHandler] isAccountMatch: Account name "${accountName}" result=${isMatch}`);
            if (isMatch) {
                return true;
            }
        }

        console.log(`[HuaweiAccountSelectionHandler] isAccountMatch: No match found, returning false`);
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
        element.classList.add(HuaweiAccountSelectionHandler.ACCOUNT_HIGHLIGHT_CLASS);
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

                        if (parent.classList.contains(HuaweiAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS)) {
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

            const className = `${HuaweiAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS}-${role.id}`;

            textNodes.forEach(textNode => {
                const originalText = textNode.textContent || '';

                if (!regex.test(originalText)) return;

                const modifiedText = originalText.replace(
                    regex,
                    `<span class="${className} ${HuaweiAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS}" data-role-id="${role.id}" data-original-text="$1">$1</span>`
                );

                if (modifiedText !== originalText && textNode.parentNode) {
                    const wrapper = document.createElement('span');
                    wrapper.innerHTML = modifiedText;

                    const highlightedElements = wrapper.querySelectorAll(`.${HuaweiAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS}`);
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
        this.styleElement.id = HuaweiAccountSelectionHandler.STYLE_ID;

        this.styleElement.textContent = `
            .${HuaweiAccountSelectionHandler.ACCOUNT_HIGHLIGHT_CLASS} {
                transition: all 0.3s ease !important;
            }
            .${HuaweiAccountSelectionHandler.ROLE_HIGHLIGHT_CLASS} {
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
        
        // 重新应用整个高亮流程
        const accounts = this.currentEnvironment.accounts?.filter(acc => acc.enable) || [];
        
        // 清除现有高亮但保留样式
        const tempStyles = this.styleElement;
        this.styleElement = null;
        this.highlightedAccounts.clear();
        
        // 清除DOM上的高亮
        document.querySelectorAll('.' + HuaweiAccountSelectionHandler.ACCOUNT_HIGHLIGHT_CLASS).forEach(el => {
            el.classList.remove(HuaweiAccountSelectionHandler.ACCOUNT_HIGHLIGHT_CLASS);
            el.style.backgroundColor = '';
            el.style.border = '';
            el.style.boxShadow = '';
        });
        
        this.styleElement = tempStyles;
        
        // 重新应用高亮
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
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}