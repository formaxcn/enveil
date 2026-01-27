import { AppConfig, CloudSyncData, ConflictResolutionStrategy } from '../types';

// 声明chrome对象
declare const chrome: any;

export class BrowserSyncManager {
  private appConfig: AppConfig;
  private notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  private updateConfigCallback: (newConfig: AppConfig) => void;
  private syncInProgress: boolean = false;
  private readonly SYNC_KEY = 'enveil_cloud_sync_data';
  private readonly SYNC_VERSION = '1.0.0';

  constructor(
    appConfig: AppConfig,
    notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void,
    updateConfigCallback: (newConfig: AppConfig) => void
  ) {
    this.appConfig = appConfig;
    this.notificationCallback = notificationCallback;
    this.updateConfigCallback = updateConfigCallback;
  }

  // 更新配置引用
  public updateConfig(config: AppConfig): void {
    this.appConfig = config;
  }

  // 初始化同步功能
  public async initSync(): Promise<void> {
    if (!this.appConfig.browserSync) {
      return;
    }

    try {
      // 监听存储变化
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener((changes: any, areaName: string) => {
          if (areaName === 'sync' && changes[this.SYNC_KEY] && !this.syncInProgress) {
            this.handleRemoteConfigChange(changes[this.SYNC_KEY].newValue);
          }
        });
      }

      // 执行初始同步
      await this.performSync();
    } catch (error) {
      console.error('Failed to initialize browser sync:', error);
      this.notificationCallback('Failed to initialize browser sync', 'error');
    }
  }

  // 执行同步
  public async performSync(): Promise<void> {
    if (!this.appConfig.browserSync || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;

    try {
      // 获取云端数据
      const cloudData = await this.getCloudData();
      const localData = this.createSyncData();

      if (!cloudData) {
        // 云端没有数据，上传本地数据
        await this.uploadToCloud(localData);
        this.notificationCallback('Configuration synced to cloud', 'success');
      } else {
        // 检查冲突并解决
        const resolution = await this.resolveConflicts(localData, cloudData);
        await this.applyResolution(resolution, localData, cloudData);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      this.notificationCallback('Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      this.syncInProgress = false;
    }
  }

  // 创建同步数据
  private createSyncData(): CloudSyncData {
    return {
      configs: this.appConfig.settings,
      defaultColors: this.appConfig.defaultColors,
      cloudEnvironments: this.appConfig.cloudEnvironments || [], // Include cloud configurations
      lastModified: Date.now(),
      version: this.SYNC_VERSION
    };
  }

  // 获取云端数据
  private async getCloudData(): Promise<CloudSyncData | null> {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
        resolve(null);
        return;
      }

      chrome.storage.sync.get([this.SYNC_KEY], (result: any) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to get cloud data:', chrome.runtime.lastError);
          resolve(null);
        } else {
          resolve(result[this.SYNC_KEY] || null);
        }
      });
    });
  }

  // 上传到云端
  private async uploadToCloud(data: CloudSyncData): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
        reject(new Error('Chrome storage sync not available'));
        return;
      }

      chrome.storage.sync.set({ [this.SYNC_KEY]: data }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  // 解决冲突
  private async resolveConflicts(localData: CloudSyncData, cloudData: CloudSyncData): Promise<ConflictResolutionStrategy> {
    // 检查版本兼容性
    if (cloudData.version !== this.SYNC_VERSION) {
      this.notificationCallback('Cloud data version mismatch. Using local data.', 'warning');
      return 'local';
    }

    // 检查时间戳
    const timeDiff = Math.abs(localData.lastModified - cloudData.lastModified);
    const threshold = 5 * 60 * 1000; // 5分钟

    if (timeDiff < threshold) {
      // 时间差很小，可能是同一次修改，使用云端数据
      return 'remote';
    }

    // 检查内容差异
    const hasConfigDiff = JSON.stringify(localData.configs) !== JSON.stringify(cloudData.configs);
    const hasColorDiff = JSON.stringify(localData.defaultColors) !== JSON.stringify(cloudData.defaultColors);
    const hasCloudEnvDiff = JSON.stringify(localData.cloudEnvironments || []) !== JSON.stringify(cloudData.cloudEnvironments || []);

    if (!hasConfigDiff && !hasColorDiff && !hasCloudEnvDiff) {
      // 没有实际差异
      return 'remote';
    }

    // 有冲突，询问用户
    return this.askUserForResolution(localData, cloudData);
  }

  // 询问用户解决冲突
  private async askUserForResolution(localData: CloudSyncData, cloudData: CloudSyncData): Promise<ConflictResolutionStrategy> {
    const localTime = new Date(localData.lastModified).toLocaleString();
    const cloudTime = new Date(cloudData.lastModified).toLocaleString();

    const localCloudEnvCount = localData.cloudEnvironments?.length || 0;
    const cloudCloudEnvCount = cloudData.cloudEnvironments?.length || 0;

    const message = `Sync conflict detected!\n\n` +
      `Local data: ${localData.configs.length} groups, ${localCloudEnvCount} cloud environments, modified ${localTime}\n` +
      `Cloud data: ${cloudData.configs.length} groups, ${cloudCloudEnvCount} cloud environments, modified ${cloudTime}\n\n` +
      `Choose resolution:\n` +
      `OK = Use cloud data\n` +
      `Cancel = Use local data`;

    const useCloud = confirm(message);
    return useCloud ? 'remote' : 'local';
  }

  // 应用解决方案
  private async applyResolution(
    strategy: ConflictResolutionStrategy,
    localData: CloudSyncData,
    cloudData: CloudSyncData
  ): Promise<void> {
    switch (strategy) {
      case 'local':
        // 使用本地数据，上传到云端
        await this.uploadToCloud(localData);
        this.notificationCallback('Local configuration synced to cloud', 'success');
        break;

      case 'remote':
        // 使用云端数据，更新本地
        this.applyCloudData(cloudData);
        this.notificationCallback('Configuration updated from cloud', 'success');
        break;

      case 'merge':
        // 合并数据（暂时不实现，使用本地数据）
        await this.uploadToCloud(localData);
        this.notificationCallback('Configurations merged and synced', 'success');
        break;

      default:
        throw new Error('Unknown resolution strategy');
    }
  }

  // 应用云端数据
  private applyCloudData(cloudData: CloudSyncData): void {
    const newConfig: AppConfig = {
      ...this.appConfig,
      settings: cloudData.configs,
      defaultColors: cloudData.defaultColors,
      cloudEnvironments: cloudData.cloudEnvironments || [] // Apply cloud environments from sync data
    };

    this.updateConfigCallback(newConfig);
  }

  // 处理远程配置变化
  private async handleRemoteConfigChange(newCloudData: CloudSyncData): Promise<void> {
    if (!newCloudData || !this.appConfig.browserSync) {
      return;
    }

    try {
      // 检查是否需要更新本地配置
      const localData = this.createSyncData();
      
      // 如果云端数据更新，应用到本地
      if (newCloudData.lastModified > localData.lastModified) {
        this.applyCloudData(newCloudData);
        this.notificationCallback('Configuration updated from another device', 'info');
      }
    } catch (error) {
      console.error('Failed to handle remote config change:', error);
    }
  }

  // 启用同步
  public async enableSync(): Promise<void> {
    try {
      this.appConfig.browserSync = true;
      await this.initSync();
      this.notificationCallback('Browser sync enabled and initialized', 'success');
    } catch (error) {
      this.notificationCallback('Failed to enable sync: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  }

  // 禁用同步
  public async disableSync(): Promise<void> {
    try {
      this.appConfig.browserSync = false;
      
      // 可选：清除云端数据
      const clearCloud = confirm('Do you want to clear cloud data as well?');
      if (clearCloud) {
        await this.clearCloudData();
        this.notificationCallback('Browser sync disabled and cloud data cleared', 'success');
      } else {
        this.notificationCallback('Browser sync disabled', 'info');
      }
    } catch (error) {
      this.notificationCallback('Failed to disable sync: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  }

  // 清除云端数据
  private async clearCloudData(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
        resolve();
        return;
      }

      chrome.storage.sync.remove([this.SYNC_KEY], () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  // 强制同步
  public async forceSync(): Promise<void> {
    if (!this.appConfig.browserSync) {
      this.notificationCallback('Browser sync is disabled', 'warning');
      return;
    }

    const localData = this.createSyncData();
    await this.uploadToCloud(localData);
    this.notificationCallback('Configuration force synced to cloud', 'success');
  }

  // 获取同步状态
  public getSyncStatus(): { enabled: boolean; inProgress: boolean } {
    return {
      enabled: this.appConfig.browserSync,
      inProgress: this.syncInProgress
    };
  }
}