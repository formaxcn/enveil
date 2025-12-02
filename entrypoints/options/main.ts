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

// 存储配置数据
let appConfig: AppConfig = {
  browserSync: true,
  settings: [
    {
      name: "default",
      enable: true,
      sites: [
        {
          enable: false,
          matchPattern: "domain",
          matchValue: "baidu.com",
          envName: "dev",
          color: "#FF0000",
          backgroudEnable: false,
          Position: "leftTop",
          flagEnable: false
        }
      ]
    }
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('Options page loaded');
  
  // 创建浏览器同步开关组件
  const syncSwitchContainer = document.getElementById('browser-sync-option') as HTMLDivElement;
  const syncSwitch = new SwitchComponent(syncSwitchContainer, 'Browser Sync', 'browserSync', 'local');
  
  // 获取导入导出按钮元素
  const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
  const importBtn = document.getElementById('import-btn') as HTMLButtonElement;
  const importFileInput = document.getElementById('import-file-input') as HTMLInputElement;
  
  // 获取配置显示区域
  const configJsonElement = document.getElementById('config-json') as HTMLPreElement;
  
  // 获取配置表格容器
  const configTableContainer = document.getElementById('config-table') as HTMLDivElement;
  const addConfigGroupBtn = document.getElementById('add-config-group') as HTMLButtonElement;
  
  // 更新配置显示
  function updateConfigDisplay() {
    configJsonElement.textContent = JSON.stringify(appConfig, null, 2);
    renderConfigTable();
  }
  
  // 渲染配置表格
  function renderConfigTable() {
    if (!configTableContainer) return;
    
    configTableContainer.innerHTML = '';
    
    appConfig.settings.forEach((setting, groupIndex) => {
      // 创建组容器
      const groupContainer = document.createElement('div');
      groupContainer.className = 'config-group';
      groupContainer.style.border = '1px solid #ddd';
      groupContainer.style.borderRadius = '4px';
      groupContainer.style.marginBottom = '10px';
      
      // 创建组标题栏
      const groupHeader = document.createElement('div');
      groupHeader.className = 'group-header';
      groupHeader.style.display = 'flex';
      groupHeader.style.justifyContent = 'space-between';
      groupHeader.style.padding = '10px';
      groupHeader.style.backgroundColor = '#f5f5f5';
      groupHeader.style.cursor = 'pointer';
      
      const groupName = document.createElement('span');
      groupName.textContent = setting.name;
      groupName.style.fontWeight = 'bold';
      
      const groupActions = document.createElement('div');
      
      const toggleButton = document.createElement('button');
      toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
      toggleButton.style.marginRight = '5px';
      toggleButton.style.background = 'none';
      toggleButton.style.border = 'none';
      toggleButton.style.cursor = 'pointer';
      
      const enableSwitchContainer = document.createElement('div');
      enableSwitchContainer.style.display = 'inline-block';
      const groupSwitch = new SwitchComponent(enableSwitchContainer, '', `${setting.name}-enable`, 'local');
      groupSwitch.setChecked(setting.enable);
      
      groupActions.appendChild(toggleButton);
      groupActions.appendChild(enableSwitchContainer);
      
      groupHeader.appendChild(groupName);
      groupHeader.appendChild(groupActions);
      
      // 创建详细配置区域
      const detailContainer = document.createElement('div');
      detailContainer.className = 'group-details';
      detailContainer.style.display = 'none';
      detailContainer.style.padding = '10px';
      
      // 创建站点配置表格
      const sitesTable = document.createElement('table');
      sitesTable.style.width = '100%';
      sitesTable.style.borderCollapse = 'collapse';
      
      // 表头
      const tableHeader = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      const headers = ['Enable', 'Match Pattern', 'Match Value', 'Env Name', 'Color', 'Background', 'Position', 'Flag', 'Actions'];
      headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.border = '1px solid #ddd';
        th.style.padding = '8px';
        th.style.textAlign = 'left';
        th.style.backgroundColor = '#f9f9f9';
        headerRow.appendChild(th);
      });
      
      tableHeader.appendChild(headerRow);
      sitesTable.appendChild(tableHeader);
      
      // 表体
      const tableBody = document.createElement('tbody');
      
      setting.sites.forEach((site, siteIndex) => {
        const row = document.createElement('tr');
        
        // Enable
        const enableCell = document.createElement('td');
        const siteEnableContainer = document.createElement('div');
        const siteSwitch = new SwitchComponent(siteEnableContainer, '', `site-${groupIndex}-${siteIndex}-enable`, 'local');
        siteSwitch.setChecked(site.enable);
        enableCell.appendChild(siteEnableContainer);
        enableCell.style.border = '1px solid #ddd';
        enableCell.style.padding = '8px';
        row.appendChild(enableCell);
        
        // Match Pattern
        const patternCell = document.createElement('td');
        patternCell.textContent = site.matchPattern;
        patternCell.style.border = '1px solid #ddd';
        patternCell.style.padding = '8px';
        row.appendChild(patternCell);
        
        // Match Value
        const valueCell = document.createElement('td');
        valueCell.textContent = site.matchValue;
        valueCell.style.border = '1px solid #ddd';
        valueCell.style.padding = '8px';
        row.appendChild(valueCell);
        
        // Env Name
        const envCell = document.createElement('td');
        envCell.textContent = site.envName;
        envCell.style.border = '1px solid #ddd';
        envCell.style.padding = '8px';
        row.appendChild(envCell);
        
        // Color
        const colorCell = document.createElement('td');
        colorCell.textContent = site.color;
        colorCell.style.border = '1px solid #ddd';
        colorCell.style.padding = '8px';
        row.appendChild(colorCell);
        
        // Background
        const bgCell = document.createElement('td');
        const bgEnableContainer = document.createElement('div');
        const bgSwitch = new SwitchComponent(bgEnableContainer, '', `site-${groupIndex}-${siteIndex}-bg`, 'local');
        bgSwitch.setChecked(site.backgroudEnable);
        bgCell.appendChild(bgEnableContainer);
        bgCell.style.border = '1px solid #ddd';
        bgCell.style.padding = '8px';
        row.appendChild(bgCell);
        
        // Position
        const posCell = document.createElement('td');
        posCell.textContent = site.Position;
        posCell.style.border = '1px solid #ddd';
        posCell.style.padding = '8px';
        row.appendChild(posCell);
        
        // Flag
        const flagCell = document.createElement('td');
        const flagEnableContainer = document.createElement('div');
        const flagSwitch = new SwitchComponent(flagEnableContainer, '', `site-${groupIndex}-${siteIndex}-flag`, 'local');
        flagSwitch.setChecked(site.flagEnable);
        flagCell.appendChild(flagEnableContainer);
        flagCell.style.border = '1px solid #ddd';
        flagCell.style.padding = '8px';
        row.appendChild(flagCell);
        
        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.style.border = '1px solid #ddd';
        actionsCell.style.padding = '8px';
        
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.style.background = 'none';
        editBtn.style.border = 'none';
        editBtn.style.cursor = 'pointer';
        editBtn.style.marginRight = '5px';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.style.background = 'none';
        deleteBtn.style.border = 'none';
        deleteBtn.style.cursor = 'pointer';
        
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
      });
      
      sitesTable.appendChild(tableBody);
      
      // 添加站点按钮
      const addSiteRow = document.createElement('tr');
      const addSiteCell = document.createElement('td');
      addSiteCell.colSpan = 9;
      addSiteCell.style.border = '1px solid #ddd';
      addSiteCell.style.padding = '8px';
      addSiteCell.style.textAlign = 'center';
      
      const addSiteButton = document.createElement('button');
      addSiteButton.innerHTML = '<i class="fas fa-plus"></i> Add Site';
      addSiteButton.style.background = '#4CAF50';
      addSiteButton.style.color = 'white';
      addSiteButton.style.border = 'none';
      addSiteButton.style.padding = '5px 10px';
      addSiteButton.style.borderRadius = '3px';
      addSiteButton.style.cursor = 'pointer';
      
      addSiteCell.appendChild(addSiteButton);
      addSiteRow.appendChild(addSiteCell);
      tableBody.appendChild(addSiteRow);
      
      detailContainer.appendChild(sitesTable);
      
      // 折叠/展开功能
      groupHeader.addEventListener('click', () => {
        if (detailContainer.style.display === 'none') {
          detailContainer.style.display = 'block';
          toggleButton.innerHTML = '<i class="fas fa-chevron-up"></i>';
        } else {
          detailContainer.style.display = 'none';
          toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
        }
      });
      
      groupContainer.appendChild(groupHeader);
      groupContainer.appendChild(detailContainer);
      configTableContainer.appendChild(groupContainer);
    });
  }
  
  // 添加新的配置组
  addConfigGroupBtn.addEventListener('click', () => {
    const newSetting: Setting = {
      name: `Group ${appConfig.settings.length + 1}`,
      enable: true,
      sites: []
    };
    
    appConfig.settings.push(newSetting);
    updateConfigDisplay();
  });
  
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