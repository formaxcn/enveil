// 后台脚本，监听扩展相关事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('Enveil extension installed');
});

// 当标签页更新时，检查是否需要应用样式
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    // 获取存储的设置
    chrome.storage.sync.get(['enveilSites', 'enveilSync'], function(syncResult) {
      // 首先尝试从同步存储获取
      if (syncResult.enveilSites !== undefined || syncResult.enveilSync !== undefined) {
        const sites = syncResult.enveilSites || [];
        // 发送消息到内容脚本
        chrome.tabs.sendMessage(tabId, { action: 'updateSettings', sites: sites });
      } else {
        // 如果同步存储中没有，则尝试从本地存储获取
        chrome.storage.local.get(['enveilSites', 'enveilSync'], function(localResult) {
          const sites = localResult.enveilSites || [];
          // 发送消息到内容脚本
          chrome.tabs.sendMessage(tabId, { action: 'updateSettings', sites: sites });
        });
      }
    });
  }
});