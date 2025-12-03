import { AppConfig } from '../types';
import { GitSyncManager } from './GitSyncManager';
import { ConfigImportExportManager } from './ConfigImportExportManager';
import { SiteEditorManager } from './SiteEditorManager';
import { StorageManager, StorageType } from '../../../components/StorageManager';

export class AppController {
  private appConfig: AppConfig = {
    browserSync: { enable: false },
    settings: []
  };
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
      // 加载配置
      await this.loadConfig();
      
      // 初始化UI
      this.initUI();
      
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
        // 更新存储管理器的存储类型
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
      // 根据浏览器同步开关状态设置存储类型
      const syncEnabled = this.appConfig.browserSync?.enable ?? false;
      this.storageManager.setStorageType(
        syncEnabled ? StorageType.Sync : StorageType.Local
      );
      
      const config = await this.storageManager.get<AppConfig>('appConfig');
      if (config) {
        this.appConfig = { ...this.appConfig, ...config };
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      this.showNotification('Failed to load configuration', 'error');
    }
  }

  // 保存配置
  private async saveConfig(): Promise<void> {
    try {
      await this.storageManager.set('appConfig', this.appConfig);
      
      // 更新各个管理器中的配置引用
      this.gitSyncManager.updateConfig(this.appConfig);
      this.configImportExportManager.updateConfig(this.appConfig);
      this.siteEditorManager.updateConfig(this.appConfig);
    } catch (error) {
      console.error('Failed to save config:', error);
      this.showNotification('Failed to save configuration', 'error');
    }
  }

  // 显示通知
  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
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