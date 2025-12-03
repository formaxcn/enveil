// 声明chrome对象
declare const chrome: any;

// 定义存储类型枚举
export enum StorageType {
  Local = 'local',
  Sync = 'sync'
}

// 存储管理器类
export class StorageManager {
  private static instance: StorageManager;
  private storageType: StorageType = StorageType.Local;

  private constructor() { }

  // 获取单例实例
  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // 设置存储类型
  public setStorageType(type: StorageType): void {
    this.storageType = type;
  }

  // 获取当前存储API
  private getStorageApi(type?: StorageType) {
    const targetType = type || this.storageType;
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return targetType === StorageType.Sync ? chrome.storage.sync : chrome.storage.local;
    }
    throw new Error('Chrome storage API is not available');
  }

  // 保存数据
  public async set<T>(key: string, value: T, type?: StorageType): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const storageApi = this.getStorageApi(type);
        storageApi.set({ [key]: value }, () => {
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  // 获取数据
  public async get<T>(key: string, defaultValue?: T, type?: StorageType): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      try {
        const storageApi = this.getStorageApi(type);
        storageApi.get([key], (result: { [key: string]: any }) => {
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            const value = result[key];
            resolve(value !== undefined ? value : defaultValue);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  // 获取多个键的数据
  public async getAll(keys: string[], type?: StorageType): Promise<{ [key: string]: any }> {
    return new Promise((resolve, reject) => {
      try {
        const storageApi = this.getStorageApi(type);
        storageApi.get(keys, (result: { [key: string]: any }) => {
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  // 删除指定键的数据
  public async remove(key: string, type?: StorageType): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const storageApi = this.getStorageApi(type);
        storageApi.remove(key, () => {
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  // 清空所有数据
  public async clear(type?: StorageType): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const storageApi = this.getStorageApi(type);
        storageApi.clear(() => {
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  // 监听存储变化
  public onChange(callback: (changes: { [key: string]: any }, areaName: string) => void): void {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener(callback);
    }
  }

  // 移除监听器
  public removeListener(callback: (changes: { [key: string]: any }, areaName: string) => void): void {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.removeListener(callback);
    }
  }
}