// 后台脚本，监听扩展相关事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('Enveil extension installed');
});

// 当标签页更新时，检查是否需要应用样式
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    // 获取存储的设置
    chrome.storage.sync.get(['enveilSettings'], function(result) {
      const settings = result.enveilSettings || {};
      // 发送消息到内容脚本
      chrome.tabs.sendMessage(tabId, { action: 'updateSettings', settings: settings });
    });
  }
});