class StorageManager {
  constructor() {
    this.useSync = true; // 默认使用同步存储
  }

  // 设置存储类型
  setStorageSync(useSync) {
    this.useSync = useSync;
  }

  // 获取存储实例
  getStorage() {
    return this.useSync ? chrome.storage.sync : chrome.storage.local;
  }

  // 保存数据
  set(data, callback) {
    this.getStorage().set(data, callback);
  }

  // 获取数据
  get(keys, callback) {
    this.getStorage().get(keys, callback);
  }

  // 删除数据
  remove(keys, callback) {
    this.getStorage().remove(keys, callback);
  }

  // 清空数据
  clear(callback) {
    this.getStorage().clear(callback);
  }
}

// 创建全局实例
const storageManager = new StorageManager();

// 导出实例
window.storageManager = storageManager;