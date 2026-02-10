import { AppConfig, SiteConfig, CloudAccount, CloudRole, CloudEnvironment, CloudProvider } from './options/types';
import { CloudHighlighter } from '../components/CloudHighlighter';
import { AccountSelectionHighlighter } from '../components/AccountSelectionHighlighter';
import { MagicReloginHandler, magicReloginHandler } from '../components/MagicReloginHandler';
import { CloudMatcher } from '../utils/cloudMatcher';
import { getCloudTemplate } from '../utils/cloudTemplates';

// 全局变量存储当前云环境信息
let currentCloudEnvironment: CloudEnvironment | null = null;
let currentCloudAccounts: CloudAccount[] = [];

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    console.log('Enveil: Content script loaded');

    // Initialize cloud highlighters
    const cloudHighlighter = new CloudHighlighter();
    const accountSelectionHighlighter = new AccountSelectionHighlighter();

    // 初始化 Magic Relogin Handler
    await initMagicRelogin();

    // Initial check (in case background script doesn't send update immediately on reload/install)
    // However, usually background script handles updates.
    // We primarily listen for messages.

    browser.runtime.onMessage.addListener((message) => {
      if (message.action === 'MATCH_UPDATE') {
        const site = message.site as SiteConfig | null;
        if (site) {
          console.log('[Enveil Content] Received MATCH_UPDATE: Match found', site);
          mountUI(site);
        } else {
          console.log('[Enveil Content] Received MATCH_UPDATE: No match, unmounting UI');
          unmountUI();
        }
      } else if (message.action === 'CLOUD_MATCH_UPDATE') {
        const cloudAccounts = message.cloudAccounts as CloudAccount[] | null;
        const cloudRoles = message.cloudRoles as CloudRole[] | null;
        const cloudEnvironment = message.cloudEnvironment as CloudEnvironment | null;
        const isAccountSelectionPage = message.isAccountSelectionPage as boolean;

        console.log('[Enveil Content] Received CLOUD_MATCH_UPDATE:', {
          hasCloudAccounts: !!(cloudAccounts && cloudAccounts.length > 0),
          accountsCount: cloudAccounts?.length || 0,
          hasCloudEnvironment: !!cloudEnvironment,
          environmentName: cloudEnvironment?.name,
          environmentProvider: cloudEnvironment?.provider,
          isAccountSelectionPage,
          currentUrl: window.location.href
        });

        // 保存当前云环境信息（供 Magic Relogin 使用）
        if (cloudEnvironment) {
          currentCloudEnvironment = cloudEnvironment;
          currentCloudAccounts = cloudAccounts || [];
          console.log('[Enveil Content] Saved cloud environment for Magic Relogin:', {
            name: cloudEnvironment.name,
            provider: cloudEnvironment.provider,
            templateSamlUrl: cloudEnvironment.template?.samlUrl,
            templateEnableAutoRelogin: cloudEnvironment.template?.enableAutoRelogin
          });
        }

        if (cloudAccounts && cloudAccounts.length > 0) {
          console.log('[Enveil Content] Processing cloud matches:', {
            accounts: cloudAccounts.map(acc => acc.name),
            rolesCount: cloudRoles?.length || 0,
            isAccountSelectionPage
          });

          // Use AccountSelectionHighlighter for account selection pages
          if (cloudEnvironment) {
            if (isAccountSelectionPage) {
              // Get full template with selectors for account selection pages
              const fullTemplate = getCloudTemplate(cloudEnvironment.provider);
              const environmentWithFullTemplate = {
                ...cloudEnvironment,
                template: fullTemplate
              };
              mountAccountSelectionUI(environmentWithFullTemplate, cloudAccounts, cloudRoles, accountSelectionHighlighter);

              // 检查是否需要自动选择角色（Magic Relogin 流程）
              console.log('[Enveil Content] Account selection page detected, calling handleAutoRoleSelection...');
              handleAutoRoleSelection(environmentWithFullTemplate, cloudAccounts);
            } else {
              // Use CloudHighlighter for console pages - pass all matching accounts and environment
              // Get full template with selectors since stored template may be incomplete
              const fullTemplate = getCloudTemplate(cloudEnvironment.provider);
              console.log('[Enveil Content] Full template selectors:', fullTemplate.selectors);

              // 合并模板：保留用户配置的 samlUrl 和 enableAutoRelogin，使用硬编码的选择器
              const mergedTemplate = {
                ...fullTemplate,
                // 优先使用用户配置的值
                samlUrl: cloudEnvironment.template?.samlUrl || fullTemplate.samlUrl,
                enableAutoRelogin: cloudEnvironment.template?.enableAutoRelogin ?? fullTemplate.enableAutoRelogin
              };

              console.log('[Enveil Content] Merged template:', {
                samlUrl: mergedTemplate.samlUrl,
                enableAutoRelogin: mergedTemplate.enableAutoRelogin,
                hasUserSamlUrl: !!cloudEnvironment.template?.samlUrl,
                hasUserEnableAutoRelogin: cloudEnvironment.template?.enableAutoRelogin !== undefined
              });

              const environmentWithFullTemplate = {
                ...cloudEnvironment,
                template: mergedTemplate
              };
              mountCloudUI(cloudAccounts, cloudRoles, cloudHighlighter, environmentWithFullTemplate);

              // 启动 Magic Relogin 监听（用于 Console 页面的注销弹窗）
              console.log('[Enveil Content] Starting Magic Relogin watcher for console page');
              magicReloginHandler.startWatching(environmentWithFullTemplate, cloudAccounts);
            }
          }
        } else {
          console.log('[Enveil Content] No cloud match for current URL');

          // 只在当前页面确实不是云环境页面时才卸载
          // 避免在 SPA 路由变化或 tab 切换时误卸载
          const currentUrl = window.location.href;
          const isAwsConsole = currentUrl.includes('console.amazonaws.cn') ||
                               currentUrl.includes('console.aws.amazon.com');
          const isSamlPage = currentUrl.includes('signin.amazonaws.cn/saml') ||
                            currentUrl.includes('signin.aws.amazon.com/saml');

          if (!isAwsConsole && !isSamlPage) {
            console.log('[Enveil Content] Not an AWS page, unmounting cloud UI');
            unmountCloudUI(cloudHighlighter);
            unmountAccountSelectionUI(accountSelectionHighlighter);

            // 停止 Magic Relogin 监听
            console.log('[Enveil Content] Stopping Magic Relogin watcher');
            magicReloginHandler.stopWatching();
          } else {
            console.log('[Enveil Content] Still on AWS page, keeping UI mounted:', {
              isAwsConsole,
              isSamlPage,
              currentUrl
            });
          }
        }
      } else if (message.action === 'MAGIC_RELOGIN_REFRESH_SOURCE') {
        // 收到刷新源页面的消息（SAML 登录成功后）
        console.log('[Enveil Content] Received MAGIC_RELOGIN_REFRESH_SOURCE, refreshing page');
        handleReloginComplete();
      }
    });
  },
});

/**
 * 初始化 Magic Relogin 功能
 * 检查是否是从 SAML 登录页面返回的
 */
async function initMagicRelogin(): Promise<void> {
  // 检查是否有重新登录状态
  const reloginState = await magicReloginHandler.loadReloginState();

  if (reloginState?.isWaitingForLogin) {
    console.log('[Enveil Content] Found relogin state:', reloginState);

    // 检查当前页面是否是 AWS Console（登录成功）
    const currentUrl = window.location.href;
    const isAwsConsole = currentUrl.includes('console.amazonaws.cn') ||
                         currentUrl.includes('console.aws.amazon.com');

    if (isAwsConsole) {
      console.log('[Enveil Content] Detected AWS Console, relogin successful');

      // 清除重新登录状态
      await magicReloginHandler.clearReloginState();

      // 通知 background 刷新源页面
      try {
        await browser.runtime.sendMessage({
          action: 'MAGIC_RELOGIN_SUCCESS',
          sourceUrl: reloginState.sourceUrl
        });
      } catch (error) {
        console.error('[Enveil Content] Failed to notify relogin success:', error);
      }
    }
  }
}

// 自动登录管理器类
class AutoLoginManager {
  private countdownInterval: number | null = null;
  private isCancelled = false;
  private accountContainer: HTMLElement | null = null;
  private roleElement: HTMLElement | null = null;
  private cancelHandler: (() => void) | null = null;
  private markStartTime: number = 0;

  async start(accountId?: string, roleArn?: string): Promise<void> {
    console.log('[AutoLoginManager] Starting auto login', { accountId, roleArn });

    if (!accountId && !roleArn) {
      console.log('[AutoLoginManager] No accountId or roleArn, skipping');
      return;
    }

    // 重置状态
    this.isCancelled = false;
    this.cleanup();
    this.markStartTime = Date.now();

    // 先从页面中获取已渲染的高亮颜色
    const renderedColor = getRenderedHighlightColor();
    console.log('[AutoLoginManager] Detected rendered highlight color:', renderedColor);

    // 计算对比色
    const contrastColor = renderedColor ? getContrastColor(renderedColor) : '#e74c3c';
    console.log('[AutoLoginManager] Using contrast color:', contrastColor);

    // 查找并标记上次使用的 account 和 role（使用对比色）
    this.accountContainer = findAndMarkLastUsedAccount(accountId, contrastColor);
    this.roleElement = findAndMarkLastUsedRole(roleArn, contrastColor);

    console.log('[AutoLoginManager] Found accountContainer:', this.accountContainer ? 'YES' : 'NO');
    console.log('[AutoLoginManager] Found roleElement:', this.roleElement ? 'YES' : 'NO');

    if (!this.accountContainer && !this.roleElement) {
      console.log('[AutoLoginManager] Could not find account or role to auto select');
      return;
    }

    console.log('[AutoLoginManager] Marked last used account/role at:', new Date(this.markStartTime).toISOString());

    // 立即设置取消监听（让用户可以在任何时候取消）
    this.setupCancellation();

    // 立即开始 10 秒倒计时（与高亮同步）
    await this.runCountdown(10, accountId, roleArn);
  }

  private async runCountdown(seconds: number, accountId?: string, roleArn?: string): Promise<void> {
    console.log('[AutoLoginManager] Starting countdown:', seconds);

    let remaining = seconds;

    // 只为 role 创建倒计时 badge（不为 account 创建）
    if (this.roleElement) {
      createCountdownBadge(this.roleElement, remaining, 'role');
    }

    return new Promise((resolve) => {
      this.countdownInterval = window.setInterval(() => {
        remaining--;
        updateCountdownBadges(remaining);

        console.log('[AutoLoginManager] Countdown:', remaining);

        if (remaining <= 0 || this.isCancelled) {
          if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
          }

          if (!this.isCancelled) {
            const now = Date.now();
            const totalTime = now - this.markStartTime;
            console.log('[AutoLoginManager] === EXECUTING LOGIN NOW ===');
            console.log('[AutoLoginManager] Mark time:', new Date(this.markStartTime).toISOString());
            console.log('[AutoLoginManager] Current time:', new Date(now).toISOString());
            console.log('[AutoLoginManager] Total elapsed time:', totalTime, 'ms (', totalTime/1000, 's)');
            console.log('[AutoLoginManager] Logging in with:', { accountId, roleArn });
            // 执行真正的登录
            executeAutoLogin(accountId, roleArn);
          } else {
            console.log('[AutoLoginManager] Auto login was cancelled');
          }

          resolve();
        }
      }, 1000);
    });
  }

  private setupCancellation(): void {
    const events = ['click', 'keydown', 'change', 'input'];

    this.cancelHandler = () => {
      if (!this.isCancelled) {
        console.log('[AutoLoginManager] User interaction detected, cancelling auto login');
        this.cancel();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, this.cancelHandler!, { once: false, capture: true });
    });
  }

  cancel(): void {
    this.isCancelled = true;
    this.cleanup();
  }

  private cleanup(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    if (this.cancelHandler) {
      const events = ['click', 'keydown', 'change', 'input'];
      events.forEach(event => {
        document.removeEventListener(event, this.cancelHandler!, { capture: true });
      });
      this.cancelHandler = null;
    }

    // 移除倒计时 badge
    const badges = document.querySelectorAll('.enveil-countdown-badge');
    badges.forEach(badge => badge.remove());
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 全局自动登录管理器实例
const autoLoginManager = new AutoLoginManager();

// 防止 handleAutoRoleSelection 被重复调用的标志
let isAutoRoleSelectionStarted = false;

/**
 * 处理自动角色选择（在 SAML 登录页面）
 */
async function handleAutoRoleSelection(
  environment: CloudEnvironment,
  accounts: CloudAccount[]
): Promise<void> {
  // 防止重复调用
  if (isAutoRoleSelectionStarted) {
    console.log('[Enveil Content] handleAutoRoleSelection already started, skipping');
    return;
  }
  isAutoRoleSelectionStarted = true;

  // 清理可能存在的旧倒计时
  cleanupAllEnveilBadges();

  console.log('[Enveil Content] handleAutoRoleSelection called');
  console.log('[Enveil Content] Environment:', environment.name, environment.provider);
  console.log('[Enveil Content] Accounts:', accounts.map(acc => acc.name));

  const reloginState = await magicReloginHandler.loadReloginState();

  console.log('[Enveil Content] Loaded reloginState:', reloginState);
  console.log('[Enveil Content] Full reloginState details:');
  if (reloginState) {
    console.log('  - sourceTabId:', reloginState.sourceTabId);
    console.log('  - sourceUrl:', reloginState.sourceUrl);
    console.log('  - accountId:', reloginState.accountId);
    console.log('  - roleArn:', reloginState.roleArn);
    console.log('  - isWaitingForLogin:', reloginState.isWaitingForLogin);
    console.log('  - isMagicRelogin:', reloginState.isMagicRelogin);
    console.log('  - typeof isMagicRelogin:', typeof reloginState.isMagicRelogin);
  }

  // 优先检查 isMagicRelogin，如果没有则检查 isWaitingForLogin（兼容旧状态）
  const shouldAutoLogin = reloginState?.isMagicRelogin === true || reloginState?.isWaitingForLogin === true;

  if (!shouldAutoLogin) {
    console.log('[Enveil Content] No auto relogin needed (isMagicRelogin or isWaitingForLogin not true), skipping auto selection');
    return;
  }

  // 等待页面加载完成，然后使用倒计时模式（只标记高亮，不真正登录）
  setTimeout(() => {
    console.log('[Enveil Content] Starting countdown mode for:', {
      accountId: reloginState.accountId,
      roleArn: reloginState.roleArn
    });
    autoLoginManager.start(reloginState.accountId, reloginState.roleArn);
  }, 1500);
}

/**
 * 查找并标记上次使用的 account
 */
function findAndMarkLastUsedAccount(accountId?: string, userColor?: string): HTMLElement | null {
  if (!accountId) return null;

  console.log('[Enveil Content] Finding account:', accountId);

  // 查找所有 account 名称元素
  const accountNameElements = document.querySelectorAll('.saml-account-name');
  console.log('[Enveil Content] Found', accountNameElements.length, 'account name elements');

  for (const element of Array.from(accountNameElements)) {
    const text = element.textContent || '';
    console.log('[Enveil Content] Checking account:', text);

    if (text.includes(accountId)) {
      console.log('[Enveil Content] Account matched!');
      // 找到匹配的 account，获取其容器
      const container = element.closest('.saml-account') as HTMLElement;
      if (container) {
        // 添加特殊样式标记（使用用户配置的颜色）
        markAsLastUsedAccount(container, userColor);
        console.log('[Enveil Content] Marked account with color:', userColor);
        return container;
      }
    }
  }

  console.log('[Enveil Content] Could not find account:', accountId);
  return null;
}

/**
 * 从页面中获取已渲染的高亮颜色
 * 查找带有 enveil-cloud-role-highlight 类的元素
 */
function getRenderedHighlightColor(): string | null {
  // 查找高亮元素
  const highlightElement = document.querySelector('.enveil-cloud-role-highlight');
  console.log('[Enveil Content] Looking for highlight element:', highlightElement ? 'FOUND' : 'NOT FOUND');

  if (highlightElement) {
    const computedStyle = window.getComputedStyle(highlightElement);
    const bgColor = computedStyle.backgroundColor;
    console.log('[Enveil Content] Highlight element bg color:', bgColor);

    // 将 rgb(r, g, b) 转换为十六进制
    const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      console.log('[Enveil Content] Converted to hex:', hexColor);
      return hexColor;
    }
  }
  return null;
}

/**
 * 将十六进制颜色转换为RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * 计算颜色的亮度 (0-255)
 */
function getLuminance(r: number, g: number, b: number): number {
  // 使用相对亮度公式
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * 清理所有 Enveil 相关的 UI 元素
 */
function cleanupAllEnveilBadges(): void {
  // 移除所有倒计时 badge
  const badges = document.querySelectorAll('.enveil-countdown-badge');
  badges.forEach(badge => badge.remove());

  // 移除所有 Magic Relogin 容器
  const containers = document.querySelectorAll('.enveil-magic-relogin-container');
  containers.forEach(container => container.remove());

  // 移除所有 Last Used 标记
  const lastUsedLabels = document.querySelectorAll('.enveil-last-used-label');
  lastUsedLabels.forEach(label => label.remove());

  console.log('[Enveil Content] Cleaned up all Enveil badges and containers');
}

/**
 * 获取高对比度颜色（根据用户配置的颜色自动计算）
 * 如果用户颜色是浅色，返回深色；如果是深色，返回浅色
 */
function getContrastColor(baseColor: string): string {
  const rgb = hexToRgb(baseColor);
  if (!rgb) {
    // 如果解析失败，返回默认红色
    return '#e74c3c';
  }

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  
  // 如果亮度 > 128（浅色），返回深色；否则返回浅色
  if (luminance > 128) {
    // 返回深色选项
    const darkColors = ['#c0392b', '#8e44ad', '#2c3e50', '#d35400', '#27ae60'];
    // 根据 baseColor 的色相选择一个对比色
    const hue = Math.atan2(Math.sqrt(3) * (rgb.g - rgb.b), 2 * rgb.r - rgb.g - rgb.b);
    const index = Math.floor(((hue + Math.PI) / (2 * Math.PI)) * darkColors.length) % darkColors.length;
    return darkColors[index];
  } else {
    // 返回浅色选项
    const lightColors = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#e91e63'];
    const hue = Math.atan2(Math.sqrt(3) * (rgb.g - rgb.b), 2 * rgb.r - rgb.g - rgb.b);
    const index = Math.floor(((hue + Math.PI) / (2 * Math.PI)) * lightColors.length) % lightColors.length;
    return lightColors[index];
  }
}

/**
 * 标记 account 为上次使用
 * 不添加任何样式
 */
function markAsLastUsedAccount(_container: HTMLElement, _userColor?: string): void {
  // 不添加任何样式
}

/**
 * 查找并标记上次使用的 role
 */
function findAndMarkLastUsedRole(roleArn?: string, userColor?: string): HTMLElement | null {
  if (!roleArn) return null;

  console.log('[Enveil Content] Finding role:', roleArn);

  // 提取 role 名称（处理两种格式）
  // 格式1: arn:aws-cn:iam::066322176721:role/r-aad-apacdl-cdc-dev-app-admin
  // 格式2: r-aad-apacdl-cdc-dev-app-admin/ZTANG26@volvocars.com
  let roleName = roleArn;

  // 尝试从 ARN 格式提取
  const arnMatch = roleArn.match(/:role\/(.+)$/);
  if (arnMatch) {
    roleName = arnMatch[1];
  }

  // 移除 @ 后面的部分（如果有）
  roleName = roleName.split('/')[0];

  console.log('[Enveil Content] Extracted role name:', roleName);

  // 查找所有 radio 按钮
  const radioButtons = document.querySelectorAll('input[type="radio"][name="roleIndex"]');
  console.log('[Enveil Content] Found', radioButtons.length, 'radio buttons');

  for (const radio of Array.from(radioButtons)) {
    const value = (radio as HTMLInputElement).value;

    console.log('[Enveil Content] Checking radio value:', value);

    // 检查是否匹配（value 包含 roleName 或 roleName 包含 value 的一部分）
    const valueRoleName = value.match(/:role\/(.+)$/)?.[1] || value;

    if (value === roleArn ||
        value.includes(roleName) ||
        roleName.includes(valueRoleName) ||
        valueRoleName.includes(roleName)) {
      // 找到匹配的 role，标记它
      console.log('[Enveil Content] Found matching role:', value);

      // 尝试获取 label 容器
      const label = radio.closest('label') as HTMLElement;
      if (label) {
        console.log('[Enveil Content] Found label element');
        markAsLastUsedRole(label, userColor);
        return label;
      }

      // 如果找不到 label，尝试获取父级的 saml-role 或 saml-role-description
      const samlRole = radio.closest('.saml-role') as HTMLElement;
      if (samlRole) {
        console.log('[Enveil Content] Found saml-role element');
        markAsLastUsedRole(samlRole, userColor);
        return samlRole;
      }

      // 如果都找不到，直接标记 radio 按钮本身
      console.log('[Enveil Content] Marking radio element directly');
      markAsLastUsedRole(radio as HTMLElement, userColor);
      return radio as HTMLElement;
    }
  }

  console.log('[Enveil Content] Could not find matching role for:', roleName);
  return null;
}

/**
 * 标记 role 为上次使用
 * 不添加任何样式，只返回元素用于添加倒计时
 */
function markAsLastUsedRole(element: HTMLElement, _userColor?: string): void {
  // 不添加任何样式，只保留元素引用
  // 样式通过 Magic Relogin 容器来显示
}

/**
 * 创建倒计时 badge
 * 对于 role 类型，显示 Enveil logo + "Magic Relogin" 文字 + 倒计时
 */
function createCountdownBadge(targetElement: HTMLElement, seconds: number, type: 'account' | 'role'): void {
  // 移除已存在的 badge
  const existingBadge = targetElement.querySelector('.enveil-countdown-badge');
  if (existingBadge) {
    existingBadge.remove();
  }

  // 对于 role 类型，创建包含 logo、文字和倒计时的容器
  if (type === 'role') {
    // 检查是否已存在容器
    let container = targetElement.querySelector('.enveil-magic-relogin-container') as HTMLElement;
    if (!container) {
      container = document.createElement('span');
      container.className = 'enveil-magic-relogin-container';
      container.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-left: 8px;
        padding: 2px 8px;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
        border-radius: 12px;
        border: 1px solid rgba(102, 126, 234, 0.3);
        vertical-align: middle;
      `;

      // 添加 Enveil logo (使用扩展图标)
      const logo = document.createElement('img');
      logo.className = 'enveil-logo';
      logo.src = browser.runtime.getURL('icon/16-gray.png' as any);
      logo.width = 16;
      logo.height = 16;
      logo.style.cssText = `
        flex-shrink: 0;
        display: inline-block;
      `;
      logo.alt = 'Enveil';
      container.appendChild(logo);

      // 添加 "Magic Relogin" 文字
      const text = document.createElement('span');
      text.className = 'enveil-magic-relogin-text';
      text.textContent = 'Magic Relogin';
      text.style.cssText = `
        font-size: 11px;
        font-weight: 600;
        color: #667eea;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      `;
      container.appendChild(text);

      targetElement.appendChild(container);
    }

    // 创建倒计时数字
    const badge = document.createElement('span');
    badge.className = 'enveil-countdown-badge';
    badge.setAttribute('data-countdown-type', type);
    badge.textContent = String(seconds);
    badge.style.cssText = `
      display: inline-flex;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 11px;
      font-weight: 700;
      align-items: center;
      justify-content: center;
      animation: enveil-countdown-pulse 1s ease-in-out;
    `;

    // 添加到容器中
    container.appendChild(badge);
    return;
  }

  // Account 类型的倒计时（保持原有样式）
  const badge = document.createElement('div');
  badge.className = 'enveil-countdown-badge';
  badge.setAttribute('data-countdown-type', type);
  badge.textContent = String(seconds);
  badge.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.5);
    animation: enveil-countdown-pulse 1s ease-in-out;
    z-index: 20;
  `;

  // 添加动画样式
  if (!document.getElementById('enveil-countdown-styles')) {
    const style = document.createElement('style');
    style.id = 'enveil-countdown-styles';
    style.textContent = `
      @keyframes enveil-countdown-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
    `;
    document.head.appendChild(style);
  }

  targetElement.appendChild(badge);
}

/**
 * 更新所有倒计时 badge
 */
function updateCountdownBadges(seconds: number): void {
  const badges = document.querySelectorAll('.enveil-countdown-badge');
  badges.forEach(badge => {
    badge.textContent = String(seconds);
    // 重新触发动画
    (badge as HTMLElement).style.animation = 'none';
    setTimeout(() => {
      (badge as HTMLElement).style.animation = 'enveil-countdown-pulse 1s ease-in-out';
    }, 10);
  });
}



/**
 * 执行自动登录
 */
function executeAutoLogin(accountId?: string, roleArn?: string): void {
  console.log('[Enveil Content] === EXECUTING LOGIN ===');
  console.log('[Enveil Content] Logging in with:', { accountId, roleArn });

  // 移除倒计时 badge
  const badges = document.querySelectorAll('.enveil-countdown-badge');
  badges.forEach(badge => badge.remove());

  // 执行真正的登录
  if (roleArn) {
    selectRoleOnSamlPage(roleArn);
  } else if (accountId) {
    expandAccountOnSamlPage(accountId);
  }
}

/**
 * 在 SAML 页面上选择指定的 role
 */
function selectRoleOnSamlPage(roleArn: string): void {
  console.log('[Enveil Content] Selecting role:', roleArn);

  // 使用与 findAndMarkLastUsedRole 相同的逻辑来提取 role 名称
  let roleName = roleArn;

  // 尝试从 ARN 格式提取
  const arnMatch = roleArn.match(/:role\/(.+)$/);
  if (arnMatch) {
    roleName = arnMatch[1];
  }

  // 移除 @ 后面的部分（如果有）
  roleName = roleName.split('/')[0];

  console.log('[Enveil Content] Extracted role name for selection:', roleName);

  // 查找所有 radio 按钮
  const radioButtons = document.querySelectorAll('input[type="radio"][name="roleIndex"]');
  console.log('[Enveil Content] Found', radioButtons.length, 'role radio buttons');

  for (const radio of Array.from(radioButtons)) {
    const value = (radio as HTMLInputElement).value;

    // 提取 value 中的 role 名称
    const valueRoleName = value.match(/:role\/(.+)$/)?.[1] || value;

    // 使用与 findAndMarkLastUsedRole 相同的匹配逻辑
    if (value === roleArn ||
        value.includes(roleName) ||
        roleName.includes(valueRoleName) ||
        valueRoleName.includes(roleName)) {
      console.log('[Enveil Content] Found matching role radio button:', value);

      // 选中该 role
      (radio as HTMLInputElement).checked = true;

      // 触发 change 事件
      radio.dispatchEvent(new Event('change', { bubbles: true }));

      // 自动点击登录按钮
      setTimeout(() => {
        clickSignInButton();
      }, 500);

      return;
    }
  }

  console.log('[Enveil Content] Could not find role radio button for:', roleName);
}

/**
 * 在 SAML 页面上展开指定的 account
 */
function expandAccountOnSamlPage(accountId: string): void {
  console.log('[Enveil Content] Expanding account:', accountId);

  // 查找所有 account 名称元素
  const accountNameElements = document.querySelectorAll('.saml-account-name');
  console.log('[Enveil Content] Found', accountNameElements.length, 'account name elements');

  for (const element of Array.from(accountNameElements)) {
    const text = element.textContent || '';
    console.log('[Enveil Content] Checking account:', text);

    // 检查是否包含 account ID
    // Account 格式: "Account: {account-name} ({account-id})"
    if (text.includes(accountId)) {
      console.log('[Enveil Content] Found matching account:', text);

      // 查找父级的 expandable-container 并点击
      const expandableContainer = element.closest('.expandable-container');

      if (expandableContainer) {
        (expandableContainer as HTMLElement).click();
        console.log('[Enveil Content] Clicked expandable container for account:', accountId);
      } else {
        // 如果没有找到 expandable-container，尝试点击元素本身
        (element as HTMLElement).click();
        console.log('[Enveil Content] Clicked account name element');
      }

      return;
    }
  }

  console.log('[Enveil Content] Could not find account container for:', accountId);
}

/**
 * 点击登录按钮
 */
function clickSignInButton(): void {
  console.log('[Enveil Content] Clicking sign in button');

  // 查找登录按钮
  const signInButton = document.querySelector('#signin_button, input[type="submit"], button[type="submit"]');

  if (signInButton) {
    (signInButton as HTMLElement).click();
    console.log('[Enveil Content] Sign in button clicked');
  } else {
    console.log('[Enveil Content] Could not find sign in button');
  }
}

/**
 * 处理重新登录完成
 */
function handleReloginComplete(): void {
  console.log('[Enveil Content] Relogin complete, refreshing page');
  window.location.reload();
}

let shadowHost: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;

function mountUI(site: SiteConfig) {
  // Ensure host exists
  if (!shadowHost) {
    shadowHost = document.createElement('div');
    shadowHost.id = 'enveil-host';
    shadowHost.style.position = 'fixed'; // Ensure it doesn't affect flow
    shadowHost.style.zIndex = '2147483647'; // Max z-index
    shadowHost.style.top = '0';
    shadowHost.style.left = '0';
    shadowHost.style.width = '0';
    shadowHost.style.height = '0';
    shadowHost.style.pointerEvents = 'none'; // Passthrough
    document.documentElement.appendChild(shadowHost);
    shadowRoot = shadowHost.attachShadow({ mode: 'open' });
  }

  if (!shadowRoot) return;

  // Clear existing content
  shadowRoot.innerHTML = '';

  // Apply Banner
  if (site.flagEnable) {
    const banner = createBanner(site);
    shadowRoot.appendChild(banner);
  }

  // Apply Overlay
  if (site.backgroudEnable) {
    const overlay = createOverlay(site);
    shadowRoot.appendChild(overlay);
  }
}

function unmountUI() {
  if (shadowHost) {
    shadowHost.remove();
    shadowHost = null;
    shadowRoot = null;
  }
}

function createBanner(site: SiteConfig): HTMLElement {
  const container = document.createElement('div');
  const ribbon = document.createElement('div');

  ribbon.textContent = site.envName;

  // Container Styles (The box in the corner)
  Object.assign(container.style, {
    position: 'fixed',
    zIndex: '2147483647',
    width: '150px',
    height: '150px',
    overflow: 'hidden',
    pointerEvents: 'none',
  });

  // Ribbon Styles (The rotated strip)
  Object.assign(ribbon.style, {
    position: 'absolute',
    padding: '8px 0',
    width: '220px',
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: '900',
    color: '#fff',
    backgroundColor: site.color,
    boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    lineHeight: '1',
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  // Position Logic
  switch (site.Position) {
    case 'leftTop':
      container.style.top = '0';
      container.style.left = '0';
      ribbon.style.top = '32px';
      ribbon.style.left = '-65px';
      ribbon.style.transform = 'rotate(-45deg)';
      break;
    case 'rightTop':
      container.style.top = '0';
      container.style.right = '0';
      ribbon.style.top = '32px';
      ribbon.style.right = '-65px';
      ribbon.style.transform = 'rotate(45deg)';
      break;
    case 'leftBottom':
      container.style.bottom = '0';
      container.style.left = '0';
      ribbon.style.bottom = '32px';
      ribbon.style.left = '-65px';
      ribbon.style.transform = 'rotate(45deg)';
      break;
    case 'rightBottom':
      container.style.bottom = '0';
      container.style.right = '0';
      ribbon.style.bottom = '32px';
      ribbon.style.right = '-65px';
      ribbon.style.transform = 'rotate(-45deg)';
      break;
  }

  container.appendChild(ribbon);
  return container;
}

function createOverlay(site: SiteConfig): HTMLElement {
  const overlay = document.createElement('div');

  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    backgroundColor: site.color,
    opacity: '0.05',
    zIndex: '2147483646',
    pointerEvents: 'none'
  });

  return overlay;
}

/**
 * Mounts cloud-specific UI elements (account background highlighting and role text highlighting).
 * Works alongside existing site highlighting without conflicts.
 * Supports multiple matching accounts.
 *
 * @param cloudAccounts Array of cloud account configurations (for background highlighting)
 * @param cloudRoles Array of cloud roles (for text highlighting)
 * @param cloudHighlighter The CloudHighlighter instance
 * @param cloudEnvironment The cloud environment configuration (for console page container highlighting)
 */
function mountCloudUI(
  cloudAccounts: CloudAccount[],
  cloudRoles: CloudRole[] | null,
  cloudHighlighter: CloudHighlighter,
  cloudEnvironment: CloudEnvironment | null = null
) {
  console.log('[Enveil Content] mountCloudUI called:', {
    accountsCount: cloudAccounts.length,
    rolesCount: cloudRoles?.length || 0,
    hasEnvironment: !!cloudEnvironment,
    environmentName: cloudEnvironment?.name,
    currentUrl: window.location.href
  });

  // Remove any existing cloud highlighting first
  cloudHighlighter.removeHighlighting();

  // Apply account-level background highlighting for all matching accounts
  // Uses the first enabled account's background color for the global overlay
  cloudHighlighter.applyAccountHighlighting(cloudAccounts);

  // Apply account container highlighting for console pages
  if (cloudEnvironment && cloudAccounts.length > 0) {
    console.log('[Enveil Content] Scheduling account container highlighting');
    setTimeout(() => {
      console.log('[Enveil Content] Applying account container highlighting now');
      cloudHighlighter.applyAccountContainerHighlighting(cloudEnvironment, cloudAccounts);
    }, 100);

    // 启动 Magic Relogin 监听（用于 Console 页面的注销弹窗）
    console.log('[Enveil Content] [MOUNT_CLOUD_UI] Starting Magic Relogin watcher');
    console.log('[Enveil Content] [MOUNT_CLOUD_UI] Environment:', {
      name: cloudEnvironment.name,
      provider: cloudEnvironment.provider,
      samlUrl: cloudEnvironment.template?.samlUrl,
      enableAutoRelogin: cloudEnvironment.template?.enableAutoRelogin
    });
    magicReloginHandler.startWatching(cloudEnvironment, cloudAccounts);
  } else {
    console.log('[Enveil Content] Skipping account container highlighting:', {
      hasEnvironment: !!cloudEnvironment,
      accountsCount: cloudAccounts.length
    });
  }

  // Apply role-level text highlighting if roles are provided
  // Note: For console pages, we don't apply global role highlighting
  // Role highlighting is only applied on account selection pages
  // Console page only shows account container highlighting
}

/**
 * Unmounts cloud-specific UI elements.
 * 
 * @param cloudHighlighter The CloudHighlighter instance
 */
function unmountCloudUI(cloudHighlighter: CloudHighlighter) {
  cloudHighlighter.removeHighlighting();
}

/**
 * Mounts account selection page highlighting.
 * Supports multiple matching accounts.
 *
 * @param environment The cloud environment configuration
 * @param accounts Array of matched cloud accounts
 * @param roles Array of cloud roles
 * @param highlighter The AccountSelectionHighlighter instance
 */
function mountAccountSelectionUI(
  environment: CloudEnvironment,
  accounts: CloudAccount[],
  roles: CloudRole[] | null,
  highlighter: AccountSelectionHighlighter
) {
  // Remove existing highlighting first
  highlighter.removeHighlighting();

  // Highlight all matching accounts (not just all enabled accounts in environment)
  if (accounts.length > 0) {
    // Wait for DOM to be ready, then apply highlighting
    setTimeout(() => {
      highlighter.applyHighlighting(environment, accounts);
    }, 100);
  }
}

/**
 * Unmounts account selection page highlighting.
 * 
 * @param highlighter The AccountSelectionHighlighter instance
 */
function unmountAccountSelectionUI(highlighter: AccountSelectionHighlighter) {
  highlighter.removeHighlighting();
}
