let currentSites = [];

// 接收来自popup或background的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'updateSettings') {
    currentSites = request.sites || [];
    applyStyles();
  }
});

// 页面加载完成后应用样式
document.addEventListener('DOMContentLoaded', function() {
  // 获取存储的设置
  chrome.storage.sync.get(['enveilSites'], function(result) {
    // 首先尝试从同步存储获取
    if (result.enveilSites !== undefined) {
      currentSites = result.enveilSites || [];
      applyStyles();
    } else {
      // 如果同步存储中没有，则尝试从本地存储获取
      chrome.storage.local.get(['enveilSites'], function(localResult) {
        currentSites = localResult.enveilSites || [];
        applyStyles();
      });
    }
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
  
  if (!currentSites || currentSites.length === 0) {
    return;
  }
  
  // 检查当前域名是否匹配任何设置
  const matchedSite = findMatchingSite();
  if (matchedSite) {
    // 添加横幅
    if (matchedSite.bannerEnabled && matchedSite.bannerText) {
      addBanner(matchedSite);
    }
    
    // 添加蒙版
    if (matchedSite.overlayEnabled) {
      addOverlay(matchedSite);
    }
  }
}

// 查找匹配的站点配置
function findMatchingSite() {
  const domain = window.location.hostname;
  
  for (const site of currentSites) {
    // 检查关键词匹配
    if (site.keyword) {
      const keywords = site.keyword.split(',').map(k => k.trim()).filter(k => k);
      if (keywords.some(keyword => domain.includes(keyword))) {
        return site;
      }
    }
    
    // 检查模式匹配
    if (site.pattern) {
      const patterns = site.pattern.split(',').map(p => p.trim()).filter(p => p);
      for (const pattern of patterns) {
        // 将简单的通配符模式转换为正则表达式
        const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
        const regex = new RegExp(`^${regexPattern}$`);
        if (regex.test(domain)) {
          return site;
        }
      }
    }
  }
  
  return null;
}

// 添加横幅
function addBanner(site) {
  const banner = document.createElement('div');
  banner.id = 'enveil-banner';
  banner.textContent = site.bannerText;
  banner.style.position = 'fixed';
  banner.style.zIndex = '2147483647'; // 最大z-index值
  banner.style.backgroundColor = site.bannerColor || '#FF0000';
  banner.style.color = 'white';
  banner.style.padding = '5px 10px';
  banner.style.fontSize = '12px';
  banner.style.fontWeight = 'bold';
  banner.style.pointerEvents = 'none'; // 不拦截鼠标事件
  banner.style.transition = 'opacity 0.3s ease';
  
  // 根据设置的位置放置横幅
  switch (site.bannerPosition) {
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
function addOverlay(site) {
  const overlay = document.createElement('div');
  overlay.id = 'enveil-overlay';
  overlay.style.position = 'fixed';
  overlay.style.zIndex = '2147483646'; // 略小于横幅的z-index
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = site.overlayColor || '#000000';
  overlay.style.opacity = site.overlayOpacity || '0.3';
  overlay.style.pointerEvents = 'none'; // 不拦截鼠标事件
  overlay.style.display = 'block';
  overlay.style.transition = 'opacity 0.3s ease';
  
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