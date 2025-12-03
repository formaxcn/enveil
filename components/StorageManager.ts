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

  private constructor() {}

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
  private getStorageApi() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return this.storageType === StorageType.Sync ? chrome.storage.sync : chrome.storage.local;
    }
    // 如果在非浏览器环境中提供模拟实现
    return {
      get: (keys: string | string[] | object | null, callback?: (items: { [key: string]: any }) => void) => {
        if (callback) callback({});
      },
      set: (items: { [key: string]: any }, callback?: () => void) => {
        if (callback) callback();
      },
      remove: (keys: string | string[], callback?: () => void) => {
        if (callback) callback();
      },
      clear: (callback?: () => void) => {
        if (callback) callback();
      }
    };
  }

  // 保存数据
  public async set<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const storageApi = this.getStorageApi();
      storageApi.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  // 获取数据
  public async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      const storageApi = this.getStorageApi();
      storageApi.get([key], (result: { [key: string]: any }) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          const value = result[key];
          resolve(value !== undefined ? value : defaultValue);
        }
      });
    });
  }

  // 获取多个键的数据
  public async getAll(keys: string[]): Promise<{ [key: string]: any }> {
    return new Promise((resolve, reject) => {
      const storageApi = this.getStorageApi();
      storageApi.get(keys, (result: { [key: string]: any }) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  // 删除指定键的数据
  public async remove(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const storageApi = this.getStorageApi();
      storageApi.remove(key, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  // 清空所有数据
  public async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      const storageApi = this.getStorageApi();
      storageApi.clear(() => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
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