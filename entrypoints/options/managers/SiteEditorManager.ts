import { AppConfig, SiteConfig } from '../types';
import { SiteConfigModal } from '../../../components/SiteConfigModal';
import { StorageManager } from '../../../components/StorageManager';
import { ConfigGroupTable } from '../../../components/ConfigGroupTable';

export class SiteEditorManager {
  private appConfig: AppConfig;
  private selectedGroups: number[];
  private notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  private saveConfigCallback: () => void;
  private addSiteModal: SiteConfigModal;
  private storageManager: StorageManager;

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
    this.storageManager = StorageManager.getInstance();
    this.addSiteModal = new SiteConfigModal();
    this.initAddSiteModal();
  }

  // 更新配置引用
  public updateConfig(config: AppConfig): void {
    this.appConfig = config;
    this.updateConfigDisplay();
  }

  // 更新选中的配置组
  public updateSelectedGroups(groups: number[]): void {
    this.selectedGroups = groups;
    this.updateConfigDisplay();
  }

  // 初始化添加网站模态框
  private initAddSiteModal(): void {
    this.addSiteModal.onSave((site: SiteConfig) => {
      // Logic for adding site from modal (usually triggered by "Add Site" button on a specific group)
      // However, the modal might be global. 
      // If triggered globally (floating button), we need to decide where to add.
      // If triggered by a group specific button, the component handles it via callback.

      // We'll keep the logic for the global floating button if it exists, 
      // but primarily we rely on the group-specific callbacks now.

      // If we are in "Edit Mode" for a specific site, the modal callback handles it.
      // If we are adding a new site...

      // Since we refactored to components, the "Add Site" button on the group 
      // should probably open the modal and we need to know which group triggered it.
      // The component callback `onAddSite` handles this.

      // This global onSave is mainly for the Floating Button if it still exists.
      // If the floating button is removed (as per previous conversation summary, but let's be safe),
      // we default to the first group or a new group.

      if (this.addSiteModal.isEditMode()) {
        // Edit mode is handled by the specific edit callback usually, 
        // but if the modal is shared, we need to know context.
        // The current AddSiteModal implementation might need a way to pass context.
        // For now, let's assume the component callback handles the specific add/edit logic
        // and this global callback is a fallback or for the floating button.

        // Actually, to keep it clean, let's rely on the callbacks passed to ConfigGroupTable.
        // But `AddSiteModal` is a single instance.
        // We need to store the "current editing group index" when opening the modal.
      } else {
        // Default add to first group if global add is used
        if (this.appConfig.settings.length === 0) {
          this.addConfigGroup(); // Create default group if none
        }
        const targetGroupIndex = 0; // Default to first
        if (this.appConfig.settings[targetGroupIndex]) {
          this.appConfig.settings[targetGroupIndex].sites.push(site);
          this.saveConfigCallback();
          this.updateConfigDisplay();
        }
      }
    });
  }

  // 初始化网站编辑相关UI
  public initSiteEditorUI(): void {
    // 绑定浮动添加按钮点击事件 (如果有)
    const floatingAddButton = document.querySelector('.floating-add-button') as HTMLButtonElement;
    if (floatingAddButton) {
      floatingAddButton.addEventListener('click', () => {
        this.openAddSiteModal(0); // Default to first group
      });
    }

    // 绑定添加配置组按钮事件
    const addConfigGroupBtn = document.getElementById('add-config-group') as HTMLButtonElement;
    if (addConfigGroupBtn) {
      // Remove old listeners to prevent duplicates if init is called multiple times
      const newBtn = addConfigGroupBtn.cloneNode(true) as HTMLButtonElement;
      addConfigGroupBtn.parentNode?.replaceChild(newBtn, addConfigGroupBtn);
      newBtn.addEventListener('click', () => {
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

    if (this.appConfig.settings.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <p>No configuration groups found.</p>
        <p>Click the "+" button to add your first configuration group.</p>
      `;
      configGroupsContainer.appendChild(emptyState);
      return;
    }

    // Render ALL groups
    this.appConfig.settings.forEach((setting, index) => {
      const isSelected = this.selectedGroups.includes(index);
      const component = new ConfigGroupTable(
        setting,
        index,
        isSelected,
        {
          onSave: () => {
            this.saveConfigCallback();
          },
          onUpdate: () => {
            this.updateConfigDisplay();
          },
          onSelect: (idx) => {
            this.toggleGroupSelection(idx);
          },
          onDelete: (idx) => {
            this.deleteConfigGroup(idx);
          },
          onAddSite: (idx) => {
            this.openAddSiteModal(idx);
          },
          onEditSite: (idx, siteIdx) => {
            this.editSite(idx, siteIdx);
          },
          onDeleteSite: (idx, siteIdx) => {
            this.deleteSite(idx, siteIdx);
          },
          notificationCallback: this.notificationCallback
        }
      );
      configGroupsContainer.appendChild(component.render());
    });
  }

  // 切换配置组选择
  private toggleGroupSelection(groupIndex: number): void {
    const index = this.selectedGroups.indexOf(groupIndex);
    if (index > -1) {
      this.selectedGroups.splice(index, 1);
    } else {
      this.selectedGroups.push(groupIndex);
    }
    // We don't need to re-render everything, but for simplicity we do
    // to update the checkbox state if it wasn't handled locally.
    // The component handles the checkbox change event, but we need to sync the state.
    this.updateConfigDisplay();
  }

  // 添加配置组
  private addConfigGroup(): void {
    let defaultGroupName: string;
    let attempts = 0;
    do {
      const randomNumber = Math.floor(100 + Math.random() * 900);
      defaultGroupName = `enveil-${randomNumber}`;
      attempts++;
      if (attempts > 100) break;
    } while (this.appConfig.settings.some(setting => setting.name === defaultGroupName));

    this.appConfig.settings.push({
      name: defaultGroupName,
      enable: true,
      sites: []
    });

    // Optionally select the new group for export? 
    // User didn't specify, but usually we don't auto-select for export unless it's the only one.
    if (this.appConfig.settings.length === 1) {
      this.selectedGroups.push(0);
    }

    this.saveConfigCallback();
    this.updateConfigDisplay();

    // Auto-focus logic would need to find the new element.
    // Since we re-rendered, we can find the last group.
    setTimeout(() => {
      const newGroupIndex = this.appConfig.settings.length - 1;
      const groupElement = document.querySelector(`[data-group-index="${newGroupIndex}"]`) as HTMLElement;
      if (groupElement) {
        const editBtn = groupElement.querySelector('.group-edit-btn') as HTMLButtonElement;
        if (editBtn) {
          editBtn.click();
        }
      }
    }, 100);

    this.notificationCallback(`Configuration group "${defaultGroupName}" added successfully`, 'success');
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

    this.appConfig.settings.splice(groupIndex, 1);

    // Update selectedGroups indices
    // Remove the deleted index
    const selectedIndex = this.selectedGroups.indexOf(groupIndex);
    if (selectedIndex > -1) {
      this.selectedGroups.splice(selectedIndex, 1);
    }

    // Shift indices for groups after the deleted one
    this.selectedGroups = this.selectedGroups.map(idx => idx > groupIndex ? idx - 1 : idx);

    this.saveConfigCallback();
    this.updateConfigDisplay();
    this.notificationCallback(`Configuration group "${setting.name}" deleted successfully`, 'success');
  }

  // 打开添加网站模态框
  public openAddSiteModal(groupIndex: number): void {
    this.addSiteModal.setEditMode(false);

    // We need to override the onSave to target the specific group
    this.addSiteModal.onSave((site: SiteConfig) => {
      if (this.appConfig.settings[groupIndex]) {
        this.appConfig.settings[groupIndex].sites.push(site);
        this.saveConfigCallback();
        this.updateConfigDisplay();
        this.notificationCallback('Site added successfully', 'success');
      }
    });

    this.addSiteModal.open();
  }

  // 编辑网站
  private editSite(groupIndex: number, siteIndex: number): void {
    const setting = this.appConfig.settings[groupIndex];
    if (!setting || !setting.sites[siteIndex]) return;

    const site = setting.sites[siteIndex];
    this.addSiteModal.setEditMode(true, site);

    this.addSiteModal.onSave((updatedSite: SiteConfig) => {
      if (this.appConfig.settings[groupIndex]) {
        this.appConfig.settings[groupIndex].sites[siteIndex] = updatedSite;
        this.saveConfigCallback();
        this.updateConfigDisplay();
        this.notificationCallback('Site configuration updated successfully', 'success');
      }
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

    setting.sites.splice(siteIndex, 1);

    this.saveConfigCallback();
    this.updateConfigDisplay();
    this.notificationCallback('Site configuration deleted successfully', 'success');
  }
}