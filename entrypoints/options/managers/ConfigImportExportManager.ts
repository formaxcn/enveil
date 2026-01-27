import { AppConfig, Setting } from '../types';

// 声明chrome对象
declare const chrome: any;

export class ConfigImportExportManager {
  private appConfig: AppConfig;
  private notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  private saveConfigCallback: () => void;
  private updateConfigCallback: (newConfig: AppConfig) => void;

  constructor(
    appConfig: AppConfig,
    notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void,
    saveConfigCallback: () => void,
    updateConfigCallback: (newConfig: AppConfig) => void
  ) {
    this.appConfig = appConfig;
    this.notificationCallback = notificationCallback;
    this.saveConfigCallback = saveConfigCallback;
    this.updateConfigCallback = updateConfigCallback;
  }

  // 更新配置引用
  public updateConfig(config: AppConfig): void {
    this.appConfig = config;
  }

  // 初始化导入导出功能
  public initImportExportUI(): void {
    // 导出配置
    const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExport());
    }
    
    // 导入配置
    const importInput = document.getElementById('import-btn') as HTMLInputElement;
    if (importInput) {
      importInput.addEventListener('change', (event) => this.importConfig(event));
    }
  }

  // 统一导出处理函数
  public handleExport(): void {
    // 如果没有配置组，提示用户
    if (this.appConfig.settings.length === 0) {
      this.notificationCallback('No configuration groups available for export.', 'warning');
      return;
    }
    
    // 全局导出按钮应该总是导出所有配置
    this.exportAllConfig();
  }

  // 导出全部配置函数
  public exportAllConfig(): void {
    try {
      const configStr = JSON.stringify(this.appConfig, null, 2);
      this.downloadJSON(configStr, 'enveil.json');
      
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
    
    // 检查文件名类型
    const isGroupFile = file.name.includes('enveil.group.json');
    const isFullConfigFile = file.name.includes('enveil.json');
    
    let confirmMessage = `Are you sure you want to import configuration from ${file.name}?`;
    if (isFullConfigFile) {
      confirmMessage += '\n\nThis will overwrite all existing configurations!';
    } else if (isGroupFile) {
      confirmMessage += '\n\nThis group will be added to your existing configurations.';
    }
    
    // 确认导入操作
    if (!confirm(confirmMessage)) {
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
        const importedData = JSON.parse(fileContent);
        
        if (isFullConfigFile || (!isGroupFile && this.validateConfig(importedData))) {
          // 处理完整配置文件 (enveil.json)
          this.handleFullConfigImport(importedData);
        } else if (isGroupFile || this.validateGroupConfig(importedData)) {
          // 处理组配置文件 (enveil.group.json)
          this.handleGroupConfigImport(importedData);
        } else {
          this.notificationCallback('Invalid configuration file format. Please select a valid Enveil configuration file.', 'error');
          return;
        }
        
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

  // 处理完整配置导入
  private handleFullConfigImport(importedConfig: AppConfig): void {
    // 验证配置格式
    if (!this.validateConfig(importedConfig)) {
      this.notificationCallback('Invalid configuration file format. Please select a valid Enveil configuration file.', 'error');
      return;
    }
    
    // 处理旧的browserSync对象格式，转换为新的布尔值格式
    const importedBrowserSync = typeof importedConfig.browserSync === 'boolean' 
      ? importedConfig.browserSync 
      : (importedConfig.browserSync && typeof importedConfig.browserSync === 'object' && (importedConfig.browserSync as any).enable) || false;
    
    // 确认会覆盖所有配置
    if (!confirm('This will overwrite ALL existing configurations including default colors and all groups. Are you sure?')) {
      return;
    }
    
    // 完全替换配置
    this.appConfig = {
      browserSync: importedBrowserSync,
      defaultColors: importedConfig.defaultColors || this.appConfig.defaultColors,
      settings: importedConfig.settings
    };
    
    // 更新配置
    this.updateConfigCallback(this.appConfig);
    
    // 显示成功通知
    this.notificationCallback('Full configuration imported successfully!', 'success');
  }

  // 处理组配置导入
  private handleGroupConfigImport(importedData: any): void {
    if (!importedData.settings || !Array.isArray(importedData.settings)) {
      this.notificationCallback('Invalid group configuration file format.', 'error');
      return;
    }
    
    // 将导入的组添加到现有配置的末尾
    let addedGroups = 0;
    importedData.settings.forEach((importedSetting: any) => {
      if (this.validateSetting(importedSetting)) {
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
            addedGroups++;
          }
        } else {
          // 如果不存在同名配置组，直接添加到末尾
          this.appConfig.settings.push(importedSetting);
          addedGroups++;
        }
      }
    });
    
    if (addedGroups === 0) {
      this.notificationCallback('No valid groups were imported.', 'warning');
      return;
    }
    
    // 更新配置
    this.updateConfigCallback(this.appConfig);
    
    // 显示成功通知
    this.notificationCallback(`Successfully imported ${addedGroups} group(s)!`, 'success');
  }

  // 验证组配置格式
  private validateGroupConfig(config: any): boolean {
    if (!config || typeof config !== 'object') {
      return false;
    }
    
    // 检查settings数组
    if (!Array.isArray(config.settings)) {
      return false;
    }
    
    // 验证每个设置项
    return config.settings.every((setting: any) => this.validateSetting(setting));
  }

  // 验证单个设置项
  private validateSetting(setting: any): boolean {
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
    
    return true;
  }

  // 验证配置格式函数
  public validateConfig(config: any): boolean {
    // 检查必要的属性
    if (!config || typeof config !== 'object') {
      return false;
    }
    
    // 检查browserSync属性（支持旧的对象格式和新的布尔值格式）
    const isBrowserSyncValid = typeof config.browserSync === 'boolean' || 
      (typeof config.browserSync === 'object' && typeof config.browserSync.enable === 'boolean');
    if (!isBrowserSyncValid) {
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

  // 备份配置（只备份sync相关信息，不处理config group）
  public backupConfig(): void {
    try {
      // 创建备份对象，只包含browserSync
      const backupData = {
        browserSync: this.appConfig.browserSync
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
        
        // 只恢复browserSync字段
        if (backupData.browserSync !== undefined) {
          this.appConfig.browserSync = backupData.browserSync;
        }
        
        // 更新配置
        this.updateConfigCallback(this.appConfig);
        
        this.notificationCallback('配置恢复成功', 'success');
      } catch (error) {
        this.notificationCallback('恢复失败: ' + (error instanceof Error ? error.message : String(error)), 'error');
      }
    };
    
    fileInput.click();
  }
}