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

// 选中的配置组索引数组
let selectedGroups: number[] = [];

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
    
    // 初始化导入导出功能
    initImportExport();
    
    // 导入导出功能实现
    function initImportExport() {
      // 导出配置（根据选择状态决定导出全部或选定）
      const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
      if (exportBtn) {
        exportBtn.addEventListener('click', handleExport);
      }
      
      // 导入配置
      const importBtn = document.getElementById('import-btn') as HTMLInputElement;
      const importLabel = document.getElementById('import-btn')?.nextElementSibling as HTMLLabelElement;
      
      if (importBtn) {
        importBtn.addEventListener('change', importConfig);
      }
      
      if (importLabel) {
        importLabel.addEventListener('click', () => {
          importBtn?.click();
        });
      }
    }
    
    // 显示通知函数 - 替代直接的alert
    function showNotification(message: string, type: 'success' | 'error' | 'warning' = 'warning') {
      // 创建通知元素
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      
      // 设置样式
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#FF9800'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        font-size: 14px;
        transition: opacity 0.3s, transform 0.3s;
        opacity: 0;
        transform: translateX(100%);
      `;
      
      notification.textContent = message;
      document.body.appendChild(notification);
      
      // 显示通知
      setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
      }, 10);
      
      // 自动关闭通知
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
    }
    
    // 统一导出处理函数
    function handleExport() {
      // 如果没有配置组，提示用户
      if (appConfig.settings.length === 0) {
        showNotification('No configuration groups available for export.', 'warning');
        return;
      }
      
      // 检查是否有配置组被选中
      if (selectedGroups.length > 0) {
        // 如果有选中的配置组，导出选中的配置
        const selectedSettings = selectedGroups.map(index => appConfig.settings[index]);
        exportSelectedConfigs(selectedSettings);
      } else {
        // 否则导出所有配置
        exportAllConfig();
      }
    }
    
    // 导出全部配置函数
    function exportAllConfig() {
      // 确认导出全部配置
      if (!confirm('Are you sure you want to export all configurations?')) {
        return;
      }
      
      try {
        const configStr = JSON.stringify(appConfig, null, 2);
        downloadJSON(configStr, 'enveil-config-all.json');
        
        // 显示成功通知
        showNotification('All configurations exported successfully!', 'success');
      } catch (error) {
        // 显示错误通知
        showNotification(
          'Failed to export configurations: ' + (error instanceof Error ? error.message : 'Unknown error'),
          'error'
        );
      }
    }
    
    // 导出选定配置函数（内部使用）
    function exportSelectedConfigs(selectedGroups: Array<any>) {
      try {
        // 创建导出配置对象
        const exportConfig = {
          settings: selectedGroups,
          browserSync: appConfig.browserSync
        };
        
        // 生成文件名
        const filename = selectedGroups.length === 1 
          ? `enveil-config-${selectedGroups[0].name}.json`
          : 'enveil-config-selected.json';
        
        // 下载文件
        const configStr = JSON.stringify(exportConfig, null, 2);
        downloadJSON(configStr, filename);
        
        // 显示成功通知
        showNotification(
          `${selectedGroups.length} configuration group(s) exported successfully!`,
          'success'
        );
      } catch (error) {
        // 显示错误通知
        showNotification(
          'Failed to export selected configurations: ' + (error instanceof Error ? error.message : 'Unknown error'),
          'error'
        );
      }
    }
    
    // 导出所选配置函数（支持手动选择）
    function exportSelectedConfig() {
      // 如果没有配置组，提示用户
      if (appConfig.settings.length === 0) {
        showNotification('No configuration groups available for export.', 'warning');
        return;
      }
      
      // 创建选择对话框
      const dialog = document.createElement('div');
      dialog.className = 'export-selection-dialog';
      dialog.style.position = 'fixed';
      dialog.style.top = '0';
      dialog.style.left = '0';
      dialog.style.width = '100%';
      dialog.style.height = '100%';
      dialog.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      dialog.style.display = 'flex';
      dialog.style.justifyContent = 'center';
      dialog.style.alignItems = 'center';
      dialog.style.zIndex = '1000';
      
      // 对话框内容
      const dialogContent = document.createElement('div');
      dialogContent.style.backgroundColor = '#2a2a2a';
      dialogContent.style.padding = '20px';
      dialogContent.style.borderRadius = '8px';
      dialogContent.style.maxWidth = '500px';
      dialogContent.style.maxHeight = '80vh';
      dialogContent.style.overflowY = 'auto';
      dialogContent.style.color = '#fff';
      
      // 标题
      const title = document.createElement('h3');
      title.textContent = 'Select Configuration Groups to Export';
      title.style.marginTop = '0';
      dialogContent.appendChild(title);
      
      // 复选框容器
      const checkboxContainer = document.createElement('div');
      checkboxContainer.style.marginBottom = '20px';
      
      // 为每个配置组创建复选框
      const checkboxes: HTMLInputElement[] = [];
      appConfig.settings.forEach((setting, index) => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.style.marginBottom = '10px';
        checkboxDiv.style.display = 'flex';
        checkboxDiv.style.alignItems = 'center';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `config-group-${index}`;
        checkbox.checked = selectedGroups.includes(index); // 默认选中当前选中的组
        checkbox.style.marginRight = '10px';
        checkboxes.push(checkbox);
        
        const label = document.createElement('label');
        label.htmlFor = `config-group-${index}`;
        label.textContent = setting.name;
        label.style.color = '#fff';
        
        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(label);
        checkboxContainer.appendChild(checkboxDiv);
      });
      
      dialogContent.appendChild(checkboxContainer);
      
      // 按钮容器
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'flex-end';
      buttonContainer.style.gap = '10px';
      
      // 取消按钮
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.padding = '8px 16px';
      cancelBtn.style.backgroundColor = '#666';
      cancelBtn.style.color = '#fff';
      cancelBtn.style.border = 'none';
      cancelBtn.style.borderRadius = '4px';
      cancelBtn.style.cursor = 'pointer';
      cancelBtn.addEventListener('click', () => {
        document.body.removeChild(dialog);
      });
      
      // 导出按钮
      const exportBtn = document.createElement('button');
      exportBtn.textContent = 'Export Selected';
      exportBtn.style.padding = '8px 16px';
      exportBtn.style.backgroundColor = '#4a9eff';
      exportBtn.style.color = '#fff';
      exportBtn.style.border = 'none';
      exportBtn.style.borderRadius = '4px';
      exportBtn.style.cursor = 'pointer';
      exportBtn.addEventListener('click', () => {
        // 收集选中的配置组
        const selectedSettings: Setting[] = [];
        checkboxes.forEach((checkbox, index) => {
          if (checkbox.checked) {
            selectedSettings.push(appConfig.settings[index]);
          }
        });
        
        if (selectedSettings.length === 0) {
          showNotification('Please select at least one configuration group to export.', 'warning');
          return;
        }
        
        // 创建导出配置对象
        const exportConfig: AppConfig = {
          browserSync: appConfig.browserSync,
          settings: selectedSettings
        };
        
        try {
          // 导出配置
          const configStr = JSON.stringify(exportConfig, null, 2);
          const filename = selectedSettings.length === 1 
            ? `enveil-config-${selectedSettings[0].name}.json`
            : `enveil-config-selected-${new Date().toISOString().slice(0, 10)}.json`;
          downloadJSON(configStr, filename);
          
          // 显示成功通知
          showNotification(
            `Successfully exported ${selectedSettings.length} configuration group(s)!`,
            'success'
          );
          
          // 关闭对话框
          document.body.removeChild(dialog);
        } catch (error) {
          // 显示错误通知
          showNotification(
            'Failed to export selected configurations: ' + (error instanceof Error ? error.message : 'Unknown error'),
            'error'
          );
        }
      });
      
      buttonContainer.appendChild(cancelBtn);
      buttonContainer.appendChild(exportBtn);
      dialogContent.appendChild(buttonContainer);
      
      dialog.appendChild(dialogContent);
      document.body.appendChild(dialog);
      
      // 点击对话框外部关闭
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          document.body.removeChild(dialog);
        }
      });
    }
    
    // 导入配置函数
    function importConfig(event: Event) {
      const input = event.target as HTMLInputElement;
      if (!input.files || input.files.length === 0) {
        return;
      }
      
      const file = input.files[0];
      
      // 验证文件类型
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        showNotification('Please select a JSON file for import.', 'error');
        input.value = '';
        return;
      }
      
      // 确认导入操作
      if (!confirm(`Are you sure you want to import configuration from ${file.name}?`)) {
        input.value = '';
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          // 清空文件输入，以便用户可以再次导入相同的文件
          input.value = '';
          
          // 解析JSON文件
          const fileContent = e.target?.result as string;
          const importedConfig = JSON.parse(fileContent) as AppConfig;
          
          // 验证配置格式
          if (!validateConfig(importedConfig)) {
            showNotification('Invalid configuration file format. Please select a valid Enveil configuration file.', 'error');
            return;
          }
          
          // 询问用户导入策略
          const importMode = confirm(
            'Do you want to REPLACE existing configuration or MERGE with existing?\n' +
            'OK = REPLACE, Cancel = MERGE'
          );
          
          if (importMode) {
            // 替换模式：完全替换现有配置
            if (appConfig.settings.length > 0) {
              if (!confirm('This will replace all your existing configurations. Are you sure?')) {
                return;
              }
            }
            appConfig = importedConfig;
          } else {
            // 合并模式：保留现有配置，添加导入的配置组（避免名称冲突）
            let hasChanges = false;
            importedConfig.settings.forEach(importedSetting => {
              // 检查是否有同名配置组
              const existingIndex = appConfig.settings.findIndex(
                setting => setting.name === importedSetting.name
              );
              
              if (existingIndex !== -1) {
                // 如果存在同名配置组，询问用户如何处理
                const replaceExisting = confirm(
                  `Configuration group "${importedSetting.name}" already exists.\n` +
                  'Do you want to replace it with the imported one?'
                );
                
                if (replaceExisting) {
                  appConfig.settings[existingIndex] = importedSetting;
                  hasChanges = true;
                }
              } else {
                // 如果不存在同名配置组，直接添加
                appConfig.settings.push(importedSetting);
                hasChanges = true;
              }
            });
            
            // 检查browserSync设置是否变更
            if (appConfig.browserSync !== importedConfig.browserSync) {
              const changeBrowserSync = confirm(
                `Imported configuration has different Browser Sync setting.\n` +
                `Current: ${appConfig.browserSync ? 'Enabled' : 'Disabled'}\n` +
                `Imported: ${importedConfig.browserSync ? 'Enabled' : 'Disabled'}\n` +
                'Do you want to update it?'
              );
              
              if (changeBrowserSync) {
                appConfig.browserSync = importedConfig.browserSync;
                hasChanges = true;
              }
            }
            
            if (!hasChanges) {
              showNotification('No changes were made during import.', 'warning');
              return;
            }
          }
          
          // 保存配置并更新UI
          saveConfig();
          updateConfigDisplay();
          
          // 显示成功通知
          showNotification('Configuration imported successfully!', 'success');
        } catch (error) {
          // 详细的错误处理
          if (error instanceof SyntaxError) {
            showNotification('Invalid JSON file format. Please check the file and try again.', 'error');
          } else {
            showNotification('Error importing configuration: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
          }
        }
      };
      
      reader.onerror = () => {
        showNotification('Error reading the file. Please try again.', 'error');
        input.value = '';
      };
      
      reader.readAsText(file);
    }
    
    // 验证配置格式函数
    function validateConfig(config: any): boolean {
      // 检查必要的属性
      if (!config || typeof config !== 'object') {
        return false;
      }
      
      // 检查browserSync属性
      if (typeof config.browserSync !== 'boolean') {
        return false;
      }
      
      // 检查settings数组
      if (!Array.isArray(config.settings)) {
        return false;
      }
      
      // 验证每个设置项
      for (const setting of config.settings) {
        if (!setting || typeof setting !== 'object') {
          return false;
        }
        
        // 检查必要的设置属性
        if (typeof setting.name !== 'string' || typeof setting.enable !== 'boolean') {
          return false;
        }
        
        // 检查sites数组
        if (!Array.isArray(setting.sites)) {
          return false;
        }
        
        // 验证每个站点配置
        for (const site of setting.sites) {
          if (!site || typeof site !== 'object') {
            return false;
          }
          
          // 检查站点配置的必要属性
          const requiredSiteProps = [
            { name: 'enable', type: 'boolean' },
            { name: 'matchPattern', type: 'string' },
            { name: 'matchValue', type: 'string' },
            { name: 'envName', type: 'string' },
            { name: 'color', type: 'string' },
            { name: 'backgroudEnable', type: 'boolean' },
            { name: 'Position', type: 'string' },
            { name: 'flagEnable', type: 'boolean' }
          ];
          
          for (const prop of requiredSiteProps) {
            if (typeof site[prop.name] !== prop.type) {
              return false;
            }
          }
        }
      }
      
      return true;
    }
    
    // 下载JSON文件辅助函数
    function downloadJSON(jsonStr: string, filename: string) {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

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

    // Use first selected group if available, otherwise default
    const targetGroupIndex = selectedGroups.length > 0 ? selectedGroups[0] : 0;
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
      if (selectedGroups.includes(index)) {
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

      // Edit Button
      const editBtn = document.createElement('button');
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.className = 'group-edit-btn';
      editBtn.style.background = 'none';
      editBtn.style.border = 'none';
      editBtn.style.cursor = 'pointer';
      editBtn.style.marginLeft = '10px';
      editBtn.style.color = '#fff';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Edit functionality will be implemented in the next task
        console.log('Edit group:', index);
        
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

      // Delete Button
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.className = 'group-delete-btn';
      deleteBtn.style.background = 'none';
      deleteBtn.style.border = 'none';
      deleteBtn.style.cursor = 'pointer';
      deleteBtn.style.marginLeft = '5px';
      deleteBtn.style.color = '#fff';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete this config group?`)) {
          // 删除配置组数据
          appConfig.settings.splice(index, 1);
          
          // 更新选中的组索引数组
          selectedGroups = selectedGroups
            .filter(selectedIndex => selectedIndex !== index)
            .map(selectedIndex => selectedIndex > index ? selectedIndex - 1 : selectedIndex);
          
          // 更新显示并保存配置
          updateConfigDisplay();
          saveConfig();
        }
      });

      groupItem.appendChild(switchContainer);
      groupItem.appendChild(nameSpan);
      groupItem.appendChild(editBtn);
      groupItem.appendChild(deleteBtn);

      groupItem.addEventListener('click', () => {
        // 切换选中状态
        const selectedIndex = selectedGroups.indexOf(index);
        if (selectedIndex > -1) {
          // 如果已选中，则取消选中
          selectedGroups.splice(selectedIndex, 1);
        } else {
          // 如果未选中，则添加到选中列表
          selectedGroups.push(index);
        }
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

      // 组标题和开关容器
      const titleSwitchContainer = document.createElement('div');
      titleSwitchContainer.style.display = 'flex';
      titleSwitchContainer.style.alignItems = 'center';
      titleSwitchContainer.style.gap = '10px';

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

      // 组标题
      const groupTitle = document.createElement('div');
      groupTitle.className = 'config-group-title';
      groupTitle.textContent = setting.name;

      // 添加标题和开关到容器
      titleSwitchContainer.appendChild(enableSwitchContainer);
      titleSwitchContainer.appendChild(groupTitle);

      // 组操作区
      const groupActions = document.createElement('div');
      groupActions.className = 'config-group-actions';

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
        saveConfig();
      });

      groupActions.appendChild(addSiteBtn);

      groupHeader.appendChild(titleSwitchContainer);
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
          enableCell.style.display = 'flex';
          enableCell.style.alignItems = 'center';
          enableCell.style.justifyContent = 'center';
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
            site.backgroudEnable,
            false // Disable persistence
          );
          bgSwitch.onChange((checked) => {
            site.backgroudEnable = checked;
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