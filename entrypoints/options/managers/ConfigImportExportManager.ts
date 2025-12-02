import { AppConfig, Setting } from '../types';

// 声明chrome对象
declare const chrome: any;

export class ConfigImportExportManager {
  private appConfig: AppConfig;
  private notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  private selectedGroups: number[];
  private updateConfigDisplayCallback: () => void;

  constructor(
    appConfig: AppConfig,
    notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void,
    selectedGroups: number[],
    updateConfigDisplayCallback: () => void
  ) {
    this.appConfig = appConfig;
    this.notificationCallback = notificationCallback;
    this.selectedGroups = selectedGroups;
    this.updateConfigDisplayCallback = updateConfigDisplayCallback;
  }

  // 更新配置引用
  public updateConfig(config: AppConfig): void {
    this.appConfig = config;
  }

  // 更新选中的配置组
  public updateSelectedGroups(groups: number[]): void {
    this.selectedGroups = groups;
  }

  // 初始化导入导出功能
  public initImportExport(): void {
    // 导出配置（根据选择状态决定导出全部或选定）
    const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExport());
    }
    
    // 导入配置
    const importBtn = document.getElementById('import-btn') as HTMLInputElement;
    if (importBtn) {
      importBtn.addEventListener('change', (event) => this.importConfig(event));
    }
  }

  // 统一导出处理函数
  public handleExport(): void {
    // 如果没有配置组，提示用户
    if (this.appConfig.settings.length === 0) {
      this.notificationCallback('No configuration groups available for export.', 'warning');
      return;
    }
    
    // 检查是否有配置组被选中
    if (this.selectedGroups.length > 0) {
      // 如果有选中的配置组，导出选中的配置
      const selectedSettings = this.selectedGroups.map(index => this.appConfig.settings[index]);
      this.exportSelectedConfigs(selectedSettings);
    } else {
      // 否则导出所有配置
      this.exportAllConfig();
    }
  }

  // 导出全部配置函数
  public exportAllConfig(): void {
    // 确认导出全部配置
    if (!confirm('Are you sure you want to export all configurations?')) {
      return;
    }
    
    try {
      const configStr = JSON.stringify(this.appConfig, null, 2);
      this.downloadJSON(configStr, 'enveil-config-all.json');
      
      // 显示成功通知
      this.notificationCallback('All configurations exported successfully!', 'success');
    } catch (error) {
      // 显示错误通知
      this.notificationCallback(
        'Failed to export configurations: ' + (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      );
    }
  }

  // 导出选定配置函数
  public exportSelectedConfigs(selectedGroups: Setting[]): void {
    try {
      // 创建导出配置对象
      const exportConfig = {
        settings: selectedGroups,
        browserSync: this.appConfig.browserSync
      };
      
      // 生成文件名
      const filename = selectedGroups.length === 1 
        ? `enveil-config-${selectedGroups[0].name}.json`
        : 'enveil-config-selected.json';
      
      // 下载文件
      const configStr = JSON.stringify(exportConfig, null, 2);
      this.downloadJSON(configStr, filename);
      
      // 显示成功通知
      this.notificationCallback(
        `${selectedGroups.length} configuration group(s) exported successfully!`,
        'success'
      );
    } catch (error) {
      // 显示错误通知
      this.notificationCallback(
        'Failed to export selected configurations: ' + (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      );
    }
  }

  // 导出所选配置函数（支持手动选择）
  public exportSelectedConfig(): void {
    // 如果没有配置组，提示用户
    if (this.appConfig.settings.length === 0) {
      this.notificationCallback('No configuration groups available for export.', 'warning');
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
    this.appConfig.settings.forEach((setting, index) => {
      const checkboxDiv = document.createElement('div');
      checkboxDiv.style.marginBottom = '10px';
      checkboxDiv.style.display = 'flex';
      checkboxDiv.style.alignItems = 'center';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `config-group-${index}`;
      checkbox.checked = this.selectedGroups.includes(index); // 默认选中当前选中的组
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
          selectedSettings.push(this.appConfig.settings[index]);
        }
      });
      
      if (selectedSettings.length === 0) {
        this.notificationCallback('Please select at least one configuration group to export.', 'warning');
        return;
      }
      
      // 创建导出配置对象
      const exportConfig: AppConfig = {
        browserSync: this.appConfig.browserSync,
        settings: selectedSettings
      };
      
      try {
        // 导出配置
        const configStr = JSON.stringify(exportConfig, null, 2);
        const filename = selectedSettings.length === 1 
          ? `enveil-config-${selectedSettings[0].name}.json`
          : `enveil-config-selected-${new Date().toISOString().slice(0, 10)}.json`;
        this.downloadJSON(configStr, filename);
        
        // 显示成功通知
        this.notificationCallback(
          `Successfully exported ${selectedSettings.length} configuration group(s)!`,
          'success'
        );
        
        // 关闭对话框
        document.body.removeChild(dialog);
      } catch (error) {
        // 显示错误通知
        this.notificationCallback(
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
  public importConfig(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    
    const file = input.files[0];
    
    // 验证文件类型
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      this.notificationCallback('Please select a JSON file for import.', 'error');
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
        if (!this.validateConfig(importedConfig)) {
          this.notificationCallback('Invalid configuration file format. Please select a valid Enveil configuration file.', 'error');
          return;
        }
        
        // 询问用户导入策略
        const importMode = confirm(
          'Do you want to REPLACE existing configuration or MERGE with existing?\n' +
          'OK = REPLACE, Cancel = MERGE'
        );
        
        if (importMode) {
          // 替换模式：完全替换现有配置
          if (this.appConfig.settings.length > 0) {
            if (!confirm('This will replace all your existing configurations. Are you sure?')) {
              return;
            }
          }
          this.appConfig = importedConfig;
        } else {
          // 合并模式：保留现有配置，添加导入的配置组（避免名称冲突）
          let hasChanges = false;
          importedConfig.settings.forEach(importedSetting => {
            // 检查是否有同名配置组
            const existingIndex = this.appConfig.settings.findIndex(
              setting => setting.name === importedSetting.name
            );
            
            if (existingIndex !== -1) {
              // 如果存在同名配置组，询问用户如何处理
              const replaceExisting = confirm(
                `Configuration group "${importedSetting.name}" already exists.\n` +
                'Do you want to replace it with the imported one?'
              );
              
              if (replaceExisting) {
                this.appConfig.settings[existingIndex] = importedSetting;
                hasChanges = true;
              }
            } else {
              // 如果不存在同名配置组，直接添加
              this.appConfig.settings.push(importedSetting);
              hasChanges = true;
            }
          });
          
          // 检查browserSync设置是否变更
          if (this.appConfig.browserSync !== importedConfig.browserSync) {
            const changeBrowserSync = confirm(
              `Imported configuration has different Browser Sync setting.\n` +
              `Current: ${this.appConfig.browserSync ? 'Enabled' : 'Disabled'}\n` +
              `Imported: ${importedConfig.browserSync ? 'Enabled' : 'Disabled'}\n` +
              'Do you want to update it?'
            );
            
            if (changeBrowserSync) {
              this.appConfig.browserSync = importedConfig.browserSync;
              hasChanges = true;
            }
          }
          
          if (!hasChanges) {
            this.notificationCallback('No changes were made during import.', 'warning');
            return;
          }
        }
        
        // 更新UI
        this.updateConfigDisplayCallback();
        
        // 显示成功通知
        this.notificationCallback('Configuration imported successfully!', 'success');
      } catch (error) {
        // 详细的错误处理
        if (error instanceof SyntaxError) {
          this.notificationCallback('Invalid JSON file format. Please check the file and try again.', 'error');
        } else {
          this.notificationCallback('Error importing configuration: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
        }
      }
    };
    
    reader.onerror = () => {
      this.notificationCallback('Error reading the file. Please try again.', 'error');
      input.value = '';
    };
    
    reader.readAsText(file);
  }

  // 验证配置格式函数
  public validateConfig(config: any): boolean {
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
  public downloadJSON(jsonStr: string, filename: string): void {
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

  // 备份配置（只备份git和sync相关信息，不处理config group）
  public backupConfig(): void {
    try {
      // 创建备份对象，只包含browserSync和gitConfig
      const backupData = {
        browserSync: this.appConfig.browserSync,
        gitConfig: this.appConfig.gitConfig
      };
      
      // 将对象转换为JSON字符串
      const jsonStr = JSON.stringify(backupData, null, 2);
      
      // 创建文件名
      const fileName = `enveil-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      // 使用现有的downloadJSON函数下载备份文件
      this.downloadJSON(jsonStr, fileName);
      
      this.notificationCallback('配置备份成功', 'success');
    } catch (error) {
      this.notificationCallback('备份失败: ' + (error instanceof Error ? error.message : String(error)), 'error');
    }
  }

  // 恢复配置（只恢复git和sync相关信息，不处理config group）
  public restoreConfig(): void {
    // 创建文件选择器
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';
    
    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const content = await file.text();
        const backupData = JSON.parse(content);
        
        // 只恢复browserSync和gitConfig字段
        if (backupData.browserSync !== undefined) {
          this.appConfig.browserSync = backupData.browserSync;
        }
        
        if (backupData.gitConfig) {
          this.appConfig.gitConfig = backupData.gitConfig;
        }
        
        // 更新UI
        this.updateConfigDisplayCallback();
        
        this.notificationCallback('配置恢复成功', 'success');
      } catch (error) {
        this.notificationCallback('恢复失败: ' + (error instanceof Error ? error.message : String(error)), 'error');
      }
    };
    
    fileInput.click();
  }
}