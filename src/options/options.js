document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const sitesContainer = document.getElementById('sitesContainer');
  const addSiteButton = document.getElementById('addSite');
  const saveButton = document.getElementById('save');
  const resetButton = document.getElementById('reset');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const fileInput = document.getElementById('fileInput');
  const configOutput = document.getElementById('configOutput');
  const siteTemplate = document.getElementById('siteTemplate');
  const syncSettingsCheckbox = document.getElementById('syncSettings');

  // 加载已保存的设置
  loadSettings();

  // 添加新网站配置
  addSiteButton.addEventListener('click', function() {
    addNewSiteConfig();
  });

  // 保存设置
  saveButton.addEventListener('click', function() {
    const sites = getSitesData();
    const useSync = syncSettingsCheckbox.checked;
    
    // 设置存储类型
    storageManager.setStorageSync(useSync);
    
    // 保存数据
    storageManager.set({ 
      enveilSites: sites,
      enveilSync: useSync
    }, function() {
      alert('设置已保存！');
      // 发送消息通知内容脚本更新
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: 'updateSettings', sites: sites });
        });
      });
    });
  });

  // 重置设置
  resetButton.addEventListener('click', function() {
    if (confirm('确定要重置所有设置吗？')) {
      resetSettings();
    }
  });

  // 导出配置
  exportBtn.addEventListener('click', function() {
    const useSync = syncSettingsCheckbox.checked;
    storageManager.setStorageSync(useSync);
    
    storageManager.get(['enveilSites'], function(result) {
      const sites = result.enveilSites || [];
      const dataStr = JSON.stringify(sites, null, 2);
      configOutput.value = dataStr;
      
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = 'enveil-config.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    });
  });

  // 导入配置
  importBtn.addEventListener('click', function() {
    fileInput.click();
  });

  // 文件选择处理
  fileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const sites = JSON.parse(e.target.result);
        if (Array.isArray(sites)) {
          applyImportedSettings(sites);
          configOutput.value = e.target.result;
          alert('配置导入成功！');
        } else {
          throw new Error('配置格式错误');
        }
      } catch (error) {
        alert('配置文件格式错误：' + error.message);
      }
    };
    reader.readAsText(file);
  });

  // 应用导入的设置
  function applyImportedSettings(sites) {
    // 清空现有配置
    sitesContainer.innerHTML = '';
    
    // 为每个站点添加配置项
    sites.forEach(site => {
      const siteElement = createSiteElement(site);
      sitesContainer.appendChild(siteElement);
    });
    
    // 如果没有站点配置，添加一个默认的
    if (sites.length === 0) {
      addNewSiteConfig();
    }

    // 保存设置
    const useSync = syncSettingsCheckbox.checked;
    storageManager.setStorageSync(useSync);
    
    storageManager.set({ 
      enveilSites: sites,
      enveilSync: useSync
    }, function() {
      // 发送消息通知内容脚本更新
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: 'updateSettings', sites: sites });
        });
      });
    });
  }

  // 加载设置
  function loadSettings() {
    // 先尝试从同步存储获取设置
    storageManager.setStorageSync(true);
    storageManager.get(['enveilSites', 'enveilSync'], function(syncResult) {
      // 如果同步存储中有数据，则使用同步存储
      if (syncResult.enveilSites !== undefined || syncResult.enveilSync !== undefined) {
        const sites = syncResult.enveilSites || [];
        const useSync = syncResult.enveilSync !== undefined ? syncResult.enveilSync : true;
        
        syncSettingsCheckbox.checked = useSync;
        storageManager.setStorageSync(useSync);
        
        // 为每个站点添加配置项
        sites.forEach(site => {
          const siteElement = createSiteElement(site);
          sitesContainer.appendChild(siteElement);
        });
        
        // 如果没有站点配置，添加一个默认的
        if (sites.length === 0) {
          addNewSiteConfig();
        }
      } else {
        // 否则尝试从本地存储获取
        storageManager.setStorageSync(false);
        storageManager.get(['enveilSites', 'enveilSync'], function(localResult) {
          const sites = localResult.enveilSites || [];
          const useSync = localResult.enveilSync !== undefined ? localResult.enveilSync : false;
          
          syncSettingsCheckbox.checked = useSync;
          storageManager.setStorageSync(useSync);
          
          // 为每个站点添加配置项
          sites.forEach(site => {
            const siteElement = createSiteElement(site);
            sitesContainer.appendChild(siteElement);
          });
          
          // 如果没有站点配置，添加一个默认的
          if (sites.length === 0) {
            addNewSiteConfig();
          }
        });
      }
    });
  }

  // 重置设置
  function resetSettings() {
    sitesContainer.innerHTML = '';
    addNewSiteConfig();
    
    const sites = [];
    const useSync = syncSettingsCheckbox.checked;
    storageManager.setStorageSync(useSync);
    
    storageManager.set({ 
      enveilSites: sites,
      enveilSync: useSync
    }, function() {
      // 发送消息通知内容脚本更新
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: 'updateSettings', sites: sites });
        });
      });
    });
  }

  // 添加新的网站配置
  function addNewSiteConfig(siteData) {
    const siteElement = createSiteElement(siteData);
    sitesContainer.appendChild(siteElement);
  }

  // 创建网站配置元素
  function createSiteElement(siteData) {
    const siteClone = siteTemplate.content.cloneNode(true);
    const siteDiv = siteClone.querySelector('.site-config');
    
    // 获取所有输入元素
    const patternInput = siteDiv.querySelector('.pattern');
    const keywordInput = siteDiv.querySelector('.keyword');
    const bannerColorInput = siteDiv.querySelector('.bannerColor');
    const overlayColorInput = siteDiv.querySelector('.overlayColor');
    const overlayOpacityInput = siteDiv.querySelector('.overlayOpacity');
    const opacityValue = siteDiv.querySelector('.opacityValue');
    const bannerEnabledCheckbox = siteDiv.querySelector('.bannerEnabled');
    const overlayEnabledCheckbox = siteDiv.querySelector('.overlayEnabled');
    const bannerTextInput = siteDiv.querySelector('.bannerText');
    const bannerPositionSelect = siteDiv.querySelector('.bannerPosition');
    const removeButton = siteDiv.querySelector('.remove-site');
    
    // 填充数据（如果有）
    if (siteData) {
      patternInput.value = siteData.pattern || '';
      keywordInput.value = siteData.keyword || '';
      bannerColorInput.value = siteData.bannerColor || '#FF0000';
      overlayColorInput.value = siteData.overlayColor || '#000000';
      overlayOpacityInput.value = siteData.overlayOpacity || '0.3';
      opacityValue.textContent = siteData.overlayOpacity || '0.3';
      bannerEnabledCheckbox.checked = siteData.bannerEnabled || false;
      overlayEnabledCheckbox.checked = siteData.overlayEnabled || false;
      bannerTextInput.value = siteData.bannerText || '';
      bannerPositionSelect.value = siteData.bannerPosition || 'top-left';
    }
    
    // 监听透明度滑块变化
    overlayOpacityInput.addEventListener('input', function() {
      opacityValue.textContent = this.value;
    });
    
    // 删除按钮事件
    removeButton.addEventListener('click', function() {
      if (sitesContainer.children.length > 1) {
        siteDiv.remove();
      } else {
        alert('至少需要保留一个配置项');
      }
    });
    
    return siteDiv;
  }

  // 获取所有站点数据
  function getSitesData() {
    const sites = [];
    const siteElements = sitesContainer.querySelectorAll('.site-config');
    
    siteElements.forEach(siteElement => {
      const siteData = {
        pattern: siteElement.querySelector('.pattern').value,
        keyword: siteElement.querySelector('.keyword').value,
        bannerColor: siteElement.querySelector('.bannerColor').value,
        overlayColor: siteElement.querySelector('.overlayColor').value,
        overlayOpacity: siteElement.querySelector('.overlayOpacity').value,
        bannerEnabled: siteElement.querySelector('.bannerEnabled').checked,
        overlayEnabled: siteElement.querySelector('.overlayEnabled').checked,
        bannerText: siteElement.querySelector('.bannerText').value,
        bannerPosition: siteElement.querySelector('.bannerPosition').value
      };
      sites.push(siteData);
    });
    
    return sites;
  }
});