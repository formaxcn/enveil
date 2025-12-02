import './style.css';
import { SwitchComponent } from '../../components/SwitchComponent';

// 添加类型声明
declare const chrome: any;

// 定义配置结构类型
interface SiteConfig {
  enable: boolean;
  matchPattern: string;
  matchValue: string;
  envName: string;
  color: string;
  backgroudEnable: boolean;
  Position: string;
  flagEnable: boolean;
}

interface Setting {
  name: string;
  enable: boolean;
  sites: SiteConfig[];
}

interface AppConfig {
  browserSync: boolean;
  settings: Setting[];
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('Options page loaded');
  
  // 创建整体开关组件（保留原有的）
  const switchContainer = document.getElementById('enable-switch-option') as HTMLDivElement;
  const globalSwitch = new SwitchComponent(switchContainer, 'Enable Enveil', 'isEnabled', 'local');
  
  // 创建浏览器同步开关组件
  const syncSwitchContainer = document.getElementById('browser-sync-option') as HTMLDivElement;
  const syncSwitch = new SwitchComponent(syncSwitchContainer, 'Browser Sync', 'browserSync', 'local');
  
  // 获取导入导出按钮元素
  const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
  const importBtn = document.getElementById('import-btn') as HTMLButtonElement;
  const importFileInput = document.getElementById('import-file-input') as HTMLInputElement;
  
  // 获取配置显示区域
  const configJsonElement = document.getElementById('config-json') as HTMLPreElement;
  
  // 显示当前配置示例
  const sampleConfig: AppConfig = {
    browserSync: true,
    settings: [
      {
        "name": "xxx",
        "enable": false,
        "sites": [
          {
            enable: false,
            matchPattern: "regex, urlPrefix, domain",
            matchValue: "baidu.com",
            envName: "dev",
            color: "",
            backgroudEnable: false,
            Position: "leftTop,rightTop, leftBottom, rightBottom",
            flagEnable: false
          }
        ]
      }
    ]
  };
  
  // 更新配置显示
  function updateConfigDisplay() {
    configJsonElement.textContent = JSON.stringify(sampleConfig, null, 2);
  }
  
  // 初始化配置显示
  updateConfigDisplay();
  
  // 导出按钮点击事件
  exportBtn.addEventListener('click', () => {
    alert('Export functionality will be implemented here');
    // TODO: 实现导出功能
  });
  
  // 导入按钮点击事件
  importBtn.addEventListener('click', () => {
    importFileInput.click();
  });
  
  // 文件选择事件
  importFileInput.addEventListener('change', (event) => {
    const files = (event.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      alert('Import functionality will be implemented here');
      // TODO: 实现导入功能
      // 清空文件输入框
      importFileInput.value = '';
    }
  });
  
  // 浏览器同步开关变化事件
  syncSwitch.onChange((isChecked: boolean) => {
    console.log('Browser sync switched:', isChecked);
    // TODO: 根据开关状态切换存储位置
  });
});