import { CloudEnvironment, CloudAccount, CloudRole, CloudProvider } from '../entrypoints/options/types';

/**
 * MagicReloginHandler - 处理 AWS 重新登录的 Magic 功能
 *
 * 功能流程：
 * 1. 检测 AWS Console 注销弹窗
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
}

export class MagicReloginHandler {
  private static instance: MagicReloginHandler;
  private reloginState: ReloginState | null = null;
  private magicButton: HTMLElement | null = null;
  private observer: MutationObserver | null = null;

  // AWS CN 注销弹窗的选择器
  private readonly logoutDialogSelectors = [
    // 中文注销弹窗
    '.awsui_dialog_1d2i7_18r6w_169:has(.awsui_header--text_1d2i7_18r6w_404:contains("您已注销"))',
    '.awsui_dialog_1d2i7_18r6w_169:has(span:contains("您已注销"))',
    // 英文注销弹窗
    '.awsui_dialog_1d2i7_18r6w_169:has(span:contains("You have signed out"))',
    // 通用选择器
    '[data-awsui-analytics*="Modal"]:has(span:contains("注销"))',
    '[data-awsui-analytics*="Modal"]:has(span:contains("signed out"))',
    // 基于按钮文本的选择器
    '.awsui_dialog_1d2i7_18r6w_169:has(button:contains("重新登录"))',
    '.awsui_dialog_1d2i7_18r6w_169:has(button:contains("Sign in again"))',
    // 更通用的选择器
    '.awsui_dialog_1d2i7_18r6w_169',
    '.awsui_focus-lock_1d2i7_18r6w_306'
  ];

  // 重新登录按钮的选择器
  private readonly reloginButtonSelectors = [
    'button:contains("重新登录")',
    'button:contains("Sign in again")',
    '.awsui_variant-primary_vjswe_381hp_235',
    'button[type="submit"]'
  ];

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
    if (!environment || !this.isAutoReloginEnabled(environment)) {
      return;
    }

    console.log('[MagicRelogin] Starting to watch for logout dialog');

    // 立即检查一次
    this.checkForLogoutDialog(environment, accounts);

    // 使用 MutationObserver 监听 DOM 变化
    this.observer = new MutationObserver((mutations) => {
      // 检查是否有新的弹窗出现
      const hasDialogChange = mutations.some(mutation =>
        Array.from(mutation.addedNodes).some(node =>
          node instanceof HTMLElement &&
          (node.classList.contains('awsui_dialog_1d2i7_18r6w_169') ||
           node.querySelector('.awsui_dialog_1d2i7_18r6w_169'))
        )
      );

      if (hasDialogChange) {
        console.log('[MagicRelogin] Detected dialog change, checking for logout dialog');
        this.checkForLogoutDialog(environment, accounts);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
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
    // 检查环境配置中的 enableAutoRelogin 标志
    if (environment.template?.enableAutoRelogin) {
      return true;
    }

    // 检查是否有配置 SAML URL
    if (environment.template?.samlUrl && environment.template.samlUrl.trim() !== '') {
      return true;
    }

    return false;
  }

  /**
   * 检查是否存在注销弹窗
   */
  private checkForLogoutDialog(environment: CloudEnvironment, accounts: CloudAccount[]): void {
    // 尝试多种方式查找注销弹窗
    let logoutDialog = this.findLogoutDialog();

    if (logoutDialog) {
      console.log('[MagicRelogin] Found logout dialog:', logoutDialog);
      this.injectMagicButton(logoutDialog, environment, accounts);
    }
  }

  /**
   * 查找注销弹窗
   */
  private findLogoutDialog(): HTMLElement | null {
    // 方法1: 通过标题文本查找
    const dialogs = document.querySelectorAll('.awsui_dialog_1d2i7_18r6w_169, .awsui_focus-lock_1d2i7_18r6w_306');
    for (const dialog of Array.from(dialogs)) {
      const text = dialog.textContent || '';
      // 检查是否包含注销相关文本
      if (text.includes('您已注销') ||
          text.includes('You have signed out') ||
          text.includes('重新登录') ||
          text.includes('Sign in again')) {
        return dialog as HTMLElement;
      }
    }

    // 方法2: 通过 focus-lock 容器查找
    const focusLocks = document.querySelectorAll('.awsui_focus-lock_1d2i7_18r6w_306');
    for (const lock of Array.from(focusLocks)) {
      const text = lock.textContent || '';
      if (text.includes('注销') || text.includes('signed out')) {
        return lock as HTMLElement;
      }
    }

    // 方法3: 查找包含特定按钮的对话框
    const allDialogs = document.querySelectorAll('[class*="awsui_dialog"]');
    for (const dialog of Array.from(allDialogs)) {
      const buttons = (dialog as HTMLElement).querySelectorAll('button');
      for (const button of Array.from(buttons)) {
        const buttonText = button.textContent || '';
        if (buttonText.includes('重新登录') || buttonText.includes('Sign in again')) {
          return dialog as HTMLElement;
        }
      }
    }

    return null;
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
    // 查找按钮
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
    const primaryButtons = dialog.querySelectorAll('.awsui_variant-primary_vjswe_381hp_235');
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

    // 复制 AWS 按钮的样式类
    button.className = 'awsui_button_vjswe_381hp_157 awsui_variant-primary_vjswe_381hp_235 enveil-magic-button';

    // 设置按钮文本
    const span = document.createElement('span');
    span.className = 'awsui_content_vjswe_381hp_153 awsui_label_1f1d4_ocied_5';
    span.textContent = 'Magic';
    button.appendChild(span);

    // 添加自定义样式
    button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    button.style.border = 'none';
    button.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.4)';

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
      isWaitingForLogin: true
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
   */
  private extractCurrentAccountInfo(accounts: CloudAccount[]): { accountId?: string; roleArn?: string } {
    const result: { accountId?: string; roleArn?: string } = {};

    // 从 URL 中提取 account 信息
    const url = window.location.href;

    // 尝试从 URL 参数中提取
    const urlParams = new URLSearchParams(window.location.search);
    const accountParam = urlParams.get('account');
    if (accountParam) {
      result.accountId = accountParam;
    }

    // 尝试从页面内容中提取 account ID（12位数字）
    const accountIdMatch = url.match(/(\d{12})/);
    if (accountIdMatch) {
      result.accountId = accountIdMatch[1];
    }

    // 尝试从 cookie 或 localStorage 中提取 role 信息
    const roleCookie = document.cookie.split(';').find(c => c.trim().startsWith('aws_role='));
    if (roleCookie) {
      result.roleArn = decodeURIComponent(roleCookie.split('=')[1]);
    }

    // 尝试从页面元素中提取 role 信息
    const roleElements = document.querySelectorAll('[data-testid="nav-username-menu"], #nav-usernameMenu');
    for (const element of Array.from(roleElements)) {
      const text = element.textContent || '';
      // 匹配 ARN 格式
      const arnMatch = text.match(/(arn:aws-cn:iam::\d{12}:role\/[^\s]+)/);
      if (arnMatch) {
        result.roleArn = arnMatch[1];
        break;
      }
    }

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
