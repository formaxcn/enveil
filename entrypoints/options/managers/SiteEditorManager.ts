import { AppConfig, SiteConfig, Setting } from '../types';
import { AddSiteModal } from '../../../components/AddSiteModal';
import { AddGroupModal } from '../../../components/AddGroupModal';
import { SwitchComponent } from '../../../components/SwitchComponent';

// 声明chrome对象
declare const chrome: any;

export class SiteEditorManager {
  private appConfig: AppConfig;
  private selectedGroups: number[];
  private notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  private saveConfigCallback: () => void;
  private addSiteModal: AddSiteModal;
  private addGroupModal: AddGroupModal;

  constructor(
    appConfig: AppConfig,
    selectedGroups: number[],
    notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void,
    saveConfigCallback: () => void
  ) {
    this.appConfig = appConfig;
    this.selectedGroups = selectedGroups;
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

  // 更新选中的配置组
  public updateSelectedGroups(groups: number[]): void {
    this.selectedGroups = groups;
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
          sites: []
        });
      }

      // Use first selected group if available, otherwise default
      const targetGroupIndex = this.selectedGroups.length > 0 ? this.selectedGroups[0] : 0;
      if (this.appConfig.settings[targetGroupIndex]) {
        this.appConfig.settings[targetGroupIndex].sites.push(site);
      } else {
        // Fallback
        this.appConfig.settings[0].sites.push(site);
      }

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

    headerActions.appendChild(addSiteBtn);
    headerActions.appendChild(editBtn);
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

    // 网站信息
    const siteInfo = document.createElement('div');
    siteInfo.className = 'site-info';
    siteInfo.innerHTML = `
      <div class="site-main-info">
        <span class="site-env-name" style="background-color: ${site.color}">${site.envName}</span>
        <span class="site-match">${site.matchPattern}: ${site.matchValue}</span>
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

  // 切换配置组选择
  private toggleGroupSelection(groupIndex: number): void {
    const index = this.selectedGroups.indexOf(groupIndex);
    if (index > -1) {
      this.selectedGroups.splice(index, 1);
    } else {
      // 这里可以根据需要决定是单选还是多选
      // 当前实现为单选
      this.selectedGroups = [groupIndex];
    }
    this.updateConfigDisplay();
  }

  // 添加配置组
  private addConfigGroup(): void {
    console.log('addConfigGroup method start');

    this.addGroupModal.open('', (trimmedName: string) => {
      console.log('Modal result:', trimmedName);

      // 检查名称是否已存在
      if (this.appConfig.settings.some(setting => setting.name === trimmedName)) {
        this.notificationCallback('Configuration group with this name already exists', 'error');
        return;
      }

      // 添加新的配置组
      const newGroup: Setting = {
        name: trimmedName,
        enable: true,
        sites: []
      };

      this.appConfig.settings.push(newGroup);
      console.log('New group added to appConfig.settings. Total groups:', this.appConfig.settings.length);

      // 选中新添加的配置组
      const newGroupIndex = this.appConfig.settings.length - 1;
      this.selectedGroups = [newGroupIndex];

      this.updateConfigDisplay();
      this.saveConfigCallback();
      this.notificationCallback(`Configuration group "${trimmedName}" added successfully`, 'success');
    });
  }

  // 编辑配置组名称
  private editConfigGroupName(groupIndex: number): void {
    const setting = this.appConfig.settings[groupIndex];
    if (!setting) return;

    this.addGroupModal.open(setting.name, (trimmedName: string) => {
      // 检查新名称是否已被其他组使用
      if (this.appConfig.settings.some((s, index) => s.name === trimmedName && index !== groupIndex)) {
        this.notificationCallback('Configuration group with this name already exists', 'error');
        return;
      }

      setting.name = trimmedName;
      this.updateConfigDisplay();
      this.saveConfigCallback();
      this.notificationCallback('Configuration group name updated successfully', 'success');
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

    // 从选中数组中移除
    const selectedIndex = this.selectedGroups.indexOf(groupIndex);
    if (selectedIndex > -1) {
      this.selectedGroups.splice(selectedIndex, 1);
    }

    // 如果没有选中的组，默认选中第一个
    if (this.selectedGroups.length === 0 && this.appConfig.settings.length > 0) {
      this.selectedGroups = [0];
    }

    this.updateConfigDisplay();
    this.saveConfigCallback();
    this.notificationCallback(`Configuration group "${setting.name}" deleted successfully`, 'success');
  }

  // 打开添加网站模态框
  public openAddSiteModal(): void {
    this.addSiteModal.open();
  }

  // 编辑网站
  private editSite(groupIndex: number, siteIndex: number): void {
    const setting = this.appConfig.settings[groupIndex];
    if (!setting || !setting.sites[siteIndex]) return;

    const site = setting.sites[siteIndex];
    // 使用现有的添加网站模态框进行编辑
    this.addSiteModal.open(site, (updatedSite: SiteConfig) => {
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
}