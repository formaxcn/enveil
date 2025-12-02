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

// 当前选中的组索引
let selectedGroupIndex: number | null = null;

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
  const groupsListContainer = document.getElementById('groups-list-container') as HTMLDivElement;
  const addConfigGroupBtn = document.getElementById('add-config-group') as HTMLButtonElement;
  const configGroupsContainer = document.getElementById('config-groups-container') as HTMLDivElement;
  const saveConfigBtn = document.getElementById('save-config-btn') as HTMLButtonElement;
  const editorTitle = document.getElementById('editor-title') as HTMLHeadingElement;
  
  // 更新配置显示
  function updateConfigDisplay() {
    configJsonElement.textContent = JSON.stringify(appConfig, null, 2);
    renderGroupsList();
    renderConfigGroups();
  }
  
  // 渲染配置组列表
  function renderGroupsList() {
    if (!groupsListContainer) return;
    
    groupsListContainer.innerHTML = '';
    
    appConfig.settings.forEach((setting, index) => {
      const groupItem = document.createElement('div');
      groupItem.className = 'group-item';
      if (index === selectedGroupIndex) {
        groupItem.classList.add('active');
      }
      groupItem.innerHTML = `
        <span>${setting.name}</span>
        <span>
          <i class="fas fa-${setting.enable ? 'check-circle' : 'times-circle'}"></i>
        </span>
      `;
      
      groupItem.addEventListener('click', () => {
        selectedGroupIndex = index;
        updateConfigDisplay();
      });
      
      groupsListContainer.appendChild(groupItem);
    });
  }
  
  // 渲染所有配置组表格
  function renderConfigGroups() {
    if (!configGroupsContainer) return;
    
    configGroupsContainer.innerHTML = '';
    
    appConfig.settings.forEach((setting, groupIndex) => {
      // 创建配置组容器
      const groupContainer = document.createElement('div');
      groupContainer.className = 'config-group-container';
      
      // 创建组头部
      const groupHeader = document.createElement('div');
      groupHeader.className = 'config-group-header';
      
      // 组标题
      const groupTitle = document.createElement('div');
      groupTitle.className = 'config-group-title';
      groupTitle.textContent = setting.name;
      
      // 组操作区
      const groupActions = document.createElement('div');
      groupActions.className = 'config-group-actions';
      
      // 启用开关
      const enableSwitchContainer = document.createElement('div');
      const groupSwitch = new SwitchComponent(enableSwitchContainer, '', `group-${groupIndex}-enable`, 'local');
      groupSwitch.setChecked(setting.enable);
      
      // 添加站点按钮
      const addSiteBtn = document.createElement('button');
      addSiteBtn.className = 'add-site-btn';
      addSiteBtn.innerHTML = '<i class="fas fa-plus"></i> Add Site';
      addSiteBtn.addEventListener('click', () => {
        // 添加一个新的站点配置
        const newSite: SiteConfig = {
          enable: true,
          matchPattern: "domain",
          matchValue: "",
          envName: "dev",
          color: "#FF0000",
          backgroudEnable: false,
          Position: "leftTop",
          flagEnable: false
        };
        
        appConfig.settings[groupIndex].sites.push(newSite);
        updateConfigDisplay();
      });
      
      groupActions.appendChild(enableSwitchContainer);
      groupActions.appendChild(addSiteBtn);
      
      groupHeader.appendChild(groupTitle);
      groupHeader.appendChild(groupActions);
      
      // 创建组表格
      const groupTable = document.createElement('table');
      groupTable.className = 'config-group-table';
      
      // 如果没有站点，则显示提示信息
      if (setting.sites.length === 0) {
        const emptyMessageRow = document.createElement('tr');
        const emptyMessageCell = document.createElement('td');
        emptyMessageCell.colSpan = 9;
        emptyMessageCell.className = 'empty-group-message';
        emptyMessageCell.textContent = 'No sites configured. Click "Add Site" to get started.';
        emptyMessageRow.appendChild(emptyMessageCell);
        groupTable.appendChild(emptyMessageRow);
      } else {
        // 表头
        const tableHeader = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const headers = ['Enable', 'Match Pattern', 'Match Value', 'Env Name', 'Color', 'Background', 'Position', 'Flag', 'Actions'];
        headers.forEach(headerText => {
          const th = document.createElement('th');
          th.textContent = headerText;
          headerRow.appendChild(th);
        });
        
        tableHeader.appendChild(headerRow);
        groupTable.appendChild(tableHeader);
        
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
          row.appendChild(enableCell);
          
          // Match Pattern
          const patternCell = document.createElement('td');
          patternCell.textContent = site.matchPattern;
          row.appendChild(patternCell);
          
          // Match Value
          const valueCell = document.createElement('td');
          valueCell.textContent = site.matchValue;
          row.appendChild(valueCell);
          
          // Env Name
          const envCell = document.createElement('td');
          envCell.textContent = site.envName;
          row.appendChild(envCell);
          
          // Color
          const colorCell = document.createElement('td');
          colorCell.textContent = site.color;
          row.appendChild(colorCell);
          
          // Background
          const bgCell = document.createElement('td');
          const bgEnableContainer = document.createElement('div');
          const bgSwitch = new SwitchComponent(bgEnableContainer, '', `site-${groupIndex}-${siteIndex}-bg`, 'local');
          bgSwitch.setChecked(site.backgroudEnable);
          bgCell.appendChild(bgEnableContainer);
          row.appendChild(bgCell);
          
          // Position
          const posCell = document.createElement('td');
          posCell.textContent = site.Position;
          row.appendChild(posCell);
          
          // Flag
          const flagCell = document.createElement('td');
          const flagEnableContainer = document.createElement('div');
          const flagSwitch = new SwitchComponent(flagEnableContainer, '', `site-${groupIndex}-${siteIndex}-flag`, 'local');
          flagSwitch.setChecked(site.flagEnable);
          flagCell.appendChild(flagEnableContainer);
          row.appendChild(flagCell);
          
          // Actions
          const actionsCell = document.createElement('td');
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
          
          // 删除按钮事件
          deleteBtn.addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete this site configuration?`)) {
              appConfig.settings[groupIndex].sites.splice(siteIndex, 1);
              updateConfigDisplay();
            }
          });
          
          actionsCell.appendChild(editBtn);
          actionsCell.appendChild(deleteBtn);
          row.appendChild(actionsCell);
          
          tableBody.appendChild(row);
        });
        
        groupTable.appendChild(tableBody);
      }
      
      // 组装元素
      groupContainer.appendChild(groupHeader);
      groupContainer.appendChild(groupTable);
      configGroupsContainer.appendChild(groupContainer);
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
  
  // 保存配置按钮事件
  saveConfigBtn.addEventListener('click', () => {
    alert('Configuration saved successfully!');
    // 在实际应用中，这里应该保存到存储中
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