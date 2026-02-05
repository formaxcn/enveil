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
          console.log('[Enveil Content] No cloud match, unmounting cloud UI');
          unmountCloudUI(cloudHighlighter);
          unmountAccountSelectionUI(accountSelectionHighlighter);

          // 停止 Magic Relogin 监听
          console.log('[Enveil Content] Stopping Magic Relogin watcher');
          magicReloginHandler.stopWatching();
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

/**
 * 处理自动角色选择（在 SAML 登录页面）
 */
async function handleAutoRoleSelection(
  environment: CloudEnvironment,
  accounts: CloudAccount[]
): Promise<void> {
  const reloginState = await magicReloginHandler.loadReloginState();

  if (!reloginState?.isWaitingForLogin) {
    console.log('[Enveil Content] No relogin state or not waiting for login, skipping auto selection');
    return;
  }

  console.log('[Enveil Content] Auto role selection enabled:', {
    roleArn: reloginState.roleArn,
    accountId: reloginState.accountId
  });

  // 等待页面加载完成
  setTimeout(() => {
    if (reloginState.roleArn) {
      // 尝试查找并选择对应的 role
      selectRoleOnSamlPage(reloginState.roleArn);
    } else if (reloginState.accountId) {
      // 如果没有 role ARN，尝试展开对应的 account
      expandAccountOnSamlPage(reloginState.accountId);
    } else {
      console.log('[Enveil Content] No roleArn or accountId in relogin state');
    }
  }, 1500);
}

/**
 * 在 SAML 页面上选择指定的 role
 */
function selectRoleOnSamlPage(roleArn: string): void {
  console.log('[Enveil Content] Selecting role:', roleArn);

  // 从 roleArn 中提取 account ID (12位数字)
  const accountIdMatch = roleArn.match(/arn:aws-cn:iam::(\d{12}):role\//);
  const accountId = accountIdMatch ? accountIdMatch[1] : null;
  console.log('[Enveil Content] Extracted account ID from roleArn:', accountId);

  // 首先尝试展开对应的 account
  if (accountId) {
    expandAccountOnSamlPage(accountId);
  }

  // 查找所有 radio 按钮
  const radioButtons = document.querySelectorAll('input[type="radio"][name="roleIndex"]');
  console.log('[Enveil Content] Found', radioButtons.length, 'role radio buttons');

  for (const radio of Array.from(radioButtons)) {
    const value = (radio as HTMLInputElement).value;

    // 完全匹配或部分匹配
    if (value === roleArn) {
      console.log('[Enveil Content] Found exact matching role radio button:', value);

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

  // 如果没有完全匹配，尝试部分匹配
  for (const radio of Array.from(radioButtons)) {
    const value = (radio as HTMLInputElement).value;

    // 提取 role 名称进行比较
    const roleNameMatch = roleArn.match(/:role\/(.+)$/);
    const roleName = roleNameMatch ? roleNameMatch[1] : roleArn;

    if (value.includes(roleName) || roleArn.includes(value)) {
      console.log('[Enveil Content] Found partial matching role radio button:', value);

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

  console.log('[Enveil Content] Could not find role radio button for:', roleArn);
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
