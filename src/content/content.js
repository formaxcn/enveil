let currentSettings = {};

// 接收来自popup或background的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'updateSettings') {
    currentSettings = request.settings;
    applyStyles();
  }
});

// 页面加载完成后应用样式
document.addEventListener('DOMContentLoaded', function() {
  // 获取存储的设置
  chrome.storage.sync.get(['enveilSettings'], function(result) {
    currentSettings = result.enveilSettings || {};
    applyStyles();
  });
});

// 页面加载后立即应用样式（以防DOMContentLoaded未触发）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyStyles);
} else {
  applyStyles();
}

// 应用样式函数
function applyStyles() {
  removeExistingElements();
  
  if (!currentSettings.pattern && !currentSettings.keyword) {
    return;
  }
  
  // 检查当前域名是否匹配设置
  if (!isDomainMatch()) {
    return;
  }
  
  // 添加横幅
  if (currentSettings.bannerEnabled && currentSettings.bannerText) {
    addBanner();
  }
  
  // 添加蒙版
  if (currentSettings.overlayEnabled) {
    addOverlay();
  }
}

// 检查域名是否匹配
function isDomainMatch() {
  const domain = window.location.hostname;
  
  // 检查关键词匹配
  if (currentSettings.keyword) {
    const keywords = currentSettings.keyword.split(',').map(k => k.trim()).filter(k => k);
    if (keywords.some(keyword => domain.includes(keyword))) {
      return true;
    }
  }
  
  // 检查模式匹配
  if (currentSettings.pattern) {
    const patterns = currentSettings.pattern.split(',').map(p => p.trim()).filter(p => p);
    for (const pattern of patterns) {
      // 将简单的通配符模式转换为正则表达式
      const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(domain)) {
        return true;
      }
    }
  }
  
  return false;
}

// 添加横幅
function addBanner() {
  const banner = document.createElement('div');
  banner.id = 'enveil-banner';
  banner.textContent = currentSettings.bannerText;
  banner.style.position = 'fixed';
  banner.style.zIndex = '2147483647'; // 最大z-index值
  banner.style.backgroundColor = currentSettings.bannerColor || '#FF0000';
  banner.style.color = 'white';
  banner.style.padding = '5px 10px';
  banner.style.fontSize = '12px';
  banner.style.fontWeight = 'bold';
  banner.style.pointerEvents = 'none'; // 不拦截鼠标事件
  
  // 根据设置的位置放置横幅
  switch (currentSettings.bannerPosition) {
    case 'top-left':
      banner.style.top = '0';
      banner.style.left = '0';
      break;
    case 'top-right':
      banner.style.top = '0';
      banner.style.right = '0';
      break;
    case 'bottom-left':
      banner.style.bottom = '0';
      banner.style.left = '0';
      break;
    case 'bottom-right':
      banner.style.bottom = '0';
      banner.style.right = '0';
      break;
    default:
      banner.style.top = '0';
      banner.style.left = '0';
  }
  
  document.body.appendChild(banner);
}

// 添加蒙版
function addOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'enveil-overlay';
  overlay.style.position = 'fixed';
  overlay.style.zIndex = '2147483646'; // 略小于横幅的z-index
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = currentSettings.overlayColor || '#000000';
  overlay.style.opacity = currentSettings.overlayOpacity || '0.3';
  overlay.style.pointerEvents = 'none'; // 不拦截鼠标事件
  overlay.style.display = 'block';
  
  document.body.appendChild(overlay);
}

// 移除已存在的元素
function removeExistingElements() {
  const existingBanner = document.getElementById('enveil-banner');
  const existingOverlay = document.getElementById('enveil-overlay');
  
  if (existingBanner) {
    existingBanner.remove();
  }
  
  if (existingOverlay) {
    existingOverlay.remove();
  }
}