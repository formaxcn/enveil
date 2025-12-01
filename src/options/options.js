document.addEventListener('DOMContentLoaded', function() {
  // 获取所有表单元素
  const patternInput = document.getElementById('pattern');
  const keywordInput = document.getElementById('keyword');
  const bannerColorInput = document.getElementById('bannerColor');
  const overlayColorInput = document.getElementById('overlayColor');
  const overlayOpacityInput = document.getElementById('overlayOpacity');
  const opacityValue = document.getElementById('opacityValue');
  const bannerEnabledCheckbox = document.getElementById('bannerEnabled');
  const overlayEnabledCheckbox = document.getElementById('overlayEnabled');
  const bannerTextInput = document.getElementById('bannerText');
  const bannerPositionSelect = document.getElementById('bannerPosition');
  const saveButton = document.getElementById('save');
  const resetButton = document.getElementById('reset');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const fileInput = document.getElementById('fileInput');
  const configOutput = document.getElementById('configOutput');

  // 加载已保存的设置
  loadSettings();

  // 监听透明度滑块变化
  overlayOpacityInput.addEventListener('input', function() {
    opacityValue.textContent = this.value;
  });

  // 保存设置
  saveButton.addEventListener('click', function() {
    const settings = {
      pattern: patternInput.value,
      keyword: keywordInput.value,
      bannerColor: bannerColorInput.value,
      overlayColor: overlayColorInput.value,
      overlayOpacity: overlayOpacityInput.value,
      bannerEnabled: bannerEnabledCheckbox.checked,
      overlayEnabled: overlayEnabledCheckbox.checked,
      bannerText: bannerTextInput.value,
      bannerPosition: bannerPositionSelect.value
    };

    chrome.storage.sync.set({ enveilSettings: settings }, function() {
      alert('设置已保存！');
      // 发送消息通知内容脚本更新
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: 'updateSettings', settings: settings });
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
    chrome.storage.sync.get(['enveilSettings'], function(result) {
      const settings = result.enveilSettings || {};
      const dataStr = JSON.stringify(settings, null, 2);
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
        const settings = JSON.parse(e.target.result);
        applyImportedSettings(settings);
        configOutput.value = e.target.result;
        alert('配置导入成功！');
      } catch (error) {
        alert('配置文件格式错误：' + error.message);
      }
    };
    reader.readAsText(file);
  });

  // 应用导入的设置
  function applyImportedSettings(settings) {
    patternInput.value = settings.pattern || '';
    keywordInput.value = settings.keyword || '';
    bannerColorInput.value = settings.bannerColor || '#FF0000';
    overlayColorInput.value = settings.overlayColor || '#000000';
    overlayOpacityInput.value = settings.overlayOpacity || '0.3';
    opacityValue.textContent = settings.overlayOpacity || '0.3';
    bannerEnabledCheckbox.checked = settings.bannerEnabled || false;
    overlayEnabledCheckbox.checked = settings.overlayEnabled || false;
    bannerTextInput.value = settings.bannerText || '';
    bannerPositionSelect.value = settings.bannerPosition || 'top-left';

    // 保存设置
    chrome.storage.sync.set({ enveilSettings: settings }, function() {
      // 发送消息通知内容脚本更新
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: 'updateSettings', settings: settings });
        });
      });
    });
  }

  // 加载设置
  function loadSettings() {
    chrome.storage.sync.get(['enveilSettings'], function(result) {
      const settings = result.enveilSettings || {};
      
      patternInput.value = settings.pattern || '';
      keywordInput.value = settings.keyword || '';
      bannerColorInput.value = settings.bannerColor || '#FF0000';
      overlayColorInput.value = settings.overlayColor || '#000000';
      overlayOpacityInput.value = settings.overlayOpacity || '0.3';
      opacityValue.textContent = settings.overlayOpacity || '0.3';
      bannerEnabledCheckbox.checked = settings.bannerEnabled || false;
      overlayEnabledCheckbox.checked = settings.overlayEnabled || false;
      bannerTextInput.value = settings.bannerText || '';
      bannerPositionSelect.value = settings.bannerPosition || 'top-left';
    });
  }

  // 重置设置
  function resetSettings() {
    patternInput.value = '';
    keywordInput.value = '';
    bannerColorInput.value = '#FF0000';
    overlayColorInput.value = '#000000';
    overlayOpacityInput.value = '0.3';
    opacityValue.textContent = '0.3';
    bannerEnabledCheckbox.checked = false;
    overlayEnabledCheckbox.checked = false;
    bannerTextInput.value = '';
    bannerPositionSelect.value = 'top-left';
    
    const settings = {
      pattern: '',
      keyword: '',
      bannerColor: '#FF0000',
      overlayColor: '#000000',
      overlayOpacity: '0.3',
      bannerEnabled: false,
      overlayEnabled: false,
      bannerText: '',
      bannerPosition: 'top-left'
    };

    chrome.storage.sync.set({ enveilSettings: settings }, function() {
      // 发送消息通知内容脚本更新
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: 'updateSettings', settings: settings });
        });
      });
    });
  }
});