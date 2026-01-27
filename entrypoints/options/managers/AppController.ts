import { AppConfig } from '../types';
import { ConfigImportExportManager } from './ConfigImportExportManager';
import { SiteEditorManager } from './SiteEditorManager';
import { BrowserSyncManager } from './BrowserSyncManager';
import { SwitchComponent } from '../../../components/SwitchComponent';

// 声明chrome对象
declare const chrome: any;

export class AppController {
  private appConfig: AppConfig;
  private configImportExportManager: ConfigImportExportManager;
  private siteEditorManager: SiteEditorManager;
  private browserSyncManager: BrowserSyncManager;
  private notificationTimeout: number | null = null;
  private static readonly DISTINCT_COLORS = [
    '#4a9eff', '#4CAF50', '#ff9800', '#f44336', '#9c27b0',
    '#00bcd4', '#ffeb3b', '#795548', '#607d8b', '#e91e63'
  ];

  constructor() {
    // 初始化默认配置
    this.appConfig = this.getDefaultConfig();

    // 初始化各个管理器
    this.configImportExportManager = new ConfigImportExportManager(
      this.appConfig,
      this.showNotification.bind(this),
      this.saveConfig.bind(this),
      this.updateConfig.bind(this)
    );

    this.siteEditorManager = new SiteEditorManager(
      this.appConfig,
      this.showNotification.bind(this),
      this.saveConfig.bind(this)
    );

    this.browserSyncManager = new BrowserSyncManager(
      this.appConfig,
      this.showNotification.bind(this),
      this.updateConfig.bind(this)
    );
  }

  // 获取默认配置
  private getDefaultConfig(): AppConfig {
    return {
      browserSync: false,
      defaultColors: ['#4a9eff', '#4CAF50', '#ff9800', '#f44336', '#9c27b0'],
      settings: [
        {
          name: 'default',
          enable: true,
          sites: [],
          defaults: {
            envName: 'dev',
            backgroundEnable: false,
            flagEnable: false,
            color: '#4a9eff'
          }
        }
      ]
    };
  }

  // 初始化应用
  public async init(): Promise<void> {
    // 加载配置
    await this.loadConfig();

    // 更新各个管理器的配置引用
    this.updateAllManagersConfig();

    // 初始化各个模块的UI
    this.initUI();
  }

  // 更新所有管理器的配置引用
  private updateAllManagersConfig(): void {
    this.configImportExportManager.updateConfig(this.appConfig);
    this.siteEditorManager.updateConfig(this.appConfig);
    this.browserSyncManager.updateConfig(this.appConfig);
  }

  // 初始化UI
  private initUI(): void {
    // 初始化配置导入导出相关UI
    this.configImportExportManager.initImportExportUI();

    // 初始化网站编辑相关UI
    this.siteEditorManager.initSiteEditorUI();

    // 初始化浏览器同步开关
    this.initBrowserSyncToggle();

    // 初始化默认颜色设置
    this.initDefaultColorsUI();

    // 初始化浏览器同步
    this.browserSyncManager.initSync();
  }

  // 初始化浏览器同步开关
  private initBrowserSyncToggle(): void {
    const syncContainer = document.getElementById('browser-sync-option');
    if (syncContainer) {
      const syncSwitch = new SwitchComponent(
        syncContainer,
        'Browser Sync',
        'browser-sync-toggle',
        'sync',
        this.appConfig.browserSync,
        false
      );

      syncSwitch.onChange((isChecked) => {
        this.appConfig.browserSync = isChecked;
        this.saveConfig();

        if (isChecked) {
          this.browserSyncManager.enableSync();
        } else {
          this.browserSyncManager.disableSync();
        }
      });

      // Remove old checkbox item if it exists
      const oldItem = document.querySelector('.setting-item:has(#browser-sync-checkbox)');
      if (oldItem) oldItem.remove();
    }
  }

  // 加载配置
  private async loadConfig(): Promise<void> {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
        console.warn('Chrome storage sync API not available, using default config');
        this.appConfig = this.getDefaultConfig();
        return;
      }

      const config = await new Promise<AppConfig | null>((resolve) => {
        chrome.storage.sync.get(['appConfig'], (result: { appConfig: AppConfig | null }) => {
          resolve(result.appConfig);
        });
      });

      if (config) {
        // 合并配置，确保所有必需字段都存在
        this.appConfig = {
          browserSync: typeof config.browserSync === 'boolean' ? config.browserSync : false,
          defaultColors: config.defaultColors || this.getDefaultConfig().defaultColors,
          settings: config.settings ? config.settings.map(setting => ({
            ...setting,
            defaults: setting.defaults || {
              envName: 'dev',
              backgroundEnable: false,
              flagEnable: false,
              color: '#4a9eff'
            }
          })) : this.getDefaultConfig().settings
        };
      }

      // 不需要selectedGroups概念
    } catch (error) {
      console.error('Failed to load config:', error);
      this.showNotification('Failed to load configuration', 'error');
      // 使用默认配置
      this.appConfig = this.getDefaultConfig();
    }
  }

  // 保存配置
  public saveConfig(): void {
    try {
      chrome.storage.sync.set({ appConfig: this.appConfig }, () => {
        this.showNotification('Configuration saved successfully', 'success');
        // 更新所有管理器的配置引用
        this.updateAllManagersConfig();
        
        // 如果启用了同步，执行同步
        if (this.appConfig.browserSync) {
          this.browserSyncManager.performSync();
        }
      });
    } catch (error) {
      console.error('Failed to save config:', error);
      this.showNotification('Failed to save configuration', 'error');
    }
  }

  // 更新配置（用于导入等操作）
  public updateConfig(newConfig: AppConfig): void {
    this.appConfig = newConfig;
    // 保存更新后的配置
    this.saveConfig();
    
    // 重新渲染UI
    this.renderDefaultColors();
    this.siteEditorManager.updateConfigDisplay();
  }

  // 显示通知
  public showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    const notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) return;

    // 清除之前的通知
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // 添加到容器
    notificationContainer.appendChild(notification);

    // 显示通知
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // 自动关闭通知
    this.notificationTimeout = window.setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notificationContainer.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // 初始化默认颜色设置UI
  private initDefaultColorsUI(): void {
    const container = document.getElementById('default-colors-container');
    if (!container) return;

    this.renderDefaultColors();
  }

  // 渲染默认颜色
  private renderDefaultColors(): void {
    const container = document.getElementById('default-colors-container');
    if (!container) return;

    container.innerHTML = '';

    this.appConfig.defaultColors.forEach((color, index) => {
      const colorGroup = document.createElement('div');
      colorGroup.className = 'color-input-group';

      // Native Picker
      const picker = document.createElement('input');
      picker.type = 'color';
      picker.value = color;
      picker.className = 'unified-color-picker';

      picker.addEventListener('change', (e) => {
        const newVal = (e.target as HTMLInputElement).value;
        this.appConfig.defaultColors[index] = newVal.toUpperCase();
        this.saveConfig();
      });

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-color-btn';
      removeBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      removeBtn.title = 'Remove color';
      removeBtn.addEventListener('click', () => this.removeDefaultColor(index));

      colorGroup.appendChild(picker);
      colorGroup.appendChild(removeBtn);
      container.appendChild(colorGroup);
    });
    // Always show add button - no limit on colors
    const addBtn = document.createElement('button');
    addBtn.className = 'add-color-btn';
    addBtn.innerHTML = '<i class="fas fa-plus"></i>';
    addBtn.addEventListener('click', () => this.addDefaultColor());
    container.appendChild(addBtn);
  }

  // 添加默认颜色
  private addDefaultColor(): void {
    // Remove the 5 color limit - allow unlimited colors

    // Find a color from the distinct palette that is not currently used
    const existingColors = new Set(this.appConfig.defaultColors.map(c => c.toLowerCase()));
    const nextColor = AppController.DISTINCT_COLORS.find(c => !existingColors.has(c.toLowerCase()))
      || `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

    this.appConfig.defaultColors.push(nextColor.toUpperCase());
    this.saveConfig();
    this.renderDefaultColors();
  }

  // 移除默认颜色
  private removeDefaultColor(index: number): void {
    this.appConfig.defaultColors.splice(index, 1);
    this.saveConfig();
    this.renderDefaultColors();
  }

  // 获取当前配置（用于调试或导出）
  public getConfig(): AppConfig {
    return { ...this.appConfig };
  }

  // 打开添加网站模态框并预填域名
  public openAddSiteModalWithDomain(domain: string, pattern: string): void {
    this.siteEditorManager.openAddSiteModalWithDomain(domain, pattern);
  }
}