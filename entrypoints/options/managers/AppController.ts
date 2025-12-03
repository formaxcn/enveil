import { AppConfig } from '../types';
import { GitSyncManager } from './GitSyncManager';
import { ConfigImportExportManager } from './ConfigImportExportManager';
import { SiteEditorManager } from './SiteEditorManager';
import { StorageManager, StorageType } from '../../../components/StorageManager';

export class AppController {
  private appConfig: AppConfig = {
    browserSync: { enable: false },
    settings: [{
      name: 'default',
      enable: true,
      sites: []
    }]
  };
  private syncStrategy: 'local' | 'sync' = 'local';
  private selectedGroups: number[] = [];
  private storageManager: StorageManager;

  private gitSyncManager!: GitSyncManager;
  private configImportExportManager!: ConfigImportExportManager;
  private siteEditorManager!: SiteEditorManager;
  private notificationContainer!: HTMLDivElement;

  constructor() {
    this.storageManager = StorageManager.getInstance();
    this.init();
  }

  // 初始化应用
  private async init(): Promise<void> {
    try {
      // 先初始化UI，确保notificationContainer可用
      this.initUI();
      
      // 加载配置
      await this.loadConfig();

      // 初始化各个功能管理器
      this.gitSyncManager = new GitSyncManager(this.appConfig, (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
        this.showNotification(message, type);
      });

      this.configImportExportManager = new ConfigImportExportManager(
        this.appConfig,
        this.selectedGroups,
        (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
          this.showNotification(message, type);
        },
        () => {
          this.saveConfig();
        },
        (newConfig: AppConfig) => {
          this.appConfig = newConfig;
        }
      );

      this.siteEditorManager = new SiteEditorManager(
        this.appConfig,
        this.selectedGroups,
        (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
          this.showNotification(message, type);
        },
        () => {
          this.saveConfig();
        }
      );

      // 初始化网站编辑相关UI
      this.siteEditorManager.initSiteEditorUI();

      // 初始化浏览器同步开关
      this.initBrowserSyncToggle();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showNotification('Failed to initialize application', 'error');
    }
  }

  // 初始化浏览器同步开关
  private initBrowserSyncToggle(): void {
    const container = document.getElementById('browser-sync-option');
    if (container) {
      // Clear existing content
      container.innerHTML = '';

      const toggleContainer = document.createElement('div');
      toggleContainer.id = 'browser-sync-toggle-container';
      container.appendChild(toggleContainer);

      // 监听浏览器同步开关变化
      const handleSyncToggleChange = (isChecked: boolean) => {
        this.appConfig.browserSync.enable = isChecked;
        // 更新 syncStrategy 和存储管理器的存储类型
        this.syncStrategy = isChecked ? 'sync' : 'local';
        this.storageManager.setStorageType(
          isChecked ? StorageType.Sync : StorageType.Local
        );
        this.saveConfig();
      };

      // 创建开关组件
      const switchComponent = document.createElement('div');
      toggleContainer.appendChild(switchComponent);

      // 使用动态导入避免循环依赖
      import('../../../components/SwitchComponent').then(({ SwitchComponent }) => {
        const browserSyncSwitch = new SwitchComponent(
          switchComponent,
          'Enable Browser Sync',
          'browser-sync-enable',
          'sync',
          this.appConfig.browserSync.enable,
          true
        );

        browserSyncSwitch.onChange(handleSyncToggleChange);
      });
    }
  }

  // 初始化UI
  private initUI(): void {
    // 创建通知容器
    this.notificationContainer = document.createElement('div');
    this.notificationContainer.id = 'notification-container';
    document.body.appendChild(this.notificationContainer);
  }

  // 加载配置
  private async loadConfig(): Promise<void> {
    try {
      // 1. 首先从 Local 存储获取 syncStrategy
      const savedSyncStrategy = await this.storageManager.get<'local' | 'sync'>('syncStrategy', 'local', StorageType.Local);
      this.syncStrategy = savedSyncStrategy;
      
      // 2. 根据 syncStrategy 设置存储类型
      this.storageManager.setStorageType(
        this.syncStrategy === 'sync' ? StorageType.Sync : StorageType.Local
      );

      // 3. 加载 browserSync 配置（始终从 Local 获取）
      const browserSync = await this.storageManager.get<AppConfig['browserSync']>('browserSync', undefined, StorageType.Local);
      if (browserSync) {
        this.appConfig.browserSync = browserSync;
      }

      // 4. 从当前存储类型加载 configGroups
      const configGroups = await this.storageManager.get<AppConfig['settings']>('configGroups');

      if (configGroups && Array.isArray(configGroups)) {
        this.appConfig.settings = configGroups;
      } else {
        // 5. 如果当前存储类型没有数据，尝试从另一个存储类型加载
        const otherStorageType = this.syncStrategy === 'sync' ? StorageType.Local : StorageType.Sync;
        const otherConfigGroups = await this.storageManager.get<AppConfig['settings']>('configGroups', undefined, otherStorageType);
        
        if (otherConfigGroups && Array.isArray(otherConfigGroups)) {
          this.appConfig.settings = otherConfigGroups;
          // 如果从另一个存储类型加载了数据，保存到当前存储类型
          await this.saveConfig();
        } else {
          // 迁移逻辑：尝试从旧的结构加载
          const oldConfigGroups = await this.storageManager.get<string[]>('configGroups');
          if (oldConfigGroups && oldConfigGroups.length > 0 && typeof oldConfigGroups[0] === 'string') {
            const settings: AppConfig['settings'] = [];
            for (const groupName of oldConfigGroups) {
              const groupDetails = await this.storageManager.get<AppConfig['settings'][0]['sites']>(`configDetail-${groupName}`);
              const groupSetting = await this.storageManager.get<{ name: string, enable: boolean }>(`configSetting-${groupName}`);

              if (groupDetails && groupSetting) {
                settings.push({
                  name: groupSetting.name,
                  enable: groupSetting.enable,
                  sites: groupDetails
                });
              }
            }
            if (settings.length > 0) {
              this.appConfig.settings = settings;
              // 立即保存为新格式
              await this.saveConfig();
            }
          } else {
            // 最后尝试回退到 appConfig 整体对象
            const config = await this.storageManager.get<AppConfig>('appConfig');
            if (config) {
              this.appConfig = { ...this.appConfig, ...config };
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      this.showNotification('Failed to load configuration', 'error');
    }
  }

  // 保存配置
  private async saveConfig(): Promise<void> {
    try {
      // 1. 保存 syncStrategy 到 Local 存储
      await this.storageManager.set('syncStrategy', this.syncStrategy, StorageType.Local);
      
      // 2. 保存 configGroups 到当前存储类型
      await this.storageManager.set('configGroups', this.appConfig.settings);

      // 3. 保存浏览器同步配置 - 始终保存到 Local
      await this.storageManager.set('browserSync', this.appConfig.browserSync, StorageType.Local);

      // 更新各个管理器中的配置引用
      this.gitSyncManager.updateConfig(this.appConfig);
      this.configImportExportManager.updateConfig(this.appConfig);
      this.siteEditorManager.updateConfig(this.appConfig);
      
      console.log('Config saved successfully to', this.syncStrategy, 'storage');
    } catch (error) {
      console.error('Failed to save config:', error);
      this.showNotification('Failed to save configuration', 'error');
    }
  }

  // 显示通知
  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    // 确保notificationContainer已定义
    if (!this.notificationContainer) {
      // 如果容器不存在，创建一个临时容器
      this.notificationContainer = document.createElement('div');
      this.notificationContainer.id = 'notification-container';
      document.body.appendChild(this.notificationContainer);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // 添加一些基本样式
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '4px',
      color: 'white',
      fontWeight: 'bold',
      zIndex: '10000',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      transform: 'translateX(0)',
      transition: 'transform 0.3s ease-in-out',
      backgroundColor: type === 'success' ? '#4CAF50' :
        type === 'error' ? '#f44336' :
          type === 'warning' ? '#ff9800' : '#2196F3'
    });

    this.notificationContainer.appendChild(notification);

    // 3秒后自动移除通知
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode === this.notificationContainer) {
          this.notificationContainer.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}