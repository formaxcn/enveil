import './style.css';
import { SwitchComponent } from '../../components/SwitchComponent';
import { AddSiteModal } from '../../components/AddSiteModal';

// 添加类型声明
declare const chrome: any;

// 定义配置结构类型
interface SiteConfig {
  enable: boolean;
  matchPattern: string;
  matchValue: string;
  envName: string;
  color: string;
  backgroundEnable: boolean;
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
          backgroundEnable: false,
          Position: "leftTop",
          flagEnable: false
        }
      ]
    }
  ]
};

// 当前选中的组索引
let selectedGroupIndex: number | null = null;

// 自动保存配置
function saveConfig() {
  console.log('Auto-saving configuration...', appConfig);
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.set({ appConfig }, () => {
      console.log('Configuration saved to storage');
    });
  } else {
    // Fallback for local dev
    localStorage.setItem('appConfig', JSON.stringify(appConfig));
  }
}

// 加载配置
function loadConfig(callback: () => void) {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(['appConfig'], (result: any) => {
      if (result.appConfig) {
        appConfig = result.appConfig;
        console.log('Configuration loaded from storage', appConfig);
      }
      callback();
    });
  } else {
    // Fallback for local dev
    const saved = localStorage.getItem('appConfig');
    if (saved) {
      try {
        appConfig = JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved config', e);
      }
    }
    callback();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('Options page loaded');

  // 加载配置后初始化UI
  loadConfig(() => {
    initUI();
  });
});

function initUI() {
  // 创建浏览器同步开关组件
  const syncSwitchContainer = document.getElementById('browser-sync-option') as HTMLDivElement;
  // Browser Sync still uses internal persistence for backward compatibility, or we can migrate it to appConfig too.
  // Let's migrate it to appConfig to be consistent.
  const syncSwitch = new SwitchComponent(
    syncSwitchContainer,
    'Browser Sync',
    'browserSync',
    'local',
    appConfig.browserSync,
    false // Disable internal persistence
  );

  syncSwitch.onChange((isChecked: boolean) => {
    appConfig.browserSync = isChecked;
    saveConfig();
  });

  // 获取配置表格容器
  const groupsListContainer = document.getElementById('groups-list-container') as HTMLDivElement;
  const addConfigGroupBtn = document.getElementById('add-config-group') as HTMLButtonElement;
  const configGroupsContainer = document.getElementById('config-groups-container') as HTMLDivElement;

  // 获取浮动添加按钮
  const floatingAddButton = document.querySelector('.floating-add-button') as HTMLButtonElement;

  // 创建添加网站模态框
  const addSiteModal = new AddSiteModal();
  addSiteModal.onSave((site: SiteConfig) => {
    // 添加到默认组（索引为0）
    if (!appConfig.settings[0]) {
      // 如果默认组不存在，创建它
      appConfig.settings.push({
        name: "default",
        enable: true,
        sites: []
      });
    }

    // Use selected group if available, otherwise default
    const targetGroupIndex = selectedGroupIndex !== null ? selectedGroupIndex : 0;
    if (appConfig.settings[targetGroupIndex]) {
      appConfig.settings[targetGroupIndex].sites.push(site);
    } else {
      // Fallback
      appConfig.settings[0].sites.push(site);
    }

    updateConfigDisplay();
    saveConfig();
  });

  // 绑定浮动按钮点击事件
  if (floatingAddButton) {
    floatingAddButton.addEventListener('click', () => {
      addSiteModal.open();
    });
  }

  // 更新配置显示
  function updateConfigDisplay() {
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

      // Group Name (editable)
      const nameSpan = document.createElement('span');
      nameSpan.textContent = setting.name;
      nameSpan.style.flex = '1';
      nameSpan.style.marginRight = '10px';
      nameSpan.title = 'Double click to rename';

      // Double click to rename
      nameSpan.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        const input = document.createElement('input');
        input.type = 'text';
        input.value = setting.name;
        input.style.width = '100%';
        input.style.padding = '2px 5px';
        input.style.borderRadius = '4px';
        input.style.border = '1px solid #ccc';
        input.style.color = '#333'; // Ensure text is visible

        // Prevent click propagation from input
        input.addEventListener('click', (ev) => ev.stopPropagation());

        input.addEventListener('blur', () => {
          finishRename();
        });

        input.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') {
            finishRename();
          } else if (ev.key === 'Escape') {
            nameSpan.textContent = setting.name; // Revert
          }
        });

        function finishRename() {
          const newName = input.value.trim();
          if (newName && newName !== setting.name) {
            setting.name = newName;
            saveConfig();
            updateConfigDisplay();
          } else {
            nameSpan.textContent = setting.name;
          }
        }

        nameSpan.textContent = '';
        nameSpan.appendChild(input);
        input.focus();
      });

      // Group Toggle Switch
      const switchContainer = document.createElement('div');
      // Prevent click propagation to avoid selecting the group when toggling
      switchContainer.addEventListener('click', (e) => e.stopPropagation());

      const groupSwitch = new SwitchComponent(
        switchContainer,
        '',
        `group-list-${index}`,
        'local',
        setting.enable,
        false // Disable persistence
      );

      groupSwitch.onChange((checked) => {
        setting.enable = checked;
        saveConfig();
        // Update the main view toggle as well
        updateConfigDisplay();
      });

      groupItem.appendChild(nameSpan);
      groupItem.appendChild(switchContainer);

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
      const groupSwitch = new SwitchComponent(
        enableSwitchContainer,
        '',
        `group-${groupIndex}-enable`,
        'local',
        setting.enable,
        false // Disable persistence
      );

      groupSwitch.onChange((checked) => {
        setting.enable = checked;
        saveConfig();
        // Update the list view toggle as well
        renderGroupsList();
      });

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
          backgroundEnable: false,
          Position: "leftTop",
          flagEnable: false
        };

        appConfig.settings[groupIndex].sites.push(newSite);
        updateConfigDisplay();
        saveConfig();
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

        const headers = ['Match Pattern', 'Match Value', 'Env Name', 'Color', 'Background', 'Position', 'Flag', 'Actions'];
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
          const siteSwitch = new SwitchComponent(
            siteEnableContainer,
            '',
            `site-${groupIndex}-${siteIndex}-enable`,
            'local',
            site.enable,
            false // Disable persistence
          );
          siteSwitch.onChange((checked) => {
            site.enable = checked;
            saveConfig();
          });
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
          const bgSwitch = new SwitchComponent(
            bgEnableContainer,
            '',
            `site-${groupIndex}-${siteIndex}-bg`,
            'local',
            site.backgroundEnable,
            false // Disable persistence
          );
          bgSwitch.onChange((checked) => {
            site.backgroundEnable = checked;
            saveConfig();
          });
          bgCell.appendChild(bgEnableContainer);
          row.appendChild(bgCell);

          // Position
          const posCell = document.createElement('td');
          posCell.textContent = site.Position;
          row.appendChild(posCell);

          // Flag
          const flagCell = document.createElement('td');
          const flagEnableContainer = document.createElement('div');
          const flagSwitch = new SwitchComponent(
            flagEnableContainer,
            '',
            `site-${groupIndex}-${siteIndex}-flag`,
            'local',
            site.flagEnable,
            false // Disable persistence
          );
          flagSwitch.onChange((checked) => {
            site.flagEnable = checked;
            saveConfig();
          });
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
              saveConfig();
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
  if (addConfigGroupBtn) {
    addConfigGroupBtn.addEventListener('click', () => {
      const newSetting: Setting = {
        name: `Group ${appConfig.settings.length + 1}`,
        enable: true,
        sites: []
      };

      appConfig.settings.push(newSetting);
      updateConfigDisplay();
      saveConfig();
    });
  }

  // 初始化配置显示
  updateConfigDisplay();
}