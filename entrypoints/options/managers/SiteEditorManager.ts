import { AppConfig, SiteConfig, Setting } from '../types';
import { AddSiteModal } from '../../../components/AddSiteModal';

// 声明chrome对象
declare const chrome: any;

export class SiteEditorManager {
  private appConfig: AppConfig;
  private selectedGroups: number[];
  private notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  private saveConfigCallback: () => void;
  private addSiteModal: AddSiteModal;

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
      if (this.isAddingToDefaultGroup()) {
        // 添加到默认组（索引为0）
        if (!this.appConfig.settings[0]) {
          // 如果默认组不存在，创建它
          this.appConfig.settings.push({
            name: "default",
            enable: true,
            sites: []
          });
        }
        this.appConfig.settings[0].sites.push(site);
      } else {
        // Use first selected group if available
        const targetGroupIndex = this.selectedGroups.length > 0 ? this.selectedGroups[0] : 0;
        if (this.appConfig.settings[targetGroupIndex]) {
          this.appConfig.settings[targetGroupIndex].sites.push(site);
        } else {
          // Fallback to first group
          this.appConfig.settings[0].sites.push(site);
        }
      }

      this.updateConfigDisplay();
      this.saveConfigCallback();
    });
  }
  
  // 检查是否应该添加到默认组
  private isAddingToDefaultGroup(): boolean {
    // 如果没有选中的组，则添加到默认组
    return this.selectedGroups.length === 0;
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
      addConfigGroupBtn.addEventListener('click', () => {
        this.addConfigGroup();
      });
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

    // 渲染选中的配置组
    if (this.selectedGroups.length > 0) {
      this.selectedGroups.forEach(groupIndex => {
        const setting = this.appConfig.settings[groupIndex];
        if (!setting) return;

        const groupElement = this.createConfigGroupElement(setting, groupIndex);
        configGroupsContainer.appendChild(groupElement);
      });
    } else if (this.appConfig.settings.length > 0) {
      // 如果没有选中的配置组，默认显示第一个
      const defaultSetting = this.appConfig.settings[0];
      const groupElement = this.createConfigGroupElement(defaultSetting, 0);
      configGroupsContainer.appendChild(groupElement);
    } else {
      // 如果没有配置组，显示空状态
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <p>No configuration groups found.</p>
        <p>Click the "+" button to add your first configuration group.</p>
      `;
      configGroupsContainer.appendChild(emptyState);
    }
  }

  // 创建单个配置组元素
  private createConfigGroupElement(setting: Setting, groupIndex: number): HTMLDivElement {
    const groupElement = document.createElement('div');
    groupElement.className = 'config-group-container';
    groupElement.dataset.groupIndex = groupIndex.toString();

    // 配置组标题和操作栏
    const groupHeader = document.createElement('div');
    groupHeader.className = 'config-group-header';
    
    const groupHeaderInner = document.createElement('div');
    groupHeaderInner.className = 'group-header';
    
    // 组名称和开关
    const headerLeft = document.createElement('div');
    headerLeft.className = 'group-header-left';
    
    // 保留原来的复选框
    const toggleSwitch = document.createElement('input');
    toggleSwitch.type = 'checkbox';
    toggleSwitch.className = 'group-toggle';
    toggleSwitch.checked = setting.enable;
    toggleSwitch.addEventListener('change', () => {
      setting.enable = toggleSwitch.checked;
      this.saveConfigCallback();
    });
    
    const groupTitle = document.createElement('h3');
    groupTitle.className = 'config-group-title';
    groupTitle.innerHTML = `${setting.name} <span class="site-count">(${setting.sites.length} sites)</span>`;
    
    // 添加 Enable 开关到标题旁边
    const enableSwitch = document.createElement('div');
    enableSwitch.className = 'group-enable-switch';
    const enableLabel = document.createElement('span');
    enableLabel.className = 'switch-label';
    enableLabel.textContent = 'Enable';
    
    const switchContainer = document.createElement('div');
    switchContainer.className = 'switch-container';
    
    const switchLabel = document.createElement('label');
    switchLabel.className = 'switch';
    
    const switchInput = document.createElement('input');
    switchInput.type = 'checkbox';
    switchInput.className = 'group-enable-toggle';
    switchInput.checked = setting.enable;
    
    const sliderSpan = document.createElement('span');
    sliderSpan.className = 'slider';
    
    switchLabel.appendChild(switchInput);
    switchLabel.appendChild(sliderSpan);
    switchContainer.appendChild(switchLabel);
    
    enableSwitch.appendChild(enableLabel);
    enableSwitch.appendChild(switchContainer);
    
    switchInput.addEventListener('change', () => {
      setting.enable = switchInput.checked;
      this.saveConfigCallback();
    });
    
    headerLeft.appendChild(toggleSwitch);
    headerLeft.appendChild(groupTitle);
    headerLeft.appendChild(enableSwitch);
    
    // 组操作按钮
    const headerActions = document.createElement('div');
    headerActions.className = 'group-header-actions';
    
    // 添加网站按钮
    const addSiteBtn = document.createElement('button');
    addSiteBtn.className = 'add-site-btn';
    addSiteBtn.innerHTML = '<i class="fas fa-plus"></i> Add Site';
    addSiteBtn.addEventListener('click', () => {
      this.openAddSiteModal();
    });
    
    // 编辑配置组名称按钮
    const editBtn = document.createElement('button');
    editBtn.className = 'group-edit-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.title = 'Edit group name';
    editBtn.addEventListener('click', () => {
      this.editConfigGroupName(groupIndex);
    });
    
    // 删除配置组按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'group-delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = 'Delete group';
    deleteBtn.addEventListener('click', () => {
      this.deleteConfigGroup(groupIndex);
    });
    
    headerActions.appendChild(addSiteBtn);
    headerActions.appendChild(editBtn);
    headerActions.appendChild(deleteBtn);
    
    groupHeaderInner.appendChild(headerLeft);
    groupHeaderInner.appendChild(headerActions);
    groupHeader.appendChild(groupHeaderInner);

    // 网站列表容器
    const sitesContainer = document.createElement('div');
    sitesContainer.className = 'config-group-content';

    // 创建网站表格
    const sitesTable = document.createElement('table');
    sitesTable.className = 'config-group-table';
    
    // 表头
    const tableHeader = document.createElement('thead');
    tableHeader.innerHTML = `
      <tr>
        <th>Enable</th>
        <th>Pattern</th>
        <th>Value</th>
        <th>Name</th>
        <th>Position</th>
        <th>Color</th>
        <th>Background</th>
        <th>Flag</th>
        <th colspan="2">Actions</th>
      </tr>
    `;
    sitesTable.appendChild(tableHeader);
    
    // 表格主体
    const tableBody = document.createElement('tbody');
    
    // 如果没有网站，显示空状态但仍保留表头
    if (setting.sites.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `
        <td colspan="9" class="empty-group-message">No sites configured in this group. Click "Add Site" to add your first site.</td>
      `;
      tableBody.appendChild(emptyRow);
    } else {
      // 渲染每个网站配置
      setting.sites.forEach((site, siteIndex) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>
            <div class="switch-container">
              <label class="switch">
                <input type="checkbox" class="site-enable-toggle" ${site.enable ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>
          </td>
          <td>${site.matchPattern}</td>
          <td>${site.matchValue}</td>
          <td>
            <span class="site-env-name" style="background-color: ${site.color}; padding: 2px 6px; border-radius: 4px;">${site.envName}</span>
          </td>
          <td>${site.Position}</td>
          <td>
            <div style="width: 20px; height: 20px; background-color: ${site.color}; border-radius: 50%; margin: auto;"></div>
          </td>
          <td>${site.backgroudEnable ? 'Yes' : 'No'}</td>
          <td>${site.flagEnable ? 'Yes' : 'No'}</td>
          <td>
            <button class="site-edit-btn" title="Edit site"><i class="fas fa-edit"></i></button>
          </td>
          <td>
            <button class="site-delete-btn" title="Delete site"><i class="fas fa-trash"></i></button>
          </td>
        `;
        
        // 添加事件监听器
        const enableToggle = row.querySelector('.site-enable-toggle') as HTMLInputElement;
        enableToggle.addEventListener('change', () => {
          site.enable = enableToggle.checked;
          this.saveConfigCallback();
          this.updateConfigDisplay();
        });
        
        const editBtn = row.querySelector('.site-edit-btn') as HTMLButtonElement;
        editBtn.addEventListener('click', () => {
          this.editSite(groupIndex, siteIndex);
        });
        
        const deleteBtn = row.querySelector('.site-delete-btn') as HTMLButtonElement;
        deleteBtn.addEventListener('click', () => {
          this.deleteSite(groupIndex, siteIndex);
        });
        
        tableBody.appendChild(row);
      });
    }
    
    sitesTable.appendChild(tableBody);
    sitesContainer.appendChild(sitesTable);

    groupElement.appendChild(groupHeader);
    groupElement.appendChild(sitesContainer);

    return groupElement;
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
    const groupName = prompt('Enter configuration group name:');
    if (!groupName || groupName.trim() === '') {
      this.notificationCallback('Group name cannot be empty', 'error');
      return;
    }

    // 检查名称是否已存在
    if (this.appConfig.settings.some(setting => setting.name === groupName.trim())) {
      this.notificationCallback('Configuration group with this name already exists', 'error');
      return;
    }

    // 添加新的配置组
    this.appConfig.settings.push({
      name: groupName.trim(),
      enable: true,
      sites: []
    });

    // 选中新添加的配置组
    const newGroupIndex = this.appConfig.settings.length - 1;
    this.selectedGroups = [newGroupIndex];

    this.updateConfigDisplay();
    this.saveConfigCallback();
    this.notificationCallback(`Configuration group "${groupName.trim()}" added successfully`, 'success');
  }

  // 编辑配置组名称
  private editConfigGroupName(groupIndex: number): void {
    const setting = this.appConfig.settings[groupIndex];
    if (!setting) return;

    const newName = prompt('Enter new configuration group name:', setting.name);
    if (!newName || newName.trim() === '') {
      this.notificationCallback('Group name cannot be empty', 'error');
      return;
    }

    // 检查新名称是否已被其他组使用
    if (this.appConfig.settings.some((s, index) => s.name === newName.trim() && index !== groupIndex)) {
      this.notificationCallback('Configuration group with this name already exists', 'error');
      return;
    }

    setting.name = newName.trim();
    this.updateConfigDisplay();
    this.saveConfigCallback();
    this.notificationCallback('Configuration group name updated successfully', 'success');
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
    // 重置模态框为添加模式
    this.addSiteModal.setEditMode(false);
    this.addSiteModal.open();
  }

  // 编辑网站
  private editSite(groupIndex: number, siteIndex: number): void {
    const setting = this.appConfig.settings[groupIndex];
    if (!setting || !setting.sites[siteIndex]) return;

    const site = setting.sites[siteIndex];
    // 设置编辑模式并传入现有数据
    this.addSiteModal.setEditMode(true, site);
    
    // 使用现有的添加网站模态框进行编辑
    this.addSiteModal.onSave((updatedSite: SiteConfig) => {
      setting.sites[siteIndex] = updatedSite;
      this.updateConfigDisplay();
      this.saveConfigCallback();
      this.notificationCallback('Site configuration updated successfully', 'success');
    });
    
    this.addSiteModal.open();
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