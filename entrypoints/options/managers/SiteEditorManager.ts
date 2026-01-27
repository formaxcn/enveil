import { AppConfig, SiteConfig, Setting, GroupDefaults } from '../types';
import { AddSiteModal } from '../../../components/AddSiteModal';
import { AddGroupModal } from '../../../components/AddGroupModal';
import { SwitchComponent } from '../../../components/SwitchComponent';

// 声明chrome对象
declare const chrome: any;

export class SiteEditorManager {
  private appConfig: AppConfig;
  private notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  private saveConfigCallback: () => void;
  private addSiteModal: AddSiteModal;
  private addGroupModal: AddGroupModal;

  constructor(
    appConfig: AppConfig,
    notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void,
    saveConfigCallback: () => void
  ) {
    this.appConfig = appConfig;
    this.notificationCallback = notificationCallback;
    this.saveConfigCallback = saveConfigCallback;
    this.addSiteModal = new AddSiteModal();
    this.addGroupModal = new AddGroupModal();
    this.initAddSiteModal();
  }

  // 更新配置引用
  public updateConfig(config: AppConfig): void {
    this.appConfig = config;
  }

  // 初始化添加网站模态框
  private initAddSiteModal(): void {
    this.addSiteModal.onSave((site: SiteConfig) => {
      // 添加到默认组（索引为0）
      if (!this.appConfig.settings[0]) {
        // 如果默认组不存在，创建它
        this.appConfig.settings.push({
          name: "default",
          enable: true,
          sites: [],
          defaults: {
            envName: 'dev',
            backgroundEnable: false,
            flagEnable: false,
            color: '#4a9eff'
          }
        });
      }

      // Use first group (index 0) as default, or create default group if none exists
      if (!this.appConfig.settings[0]) {
        // 如果默认组不存在，创建它
        this.appConfig.settings.push({
          name: "default",
          enable: true,
          sites: [],
          defaults: {
            envName: 'dev',
            backgroundEnable: false,
            flagEnable: false,
            color: '#4a9eff'
          }
        });
      }

      // Add to first group
      this.appConfig.settings[0].sites.push(site);

      this.updateConfigDisplay();
      this.saveConfigCallback();
    });
  }

  // 初始化网站编辑相关UI
  public initSiteEditorUI(): void {
    // 绑定浮动添加按钮点击事件
    const floatingAddButton = document.querySelector('.floating-add-button') as HTMLButtonElement;
    if (floatingAddButton) {
      floatingAddButton.addEventListener('click', () => {
        this.openAddSiteModal();
      });
    }

    // 绑定添加配置组按钮事件
    const addConfigGroupBtn = document.getElementById('add-config-group') as HTMLButtonElement;
    if (addConfigGroupBtn) {
      console.log('Attaching click event to add-config-group button');
      addConfigGroupBtn.addEventListener('click', (e) => {
        console.log('Add config group button clicked');
        e.preventDefault();
        e.stopPropagation();
        this.addConfigGroup();
      });
    } else {
      console.error('Could not find add-config-group button');
    }

    // 初始渲染配置显示
    this.updateConfigDisplay();
  }

  // 更新配置显示
  public updateConfigDisplay(): void {
    this.renderConfigGroups();
  }

  // 渲染配置组内容
  private renderConfigGroups(): void {
    const configGroupsContainer = document.getElementById('config-groups-container') as HTMLDivElement;
    if (!configGroupsContainer) return;

    configGroupsContainer.innerHTML = '';

    // 渲染所有配置组，而不是只渲染选中的
    if (this.appConfig.settings.length > 0) {
      console.log(`Rendering ${this.appConfig.settings.length} config groups`);
      this.appConfig.settings.forEach((setting, index) => {
        const groupElement = this.createConfigGroupElement(setting, index);
        configGroupsContainer.appendChild(groupElement);
      });
    } else {
      // 如果没有配置组，显示空状态
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <p>No configuration groups found.</p>
        <p>Click the "Add Group" button to add your first configuration group.</p>
      `;
      configGroupsContainer.appendChild(emptyState);
    }
  }

  // 创建单个配置组元素
  private createConfigGroupElement(setting: Setting, groupIndex: number): HTMLDivElement {
    const groupElement = document.createElement('div');
    groupElement.className = 'config-group';
    groupElement.dataset.groupIndex = groupIndex.toString();

    // 配置组标题和操作栏
    const groupHeader = document.createElement('div');
    groupHeader.className = 'group-header';

    // 组名称和开关
    const headerLeft = document.createElement('div');
    headerLeft.className = 'group-header-left';

    // 启用/禁用开关
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'group-toggle-container';

    const configSwitch = new SwitchComponent(toggleContainer, '', `group-${groupIndex}-enable`, 'sync', setting.enable, false);
    configSwitch.onChange((checked) => {
      setting.enable = checked;
      this.saveConfigCallback();
    });

    const groupTitle = document.createElement('h3');
    groupTitle.className = 'group-title-text';
    groupTitle.innerHTML = `${setting.name} <span class="site-count">(${setting.sites.length} sites)</span>`;
    groupTitle.title = 'Click to rename group';
    groupTitle.style.cursor = 'pointer';
    groupTitle.addEventListener('click', () => {
      this.editConfigGroupName(groupIndex);
    });

    headerLeft.appendChild(toggleContainer);
    headerLeft.appendChild(groupTitle);

    // 组操作按钮
    const headerActions = document.createElement('div');
    headerActions.className = 'group-header-actions';

    // 添加配置按钮
    const addSiteBtn = document.createElement('button');
    addSiteBtn.className = 'add-site-btn';
    addSiteBtn.innerHTML = '<i class="fas fa-plus"></i> Add Config';
    addSiteBtn.title = 'Add configuration to this group';
    addSiteBtn.addEventListener('click', () => {
      this.openAddSiteModal();
    });

    // 编辑配置组名称按钮
    const editBtn = document.createElement('button');
    editBtn.className = 'group-edit-btn';
    editBtn.textContent = '✏️';
    editBtn.title = 'Edit group name';
    editBtn.addEventListener('click', () => {
      this.editConfigGroupName(groupIndex);
    });

    // 删除配置组按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'group-delete-btn';
    deleteBtn.textContent = '🗑️';
    deleteBtn.title = 'Delete group';
    deleteBtn.addEventListener('click', () => {
      this.deleteConfigGroup(groupIndex);
    });

    // 导出配置组按钮
    const exportBtn = document.createElement('button');
    exportBtn.className = 'group-export-btn';
    exportBtn.innerHTML = '<i class="fas fa-download"></i>';
    exportBtn.title = 'Export this group';
    exportBtn.addEventListener('click', () => {
      this.exportConfigGroup(groupIndex);
    });

    headerActions.appendChild(addSiteBtn);
    headerActions.appendChild(editBtn);
    headerActions.appendChild(exportBtn);
    headerActions.appendChild(deleteBtn);

    groupHeader.appendChild(headerLeft);
    groupHeader.appendChild(headerActions);

    // 网站列表容器
    const sitesList = document.createElement('div');
    sitesList.className = 'sites-list';

    // 如果没有网站，显示空状态
    if (setting.sites.length === 0) {
      const emptySites = document.createElement('div');
      emptySites.className = 'empty-sites';
      emptySites.innerHTML = `
        <p>No sites configured in this group.</p>
        <p>Click the "+" button to add your first site.</p>
      `;
      sitesList.appendChild(emptySites);
    } else {
      // 渲染每个网站配置
      setting.sites.forEach((site, siteIndex) => {
        const siteElement = this.createSiteElement(site, groupIndex, siteIndex);
        sitesList.appendChild(siteElement);
      });
    }

    groupElement.appendChild(groupHeader);
    groupElement.appendChild(sitesList);

    return groupElement;
  }

  // 创建单个网站元素
  private createSiteElement(site: SiteConfig, groupIndex: number, siteIndex: number): HTMLDivElement {
    const siteElement = document.createElement('div');
    siteElement.className = `site-item ${site.enable ? 'enabled' : 'disabled'}`;
    siteElement.dataset.groupIndex = groupIndex.toString();
    siteElement.dataset.siteIndex = siteIndex.toString();

    // 启用/禁用开关
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'site-toggle-container';

    const siteSwitch = new SwitchComponent(toggleContainer, '', `site-${groupIndex}-${siteIndex}-enable`, 'sync', site.enable, false);
    siteSwitch.onChange((checked) => {
      site.enable = checked;
      this.saveConfigCallback();
      this.updateConfigDisplay();
    });

    // 映射matchPattern到友好名称
    const getFriendlyMatchPattern = (pattern: string): string => {
      const patternMap: Record<string, string> = {
        'everything': 'Everything',
        'url': 'Full URL',
        'urlPrefix': 'Starts with',
        'domain': 'Domain',
        'regex': 'Regex Match'
      };
      return patternMap[pattern] || pattern;
    };

    // 网站信息
    const siteInfo = document.createElement('div');
    siteInfo.className = 'site-info';
    siteInfo.innerHTML = `
      <div class="site-main-info">
        <span class="site-env-name" style="background-color: ${site.color}">${site.envName}</span>
        <span class="site-match">${getFriendlyMatchPattern(site.matchPattern)}: ${site.matchValue}</span>
      </div>
      <div class="site-details">
        <span class="site-detail-item">Background: ${site.backgroudEnable ? 'Yes' : 'No'}</span>
        <span class="site-detail-item">Position: ${site.Position}</span>
        <span class="site-detail-item">Flag: ${site.flagEnable ? 'Yes' : 'No'}</span>
      </div>
    `;

    // 操作按钮
    const actionButtons = document.createElement('div');
    actionButtons.className = 'site-actions';

    // 编辑按钮
    const editBtn = document.createElement('button');
    editBtn.className = 'site-edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => {
      this.editSite(groupIndex, siteIndex);
    });

    // 删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'site-delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      this.deleteSite(groupIndex, siteIndex);
    });

    actionButtons.appendChild(editBtn);
    actionButtons.appendChild(deleteBtn);

    siteElement.appendChild(toggleContainer);
    siteElement.appendChild(siteInfo);
    siteElement.appendChild(actionButtons);

    return siteElement;
  }

  // 添加配置组
  private addConfigGroup(): void {
    console.log('addConfigGroup method start');

    this.addGroupModal.open(this.appConfig.defaultColors, '', undefined, (trimmedName: string, defaults: GroupDefaults) => {
      console.log('Modal result:', trimmedName, defaults);

      // 检查名称是否已存在
      if (this.appConfig.settings.some(setting => setting.name === trimmedName)) {
        this.notificationCallback('Configuration group with this name already exists', 'error');
        return;
      }

      // 添加新的配置组
      const newGroup: Setting = {
        name: trimmedName,
        enable: true,
        sites: [],
        defaults: defaults
      };

      this.appConfig.settings.push(newGroup);
      console.log('New group added to appConfig.settings. Total groups:', this.appConfig.settings.length);

      // 选中新添加的配置组 - 移除这个概念，不需要选中
      // const newGroupIndex = this.appConfig.settings.length - 1;
      // this.selectedGroups = [newGroupIndex];

      this.updateConfigDisplay();
      this.saveConfigCallback();
      this.notificationCallback(`Configuration group "${trimmedName}" added successfully`, 'success');
    });
  }

  // 编辑配置组名称
  private editConfigGroupName(groupIndex: number): void {
    const setting = this.appConfig.settings[groupIndex];
    if (!setting) return;

    this.addGroupModal.open(this.appConfig.defaultColors, setting.name, setting.defaults, (trimmedName: string, defaults: GroupDefaults) => {
      // 检查新名称是否已被其他组使用
      if (this.appConfig.settings.some((s, index) => s.name === trimmedName && index !== groupIndex)) {
        this.notificationCallback('Configuration group with this name already exists', 'error');
        return;
      }

      setting.name = trimmedName;
      setting.defaults = defaults;
      this.updateConfigDisplay();
      this.saveConfigCallback();
      this.notificationCallback('Configuration group updated successfully', 'success');
    });
  }

  // 删除配置组
  private deleteConfigGroup(groupIndex: number): void {
    if (this.appConfig.settings.length <= 1) {
      this.notificationCallback('Cannot delete the only configuration group', 'error');
      return;
    }

    if (!confirm('Are you sure you want to delete this configuration group? All sites in this group will be lost.')) {
      return;
    }

    const setting = this.appConfig.settings[groupIndex];
    if (!setting) return;

    // 删除配置组
    this.appConfig.settings.splice(groupIndex, 1);

    // 不需要处理selectedGroups，因为没有这个概念

    this.updateConfigDisplay();
    this.saveConfigCallback();
    this.notificationCallback(`Configuration group "${setting.name}" deleted successfully`, 'success');
  }

  // 打开添加网站模态框
  public openAddSiteModal(): void {
    // 使用第一个组的默认值，如果存在的话
    const targetGroup = this.appConfig.settings[0];
    
    // 如果组有默认值，创建一个预填充的站点配置
    if (targetGroup && targetGroup.defaults) {
      const defaultSite: Partial<SiteConfig> = {
        enable: false,
        matchPattern: 'domain',
        matchValue: '',
        envName: targetGroup.defaults.envName,
        color: targetGroup.defaults.color,
        backgroudEnable: targetGroup.defaults.backgroundEnable,
        Position: 'leftTop',
        flagEnable: targetGroup.defaults.flagEnable
      };
      
      this.addSiteModal.open(this.appConfig.defaultColors, defaultSite as SiteConfig);
    } else {
      this.addSiteModal.open(this.appConfig.defaultColors);
    }
  }

  // 打开添加网站模态框并预填域名
  public openAddSiteModalWithDomain(domain: string, pattern: string): void {
    // 使用第一个组的默认值，如果存在的话
    const targetGroup = this.appConfig.settings[0];
    
    if (targetGroup && targetGroup.defaults) {
      // 使用组默认值创建站点配置
      const defaultSite: SiteConfig = {
        enable: false,
        matchPattern: pattern,
        matchValue: domain,
        envName: targetGroup.defaults.envName,
        color: targetGroup.defaults.color,
        backgroudEnable: targetGroup.defaults.backgroundEnable,
        Position: 'leftTop',
        flagEnable: targetGroup.defaults.flagEnable
      };
      
      this.addSiteModal.open(this.appConfig.defaultColors, defaultSite);
    } else {
      this.addSiteModal.openWithDefaults(this.appConfig.defaultColors, domain, pattern);
    }
  }

  // 编辑网站
  private editSite(groupIndex: number, siteIndex: number): void {
    const setting = this.appConfig.settings[groupIndex];
    if (!setting || !setting.sites[siteIndex]) return;

    const site = setting.sites[siteIndex];
    // 使用现有的添加网站模态框进行编辑
    this.addSiteModal.open(this.appConfig.defaultColors, site, (updatedSite: SiteConfig) => {
      setting.sites[siteIndex] = updatedSite;
      this.updateConfigDisplay();
      this.saveConfigCallback();
      this.notificationCallback('Site configuration updated successfully', 'success');
    });
  }

  // 删除网站
  private deleteSite(groupIndex: number, siteIndex: number): void {
    if (!confirm('Are you sure you want to delete this site configuration?')) {
      return;
    }

    const setting = this.appConfig.settings[groupIndex];
    if (!setting || !setting.sites[siteIndex]) return;

    // 删除网站配置
    setting.sites.splice(siteIndex, 1);

    this.updateConfigDisplay();
    this.saveConfigCallback();
    this.notificationCallback('Site configuration deleted successfully', 'success');
  }

  // 导出单个配置组
  private exportConfigGroup(groupIndex: number): void {
    const setting = this.appConfig.settings[groupIndex];
    if (!setting) return;

    try {
      // 创建导出配置对象，只包含这个组（不包含defaultColors）
      const exportConfig = {
        settings: [setting]
      };
      
      const configStr = JSON.stringify(exportConfig, null, 2);
      const filename = `enveil.group.json`;
      
      // 下载文件
      this.downloadJSON(configStr, filename);
      
      this.notificationCallback(`Group "${setting.name}" exported successfully!`, 'success');
    } catch (error) {
      this.notificationCallback(
        'Failed to export group: ' + (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      );
    }
  }

  // 下载JSON文件辅助函数
  private downloadJSON(jsonStr: string, filename: string): void {
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
}