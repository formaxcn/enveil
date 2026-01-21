import './style.css';
import { SwitchComponent } from '../../components/SwitchComponent';

// 添加类型声明
declare const chrome: any;

// 获取元素
const configureBtn = document.getElementById('configure-btn') as HTMLButtonElement;
const addConfigBtn = document.getElementById('add-config-btn') as HTMLButtonElement;

// 创建开关组件
const switchContainer = document.getElementById('enable-switch') as HTMLDivElement;
const globalSwitch = new SwitchComponent(switchContainer, 'Enable Enveil', 'isEnabled', 'local');



// 配置按钮点击事件
configureBtn.addEventListener('click', () => {
  // 直接在新标签页中打开选项页面，确保页面宽度足够
  window.open(chrome.runtime.getURL('options.html'));
});

// 添加配置按钮点击事件
addConfigBtn.addEventListener('click', () => {
  // 发送消息到 content script 要求添加当前站点
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
      if (tabs.length > 0 && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'addCurrentSite' 
        });
      }
    });
  } else {
    console.warn('Cannot send message to content script: chrome.tabs is not available');
  }
});