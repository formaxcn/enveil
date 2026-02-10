import { CloudEnvironment, CloudAccount, CloudRole, CloudProvider } from '../entrypoints/options/types';

/**
 * MagicReloginHandler - 处理 AWS 重新登录的 Magic 功能
 *
 * 功能流程：
 * 1. 检测 AWS Console 注销弹窗 (通过 document.getElementById("awsc-nav-signin-again-modal-root"))
 * 2. 在"重新登录"按钮旁添加 Magic 按钮
 * 3. 点击 Magic 按钮后：
 *    - 获取当前页面的 account 和 role 信息
 *    - 根据配置打开 SAML 登录页面（新标签页）
 *    - 在 SAML 页面自动选择对应的 account 和 role
 *    - 登录成功后跳转回原标签页并刷新
 */

interface ReloginState {
  sourceTabId: number;
  sourceUrl: string;
  accountId?: string;
  roleArn?: string;
  environment?: CloudEnvironment;
  isWaitingForLogin: boolean;
  isMagicRelogin?: boolean;
}

export class MagicReloginHandler {
  private static instance: MagicReloginHandler;
  private reloginState: ReloginState | null = null;
  private magicButton: HTMLElement | null = null;
  private observer: MutationObserver | null = null;

  private constructor() {}

  public static getInstance(): MagicReloginHandler {
    if (!MagicReloginHandler.instance) {
      MagicReloginHandler.instance = new MagicReloginHandler();
    }
    return MagicReloginHandler.instance;
  }

  /**
   * 开始监听注销弹窗
   */
  public startWatching(environment: CloudEnvironment | null, accounts: CloudAccount[]): void {
    console.log('[MagicRelogin] startWatching called', {
      hasEnvironment: !!environment,
      environmentName: environment?.name,
      provider: environment?.provider,
      accountsCount: accounts?.length,
      isAutoReloginEnabled: environment ? this.isAutoReloginEnabled(environment) : false,
      samlUrl: environment?.template?.samlUrl,
      enableAutoRelogin: environment?.template?.enableAutoRelogin
    });

    if (!environment) {
      console.log('[MagicRelogin] No environment provided, skipping');
      return;
    }

    if (!this.isAutoReloginEnabled(environment)) {
      console.log('[MagicRelogin] Auto relogin not enabled for this environment');
      return;
    }

    console.log('[MagicRelogin] Starting to watch for logout dialog');

    // 立即检查一次
    this.checkForLogoutDialog(environment, accounts);

    // 使用 MutationObserver 监听 DOM 变化
    this.observer = new MutationObserver((mutations) => {
      // 检查是否有 awsc-nav-signin-again-modal-root 元素被添加
      const hasModalChange = mutations.some(mutation =>
        Array.from(mutation.addedNodes).some(node => {
          if (node instanceof HTMLElement) {
            const isSigninAgainModal = node.id === 'awsc-nav-signin-again-modal-root';
            const containsSigninModal = node.querySelector('#awsc-nav-signin-again-modal-root') !== null;

            if (isSigninAgainModal || containsSigninModal) {
              console.log('[MagicRelogin] Detected signin again modal element');
              return true;
            }
          }
          return false;
        })
      );

      if (hasModalChange) {
        console.log('[MagicRelogin] Detected modal change, checking for logout dialog');
        this.checkForLogoutDialog(environment, accounts);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('[MagicRelogin] MutationObserver started');
  }

  /**
   * 停止监听
   */
  public stopWatching(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.removeMagicButton();
    console.log('[MagicRelogin] Stopped watching');
  }

  /**
   * 检查是否启用了自动重新登录
   */
  private isAutoReloginEnabled(environment: CloudEnvironment): boolean {
    console.log('[MagicRelogin] Checking if auto relogin is enabled:', {
      template: !!environment.template,
      enableAutoRelogin: environment.template?.enableAutoRelogin,
      samlUrl: environment.template?.samlUrl,
      hasSamlUrl: !!(environment.template?.samlUrl && environment.template.samlUrl.trim() !== '')
    });

    // 检查环境配置中的 enableAutoRelogin 标志
    if (environment.template?.enableAutoRelogin) {
      console.log('[MagicRelogin] Auto relogin enabled via enableAutoRelogin flag');
      return true;
    }

    // 检查是否有配置 SAML URL
    if (environment.template?.samlUrl && environment.template.samlUrl.trim() !== '') {
      console.log('[MagicRelogin] Auto relogin enabled via samlUrl configuration');
      return true;
    }

    console.log('[MagicRelogin] Auto relogin NOT enabled');
    return false;
  }

  /**
   * 检查是否存在注销弹窗
   */
  private checkForLogoutDialog(environment: CloudEnvironment, accounts: CloudAccount[]): void {
    console.log('[MagicRelogin] checkForLogoutDialog called');

    // 使用 document.getElementById 查找 AWS 注销弹窗
    const signinAgainModal = document.getElementById('awsc-nav-signin-again-modal-root');
    console.log('[MagicRelogin] Checking for awsc-nav-signin-again-modal-root:', !!signinAgainModal);

    if (!signinAgainModal) {
      console.log('[MagicRelogin] No logout dialog found');
      return;
    }

    console.log('[MagicRelogin] Found awsc-nav-signin-again-modal-root');

    // 查找弹窗内容容器
    const modalContent = signinAgainModal.querySelector('[class*="awsui_dialog"]') as HTMLElement;
    const logoutDialog = modalContent || signinAgainModal;

    console.log('[MagicRelogin] Using dialog element:', {
      className: logoutDialog.className,
      id: logoutDialog.id
    });

    this.injectMagicButton(logoutDialog, environment, accounts);
  }

  /**
   * 注入 Magic 按钮
   */
  private injectMagicButton(
    logoutDialog: HTMLElement,
    environment: CloudEnvironment,
    accounts: CloudAccount[]
  ): void {
    // 检查是否已经添加了 Magic 按钮
    if (this.magicButton && this.magicButton.isConnected) {
      return;
    }

    // 查找重新登录按钮
    const reloginButton = this.findReloginButton(logoutDialog);
    if (!reloginButton) {
      console.log('[MagicRelogin] Could not find relogin button');
      return;
    }

    console.log('[MagicRelogin] Found relogin button, injecting Magic button');

    // 创建 Magic 按钮
    this.magicButton = this.createMagicButton(environment, accounts);

    // 将 Magic 按钮插入到重新登录按钮旁边
    const buttonContainer = reloginButton.parentElement;
    if (buttonContainer) {
      // 在重新登录按钮之前插入 Magic 按钮
      buttonContainer.insertBefore(this.magicButton, reloginButton);

      // 添加一些间距样式
      this.magicButton.style.marginRight = '12px';
    } else {
      // 如果没有容器，直接插入到按钮后面
      reloginButton.parentNode?.insertBefore(this.magicButton, reloginButton.nextSibling);
    }

    console.log('[MagicRelogin] Magic button injected successfully');
  }

  /**
   * 查找重新登录按钮
   */
  private findReloginButton(dialog: HTMLElement): HTMLElement | null {
    // 查找按钮文本包含"重新登录"或"Sign in again"的按钮
    const buttons = dialog.querySelectorAll('button');
    for (const button of Array.from(buttons)) {
      const text = button.textContent || '';
      if (text.includes('重新登录') ||
          text.includes('Sign in again') ||
          button.getAttribute('type') === 'submit') {
        return button as HTMLElement;
      }
    }

    // 查找主按钮样式的元素
    const primaryButtons = dialog.querySelectorAll('[class*="awsui_variant-primary"]');
    if (primaryButtons.length > 0) {
      return primaryButtons[0] as HTMLElement;
    }

    return null;
  }

  /**
   * 创建 Magic 按钮
   */
  private createMagicButton(environment: CloudEnvironment, accounts: CloudAccount[]): HTMLElement {
    const button = document.createElement('button');

    // 使用自定义样式，不依赖 AWS 的随机 class 名
    button.className = 'enveil-magic-button';

    // 添加 Enveil 扩展图标
    const iconImg = document.createElement('img');
    iconImg.src = browser.runtime.getURL('icon/16-gray.png' as any);
    iconImg.width = 16;
    iconImg.height = 16;
    iconImg.style.marginRight = '6px';
    iconImg.style.flexShrink = '0';
    iconImg.alt = 'Enveil';
    button.appendChild(iconImg);

    // 设置按钮文本
    const span = document.createElement('span');
    span.textContent = 'Relogin';
    button.appendChild(span);

    // 添加 AWS 风格的基础样式 + 自定义渐变背景
    button.style.cssText = `
      font-family: "Amazon Ember", "Helvetica Neue", Roboto, Arial, sans-serif;
      font-size: 14px;
      font-weight: 700;
      line-height: 20px;
      padding: 4px 20px;
      border-radius: 2px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
      transition: all 0.2s ease;
    `;

    // 添加点击事件
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleMagicClick(environment, accounts);
    });

    // 添加悬停效果
    button.addEventListener('mouseenter', () => {
      button.style.background = 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)';
      button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.5)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      button.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.4)';
    });

    return button;
  }

  /**
   * 处理 Magic 按钮点击
   */
  private async handleMagicClick(environment: CloudEnvironment, accounts: CloudAccount[]): Promise<void> {
    console.log('[MagicRelogin] Magic button clicked');

    // 1. 获取当前页面的 account 和 role 信息
    const currentInfo = this.extractCurrentAccountInfo(accounts);
    console.log('[MagicRelogin] Current account info:', currentInfo);

    // 2. 获取 SAML URL
    const samlUrl = this.getSamlUrl(environment);
    if (!samlUrl) {
      console.error('[MagicRelogin] No SAML URL configured');
      alert('请先配置 SAML 登录地址');
      return;
    }

    // 3. 保存重新登录状态到 storage
    this.reloginState = {
      sourceTabId: -1, // 将在 background 中设置
      sourceUrl: window.location.href,
      accountId: currentInfo.accountId,
      roleArn: currentInfo.roleArn,
      environment: environment,
      isWaitingForLogin: true,
      isMagicRelogin: true // 标记是通过 Magic 按钮触发的 relogin
    };

    // 保存到 storage 供其他页面使用
    await this.saveReloginState(this.reloginState);

    // 4. 发送消息给 background script 打开新标签页
    try {
      await browser.runtime.sendMessage({
        action: 'MAGIC_RELOGIN_START',
        samlUrl: samlUrl,
        accountId: currentInfo.accountId,
        roleArn: currentInfo.roleArn,
        sourceUrl: window.location.href
      });

      console.log('[MagicRelogin] Sent MAGIC_RELOGIN_START message');
    } catch (error) {
      console.error('[MagicRelogin] Failed to send message:', error);

      // 如果消息发送失败，直接打开 SAML URL
      window.open(samlUrl, '_blank');
    }
  }

  /**
   * 提取当前页面的 account 和 role 信息
   * 优先从界面元素中提取
   */
  private extractCurrentAccountInfo(accounts: CloudAccount[]): { accountId?: string; roleArn?: string } {
    const result: { accountId?: string; roleArn?: string } = {};

    console.log('[MagicRelogin] Extracting current account info from page...');

    const url = window.location.href;
    console.log('[MagicRelogin] Current URL:', url);

    // ========== 优先从界面元素中提取 Account ID ==========
    // AWS Console 的账户信息通常在顶部导航栏的 account info tile 中
    const accountInfoSelectors = [
      '[data-testid="awsc-account-info-tile"]',
      '[data-testid="awsc-nav-account-menu-button"]',
      '.awsc-nav-account-info',
      '[class*="account-info"]',
      '#nav-usernameMenu'
    ];

    for (const selector of accountInfoSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of Array.from(elements)) {
        const text = element.textContent || '';
        console.log('[MagicRelogin] Checking account element:', selector, 'text:', text.substring(0, 100));

        // 匹配带连字符的格式（如 0663-2217-6721）- AWS 标准显示格式
        const dashedAccountMatch = text.match(/(\d{4}-\d{4}-\d{4})/);
        if (dashedAccountMatch) {
          result.accountId = dashedAccountMatch[1].replace(/-/g, '');
          console.log('[MagicRelogin] Found accountId from UI element:', dashedAccountMatch[1], '->', result.accountId);
          break;
        }

        // 匹配纯数字 12 位
        const accountMatch = text.match(/(\d{12})/);
        if (accountMatch) {
          result.accountId = accountMatch[1];
          console.log('[MagicRelogin] Found accountId from UI element:', accountMatch[1]);
          break;
        }
      }
      if (result.accountId) break;
    }

    // ========== 从界面元素中提取 Role 信息 ==========
    // 从 account info tile 中提取 role 名称
    if (result.accountId) {
      for (const selector of accountInfoSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of Array.from(elements)) {
          const text = element.textContent || '';
          console.log('[MagicRelogin] Checking role in element:', selector, 'text:', text.substring(0, 150));

          // 尝试匹配完整的 ARN
          const arnMatch = text.match(/(arn:aws(?:-cn)?:iam::\d{12}:role\/[^\s\/]+)/);
          if (arnMatch && !result.roleArn) {
            result.roleArn = arnMatch[1];
            console.log('[MagicRelogin] Found roleArn from UI element:', arnMatch[1]);
            break;
          }

          // 从文本中提取 role 名称（通常在 account 名称后面）
          // 格式如: "apacdl-cdc-dev (0663-2217-6721)" 或 "r-aad-apacdl-cdc-dev-aiSwatUser/ZTANG26@volvocars.com"
          // 尝试匹配 role/ 开头的部分
          const roleWithPrefixMatch = text.match(/role\/([^\s\/]+)/i);
          if (roleWithPrefixMatch && !result.roleArn) {
            const partition = url.includes('amazonaws.cn') ? 'aws-cn' : 'aws';
            result.roleArn = `arn:${partition}:iam::${result.accountId}:role/${roleWithPrefixMatch[1]}`;
            console.log('[MagicRelogin] Constructed roleArn from UI text:', result.roleArn);
            break;
          }

          // 尝试从 email/用户名格式中提取 role 名称
          // 格式如: "r-aad-apacdl-cdc-dev-aiSwatUser/ZTANG26@volvocars.com"
          // 匹配 r-aad- 开头的完整 role 名称（包含 / 和 @）
          const userMatch = text.match(/(r-aad-[^\s]+)/);
          if (userMatch && !result.roleArn) {
            result.roleArn = userMatch[1];
            console.log('[MagicRelogin] Found roleArn from UI text:', result.roleArn);
            break;
          }
        }
        if (result.roleArn) break;
      }
    }

    console.log('[MagicRelogin] Final extracted account info:', result);
    return result;
  }

  /**
   * 获取 SAML URL
   */
  private getSamlUrl(environment: CloudEnvironment): string | null {
    // 优先使用环境配置中的 SAML URL
    if (environment.template?.samlUrl && environment.template.samlUrl.trim() !== '') {
      return environment.template.samlUrl;
    }

    // 根据提供商使用默认 URL
    switch (environment.provider) {
      case CloudProvider.AWS_CN:
        // 返回 null，因为 AWS CN 需要配置具体的 SAML URL
        return null;
      case CloudProvider.AWS_GLOBAL:
        return null;
      default:
        return null;
    }
  }

  /**
   * 保存重新登录状态
   */
  private async saveReloginState(state: ReloginState): Promise<void> {
    try {
      await browser.storage.local.set({
        'enveil_magic_relogin_state': state
      });
    } catch (error) {
      console.error('[MagicRelogin] Failed to save state:', error);
    }
  }

  /**
   * 加载重新登录状态
   */
  public async loadReloginState(): Promise<ReloginState | null> {
    try {
      const result = await browser.storage.local.get('enveil_magic_relogin_state');
      const state = result['enveil_magic_relogin_state'];
      if (state && typeof state === 'object' && 'sourceTabId' in state) {
        return state as ReloginState;
      }
      return null;
    } catch (error) {
      console.error('[MagicRelogin] Failed to load state:', error);
      return null;
    }
  }

  /**
   * 清除重新登录状态
   */
  public async clearReloginState(): Promise<void> {
    try {
      await browser.storage.local.remove('enveil_magic_relogin_state');
      this.reloginState = null;
    } catch (error) {
      console.error('[MagicRelogin] Failed to clear state:', error);
    }
  }

  /**
   * 检查是否在等待重新登录
   */
  public isWaitingForRelogin(): boolean {
    return this.reloginState?.isWaitingForLogin ?? false;
  }

  /**
   * 移除 Magic 按钮
   */
  private removeMagicButton(): void {
    if (this.magicButton) {
      this.magicButton.remove();
      this.magicButton = null;
    }
  }

  /**
   * 获取当前重新登录状态
   */
  public getReloginState(): ReloginState | null {
    return this.reloginState;
  }
}

// 导出单例实例
export const magicReloginHandler = MagicReloginHandler.getInstance();
