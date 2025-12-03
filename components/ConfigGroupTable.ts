import { Setting, SiteConfig } from '../entrypoints/options/types';
import { PositionSelector } from './PositionSelector';

export class ConfigGroupTable {
    private setting: Setting;
    private groupIndex: number;
    private isSelected: boolean;
    private onSave: () => void;
    private onUpdate: () => void;
    private onSelect: (index: number) => void;
    private onDelete: (index: number) => void;
    private onAddSite: (groupIndex: number) => void;
    private onEditSite: (groupIndex: number, siteIndex: number) => void;
    private onDeleteSite: (groupIndex: number, siteIndex: number) => void;
    private notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;

    constructor(
        setting: Setting,
        groupIndex: number,
        isSelected: boolean,
        callbacks: {
            onSave: () => void;
            onUpdate: () => void;
            onSelect: (index: number) => void;
            onDelete: (index: number) => void;
            onAddSite: (groupIndex: number) => void;
            onEditSite: (groupIndex: number, siteIndex: number) => void;
            onDeleteSite: (groupIndex: number, siteIndex: number) => void;
            notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
        }
    ) {
        this.setting = setting;
        this.groupIndex = groupIndex;
        this.isSelected = isSelected;
        this.onSave = callbacks.onSave;
        this.onUpdate = callbacks.onUpdate;
        this.onSelect = callbacks.onSelect;
        this.onDelete = callbacks.onDelete;
        this.onAddSite = callbacks.onAddSite;
        this.onEditSite = callbacks.onEditSite;
        this.onDeleteSite = callbacks.onDeleteSite;
        this.notificationCallback = callbacks.notificationCallback;
    }

    public render(): HTMLDivElement {
        const groupElement = document.createElement('div');
        groupElement.className = 'config-group-container';
        groupElement.dataset.groupIndex = this.groupIndex.toString();

        // Group Header
        const groupHeader = document.createElement('div');
        groupHeader.className = 'config-group-header';

        const groupHeaderInner = document.createElement('div');
        groupHeaderInner.className = 'group-header';

        // Header Left
        const headerLeft = document.createElement('div');
        headerLeft.className = 'group-header-left';

        // Export Selection Checkbox
        const toggleSwitch = document.createElement('input');
        toggleSwitch.type = 'checkbox';
        toggleSwitch.className = 'group-toggle';
        toggleSwitch.checked = this.isSelected;
        toggleSwitch.addEventListener('change', () => {
            this.onSelect(this.groupIndex);
        });

        // Group Title & Input
        const groupTitleContainer = document.createElement('div');
        groupTitleContainer.className = 'config-group-title-container';

        const groupTitle = document.createElement('h3');
        groupTitle.className = 'config-group-title';
        groupTitle.innerHTML = `${this.setting.name} <span class="site-count">(${this.setting.sites.length} sites)</span>`;

        const groupNameInput = document.createElement('input');
        groupNameInput.type = 'text';
        groupNameInput.className = 'config-group-name-input';
        groupNameInput.value = this.setting.name;
        groupNameInput.style.display = 'none';

        // Edit Button
        const editBtn = document.createElement('button');
        editBtn.className = 'group-edit-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.title = 'Edit group name';
        editBtn.style.marginLeft = '8px';

        // Enable Switch
        const enableSwitch = document.createElement('div');
        enableSwitch.className = 'group-enable-switch';
        const enableLabel = document.createElement('span');
        enableLabel.className = 'switch-label';
        enableLabel.textContent = 'Enable';
        enableLabel.style.marginLeft = '8px';

        const switchContainer = document.createElement('div');
        switchContainer.className = 'switch-container';
        const switchLabel = document.createElement('label');
        switchLabel.className = 'switch';
        const switchInput = document.createElement('input');
        switchInput.type = 'checkbox';
        switchInput.className = 'group-enable-toggle';
        switchInput.checked = this.setting.enable;
        const sliderSpan = document.createElement('span');
        sliderSpan.className = 'slider';

        switchLabel.appendChild(switchInput);
        switchLabel.appendChild(sliderSpan);
        switchContainer.appendChild(switchLabel);
        enableSwitch.appendChild(switchContainer);
        enableSwitch.appendChild(enableLabel);

        // Event Handlers
        const saveGroupName = () => {
            const newName = groupNameInput.value.trim();
            if (newName && newName !== this.setting.name) {
                // Validation should ideally happen in parent, but simple check here
                this.setting.name = newName;
                groupTitle.innerHTML = `${this.setting.name} <span class="site-count">(${this.setting.sites.length} sites)</span>`;
                this.onSave();
                this.notificationCallback('Configuration group name updated successfully', 'success');
            } else if (!newName) {
                groupNameInput.value = this.setting.name;
                this.notificationCallback('Group name cannot be empty', 'error');
            }

            groupNameInput.style.display = 'none';
            groupTitle.style.display = 'block';
            editBtn.style.display = 'flex'; // Restore display with flex layout to keep icon centered
        };

        groupNameInput.addEventListener('blur', saveGroupName);
        groupNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveGroupName();
        });

        const enterEditMode = () => {
            groupTitle.style.display = 'none';
            editBtn.style.display = 'none';
            groupNameInput.style.display = 'inline-block';
            groupNameInput.value = this.setting.name;
            groupNameInput.focus();
        };

        groupTitle.addEventListener('dblclick', enterEditMode);
        editBtn.addEventListener('click', enterEditMode);

        switchInput.addEventListener('change', () => {
            this.setting.enable = switchInput.checked;
            this.onSave();
            this.onUpdate(); // Re-render to update children toggles
        });

        groupTitleContainer.appendChild(groupTitle);
        groupTitleContainer.appendChild(groupNameInput);

        headerLeft.appendChild(toggleSwitch);
        headerLeft.appendChild(groupTitleContainer);
        headerLeft.appendChild(editBtn);
        headerLeft.appendChild(enableSwitch);

        // Header Actions
        const headerActions = document.createElement('div');
        headerActions.className = 'group-header-actions';

        const addSiteBtn = document.createElement('button');
        addSiteBtn.className = 'add-site-btn';
        addSiteBtn.innerHTML = '<i class="fas fa-plus"></i> Add Site';
        addSiteBtn.addEventListener('click', () => this.onAddSite(this.groupIndex));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'group-delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Delete group';
        deleteBtn.addEventListener('click', () => this.onDelete(this.groupIndex));

        headerActions.appendChild(addSiteBtn);
        headerActions.appendChild(deleteBtn);

        groupHeaderInner.appendChild(headerLeft);
        groupHeaderInner.appendChild(headerActions);
        groupHeader.appendChild(groupHeaderInner);

        // Sites Table
        const sitesContainer = document.createElement('div');
        sitesContainer.className = 'config-group-content';

        const sitesTable = this.renderSitesTable();
        sitesContainer.appendChild(sitesTable);

        groupElement.appendChild(groupHeader);
        groupElement.appendChild(sitesContainer);

        return groupElement;
    }

    private renderSitesTable(): HTMLTableElement {
        const sitesTable = document.createElement('table');
        sitesTable.className = 'config-group-table';

        const tableHeader = document.createElement('thead');
        tableHeader.innerHTML = `
      <tr>
        <th>Enable</th>
        <th>Pattern</th>
        <th>Value</th>
        <th>Name</th>
        <th>Color</th>
        <th>Background</th>
        <th>Flag</th>
        <th>Position</th>
        <th colspan="2">Actions</th>
      </tr>
    `;
        sitesTable.appendChild(tableHeader);

        const tableBody = document.createElement('tbody');

        if (this.setting.sites.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
        <td colspan="9" class="empty-group-message">No sites configured in this group. Click "Add Site" to add your first site.</td>
      `;
            tableBody.appendChild(emptyRow);
        } else {
            this.setting.sites.forEach((site, siteIndex) => {
                const row = this.createSiteRow(site, siteIndex);
                tableBody.appendChild(row);
            });
        }

        sitesTable.appendChild(tableBody);
        return sitesTable;
    }

    private createSiteRow(site: SiteConfig, siteIndex: number): HTMLTableRowElement {
        const row = document.createElement('tr');
        const contrastColor = this.getContrastColor(site.color);
        const isGroupEnabled = this.setting.enable;

            row.innerHTML = `
      <td>
        <div class="switch-container">
          <label class="switch">
            <input type="checkbox" class="site-enable-toggle" ${site.enable ? 'checked' : ''} ${!isGroupEnabled ? 'disabled' : ''} ${!isGroupEnabled ? 'class="disabled-switch"' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      </td>
      <td>${site.matchPattern}</td>
      <td>${site.matchValue}</td>
      <td style="background-color: ${site.color}; color: ${contrastColor}; font-weight: bold;">
        ${site.envName}
      </td>
      <td>
        <div style="width: 20px; height: 20px; background-color: ${site.color}; border-radius: 50%; margin: auto;"></div>
      </td>
      <td>
        <div class="switch-container">
          <label class="switch">
            <input type="checkbox" class="site-background-toggle" ${site.backgroudEnable ? 'checked' : ''} ${!isGroupEnabled ? 'disabled' : ''} ${!isGroupEnabled ? 'class="disabled-switch"' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      </td>
      <td>
        <div class="switch-container">
          <label class="switch">
            <input type="checkbox" class="site-flag-toggle" ${site.flagEnable ? 'checked' : ''} ${!isGroupEnabled ? 'disabled' : ''} ${!isGroupEnabled ? 'class="disabled-switch"' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      </td>
      <td>${site.flagEnable ? '<div class="position-cell-container"></div>' : '-'}</td>
      <td>
        <button class="site-edit-btn" title="Edit site" ${!isGroupEnabled ? 'disabled' : ''}><i class="fas fa-edit"></i></button>
      </td>
      <td>
        <button class="site-delete-btn" title="Delete site"><i class="fas fa-trash"></i></button>
      </td>
    `;

        // 添加disabled样式
        if (!isGroupEnabled) {
            const switchContainers = row.querySelectorAll('.switch-container');
            switchContainers.forEach(container => {
                container.classList.add('disabled-switch-container');
            });
        }

        // 初始化位置选择器（只读模式），仅当flagEnable为true时
        if (site.flagEnable) {
          const positionCellContainer = row.querySelector('.position-cell-container') as HTMLElement;
          new PositionSelector(positionCellContainer, {
            initialPosition: site.Position || 'leftTop',
            color: site.color,
            readonly: true
          });
        }

        const enableToggle = row.querySelector('.site-enable-toggle') as HTMLInputElement;
        enableToggle.addEventListener('change', () => {
            if (this.setting.enable) {
                site.enable = enableToggle.checked;
                this.onSave();
            }
        });

        const backgroundToggle = row.querySelector('.site-background-toggle') as HTMLInputElement;
        backgroundToggle.addEventListener('change', () => {
            if (this.setting.enable) {
                site.backgroudEnable = backgroundToggle.checked;
                this.onSave();
            }
        });

        const flagToggle = row.querySelector('.site-flag-toggle') as HTMLInputElement;
        flagToggle.addEventListener('change', () => {
            if (this.setting.enable) {
                site.flagEnable = flagToggle.checked;
                this.onSave();
            }
        });

        const editBtn = row.querySelector('.site-edit-btn') as HTMLButtonElement;
        editBtn.addEventListener('click', () => this.onEditSite(this.groupIndex, siteIndex));

        const deleteBtn = row.querySelector('.site-delete-btn') as HTMLButtonElement;
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.onDeleteSite(this.groupIndex, siteIndex);
        });

        return row;
    }

    private getContrastColor(hexcolor: string): string {
        if (hexcolor.length === 4) {
            hexcolor = '#' + hexcolor[1] + hexcolor[1] + hexcolor[2] + hexcolor[2] + hexcolor[3] + hexcolor[3];
        }
        if (hexcolor.startsWith('#')) hexcolor = hexcolor.slice(1);
        const r = parseInt(hexcolor.substring(0, 2), 16);
        const g = parseInt(hexcolor.substring(2, 4), 16);
        const b = parseInt(hexcolor.substring(4, 6), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'black' : 'white';
    }
}
