import { AppConfig } from '../types';
import { ConfigImportExportManager } from './ConfigImportExportManager';
import { SiteEditorManager } from './SiteEditorManager';
import { SwitchComponent } from '../../../components/SwitchComponent';

// 声明chrome对象
declare const chrome: any;

export class AppController {
  private appConfig: AppConfig;
  private selectedGroups: number[];
  private configImportExportManager: ConfigImportExportManager;
  private siteEditorManager: SiteEditorManager;
  private notificationTimeout: number | null = null;

  constructor() {
    // 初始化默认配置
    this.appConfig = this.getDefaultConfig();
    this.selectedGroups = [];

    // 初始化各个管理器
    this.configImportExportManager = new ConfigImportExportManager(
      this.appConfig,
      this.selectedGroups,
      this.showNotification.bind(this),
      this.saveConfig.bind(this),
      this.updateConfig.bind(this)
    );

    this.siteEditorManager = new SiteEditorManager(
      this.appConfig,
      this.selectedGroups,
      this.showNotification.bind(this),
      this.saveConfig.bind(this)
    );
  }

  // 获取默认配置
  private getDefaultConfig(): AppConfig {
    return {
      browserSync: false,
      settings: [
        {
          name: 'default',
          enable: true,
          sites: []
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
    this.configImportExportManager.updateSelectedGroups(this.selectedGroups);
    this.siteEditorManager.updateConfig(this.appConfig);
    this.siteEditorManager.updateSelectedGroups(this.selectedGroups);
  }

  // 初始化UI
  private initUI(): void {
    // 初始化配置导入导出相关UI
    this.configImportExportManager.initImportExportUI();

    // 初始化网站编辑相关UI
    this.siteEditorManager.initSiteEditorUI();

    // 初始化浏览器同步开关
    this.initBrowserSyncToggle();
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
          this.showNotification('Browser sync enabled. Configurations will be synced across browsers.', 'success');
        } else {
          this.showNotification('Browser sync disabled.', 'info');
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
        this.selectedGroups = [0];
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
          settings: config.settings || this.getDefaultConfig().settings
        };
      }

      // 默认选中第一个配置组
      if (this.appConfig.settings.length > 0) {
        this.selectedGroups = [0];
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      this.showNotification('Failed to load configuration', 'error');
      // 使用默认配置
      this.appConfig = this.getDefaultConfig();
      this.selectedGroups = [0];
    }
  }

  // 保存配置
  public saveConfig(): void {
    try {
      chrome.storage.sync.set({ appConfig: this.appConfig }, () => {
        this.showNotification('Configuration saved successfully', 'success');
        // 更新所有管理器的配置引用
        this.updateAllManagersConfig();
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

  // 获取当前配置（用于调试或导出）
  public getConfig(): AppConfig {
    return { ...this.appConfig };
  }

  // 获取选中的配置组索引
  public getSelectedGroups(): number[] {
    return [...this.selectedGroups];
  }

  // 手动更新选中的配置组
  public updateSelectedGroups(groups: number[]): void {
    this.selectedGroups = groups;
    this.siteEditorManager.updateSelectedGroups(groups);
    this.configImportExportManager.updateSelectedGroups(groups);
  }

  // 打开添加网站模态框并预填域名
  public openAddSiteModalWithDomain(domain: string, pattern: string): void {
    this.siteEditorManager.openAddSiteModalWithDomain(domain, pattern);
  }
}