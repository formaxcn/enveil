import { SwitchComponent } from './SwitchComponent';
import { CloudAccount, CloudRole, CloudEnvironment, RoleHighlightStyle } from '../entrypoints/options/types';
import modalTemplate from './AddCloudAccountModal.html?raw';
import './AddCloudAccountModal.css';

export class AddCloudAccountModal {
  private modal: HTMLElement;
  private onSaveCallback?: (account: CloudAccount) => void;
  private editingAccount: CloudAccount | null = null;
  private currentEnvironment: CloudEnvironment | null = null;
  private accountEnableSwitch!: SwitchComponent;
  private backgroundEnableSwitch!: SwitchComponent;
  private roles: CloudRole[] = [];
  private editingRoleIndex: number = -1;

  constructor() {
    // Create modal HTML structure
    this.modal = document.createElement('div');
    this.modal.className = 'modal';
    this.modal.innerHTML = modalTemplate;

    this.initializeComponents();
    this.bindEvents();
  }

  private initializeComponents() {
    // Initialize account enable switch
    const accountEnableSwitchContainer = this.modal.querySelector('#account-enable-switch') as HTMLElement;
    this.accountEnableSwitch = new SwitchComponent(
      accountEnableSwitchContainer, 
      'Enable Account', 
      'modal-account-enable', 
      'local', 
      true, 
      false
    );

    // Initialize background enable switch
    const backgroundEnableSwitchContainer = this.modal.querySelector('#background-enable-switch') as HTMLElement;
    this.backgroundEnableSwitch = new SwitchComponent(
      backgroundEnableSwitchContainer, 
      'Enable Background Highlighting', 
      'modal-background-enable', 
      'local', 
      true, 
      false
    );
  }

  private bindEvents() {
    // Close button events
    const closeBtn = this.modal.querySelector('.modal-close') as HTMLButtonElement;
    const cancelBtn = this.modal.querySelector('.cancel-btn') as HTMLButtonElement;
    const overlay = this.modal.querySelector('.modal-overlay') as HTMLElement;

    const closeHandler = () => {
      this.close();
    };

    closeBtn.addEventListener('click', closeHandler);
    cancelBtn.addEventListener('click', closeHandler);
    overlay.addEventListener('click', closeHandler);

    // Form submit event
    const form = this.modal.querySelector('#add-cloud-account-form') as HTMLFormElement;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSave();
    });

    // Add role button
    const addRoleBtn = this.modal.querySelector('#add-role-btn') as HTMLButtonElement;
    addRoleBtn.addEventListener('click', () => {
      this.addNewRole();
    });

    // Color selection events
    this.initializeColorSelection();
  }

  private initializeColorSelection() {
    const accountColorInput = this.modal.querySelector('#account-color') as HTMLInputElement;
    const customPicker = this.modal.querySelector('#account-custom-picker') as HTMLInputElement;
    const customColorBtn = this.modal.querySelector('#account-others-color-btn') as HTMLElement;

    // Custom color picker
    customColorBtn.addEventListener('click', () => {
      customPicker.click();
    });

    customPicker.addEventListener('change', (e) => {
      const color = (e.target as HTMLInputElement).value;
      accountColorInput.value = color;
      this.updateColorSelection(color);
    });
  }

  private setupDefaultColors(defaultColors: string[]) {
    const defaultColorsContainer = this.modal.querySelector('#account-default-colors') as HTMLElement;
    const accountColorInput = this.modal.querySelector('#account-color') as HTMLInputElement;
    
    defaultColorsContainer.innerHTML = '';

    defaultColors.forEach(color => {
      const colorDot = document.createElement('div');
      colorDot.className = 'color-dot';
      colorDot.style.backgroundColor = color;
      colorDot.title = color;
      
      colorDot.addEventListener('click', () => {
        accountColorInput.value = color;
        this.updateColorSelection(color);
      });

      defaultColorsContainer.appendChild(colorDot);
    });

    // Set initial selection
    if (defaultColors.length > 0) {
      this.updateColorSelection(accountColorInput.value || defaultColors[0]);
    }
  }

  private updateColorSelection(selectedColor: string) {
    const colorDots = this.modal.querySelectorAll('.color-dot');
    const customColorBtn = this.modal.querySelector('#account-others-color-btn') as HTMLElement;
    
    // Remove active class from all dots
    colorDots.forEach(dot => dot.classList.remove('active'));
    customColorBtn.classList.remove('active');

    // Find and activate matching color dot
    let foundMatch = false;
    colorDots.forEach(dot => {
      const dotColor = (dot as HTMLElement).style.backgroundColor;
      const dotHex = this.rgbToHex(dotColor);
      if (dotHex.toLowerCase() === selectedColor.toLowerCase()) {
        dot.classList.add('active');
        foundMatch = true;
      }
    });

    // If no match found, activate custom color button
    if (!foundMatch) {
      customColorBtn.classList.add('active');
      customColorBtn.style.backgroundColor = selectedColor;
    }
  }

  private rgbToHex(rgb: string): string {
    if (rgb.startsWith('#')) return rgb;
    
    const result = rgb.match(/\d+/g);
    if (!result || result.length < 3) return rgb;
    
    const r = parseInt(result[0]);
    const g = parseInt(result[1]);
    const b = parseInt(result[2]);
    
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  private addNewRole() {
    const newRole: CloudRole = {
      id: this.generateId(),
      name: '',
      enable: true,
      keywords: [],
      highlightColor: '#ffeb3b',
      highlightStyle: {
        textColor: '#000000',
        backgroundColor: '#ffeb3b',
        fontWeight: 'normal',
        textDecoration: 'none',
        border: 'none'
      },
      created: Date.now(),
      modified: Date.now()
    };

    this.roles.push(newRole);
    this.renderRolesTable();
    
    // Start editing the new role immediately
    this.editRole(this.roles.length - 1);
  }

  private editRole(index: number) {
    // Save any currently editing role first
    if (this.editingRoleIndex !== -1) {
      this.saveCurrentRole();
    }

    this.editingRoleIndex = index;
    this.renderRolesTable();
  }

  private saveCurrentRole() {
    if (this.editingRoleIndex === -1) return;

    const row = this.modal.querySelector(`[data-role-index="${this.editingRoleIndex}"]`) as HTMLTableRowElement;
    if (!row) return;

    const role = this.roles[this.editingRoleIndex];
    
    // Get values from form inputs
    const nameInput = row.querySelector('.role-name-input') as HTMLInputElement;
    const keywordsInput = row.querySelector('.role-keywords-input') as HTMLTextAreaElement;
    const colorPicker = row.querySelector('.role-color-picker') as HTMLInputElement;
    const enableSwitch = row.querySelector('.role-enable-switch input') as HTMLInputElement;

    if (nameInput && keywordsInput && colorPicker) {
      role.name = nameInput.value.trim();
      role.keywords = keywordsInput.value.split(',').map(k => k.trim()).filter(k => k.length > 0);
      role.highlightColor = colorPicker.value;
      role.enable = enableSwitch ? enableSwitch.checked : true;
      role.modified = Date.now();

      // Update highlight style with the new color
      role.highlightStyle = {
        ...role.highlightStyle,
        backgroundColor: colorPicker.value,
        textColor: this.getContrastColor(colorPicker.value)
      };
    }

    this.editingRoleIndex = -1;
  }

  private deleteRole(index: number) {
    if (confirm('Are you sure you want to delete this role?')) {
      this.roles.splice(index, 1);
      if (this.editingRoleIndex === index) {
        this.editingRoleIndex = -1;
      } else if (this.editingRoleIndex > index) {
        this.editingRoleIndex--;
      }
      this.renderRolesTable();
    }
  }

  private renderRolesTable() {
    const tableBody = this.modal.querySelector('#roles-table-body') as HTMLTableSectionElement;
    const noRolesMessage = this.modal.querySelector('#no-roles-message') as HTMLElement;
    const rolesTable = this.modal.querySelector('#roles-table') as HTMLTableElement;

    if (this.roles.length === 0) {
      tableBody.innerHTML = '';
      noRolesMessage.style.display = 'block';
      rolesTable.style.display = 'none';
      return;
    }

    noRolesMessage.style.display = 'none';
    rolesTable.style.display = 'table';
    tableBody.innerHTML = '';

    this.roles.forEach((role, index) => {
      const row = document.createElement('tr');
      row.setAttribute('data-role-index', index.toString());

      if (this.editingRoleIndex === index) {
        // Editing mode
        row.innerHTML = `
          <td>
            <div class="role-enable-switch">
              <label class="switch">
                <input type="checkbox" ${role.enable ? 'checked' : ''} />
                <span class="slider"></span>
              </label>
            </div>
          </td>
          <td>
            <input type="text" class="role-name-input" value="${this.escapeHtml(role.name)}" placeholder="Role name" />
          </td>
          <td>
            <textarea class="role-keywords-input" placeholder="keyword1, keyword2, keyword3">${this.escapeHtml(role.keywords.join(', '))}</textarea>
          </td>
          <td>
            <input type="color" class="role-color-picker" value="${role.highlightColor}" />
          </td>
          <td>
            <div class="role-actions">
              <button type="button" class="role-action-btn role-save-btn" data-action="save" data-index="${index}">
                <i class="fas fa-check"></i>
              </button>
              <button type="button" class="role-action-btn role-cancel-btn" data-action="cancel" data-index="${index}">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </td>
        `;
      } else {
        // Display mode
        const keywordsDisplay = role.keywords.length > 0 ? role.keywords.join(', ') : 'No keywords';
        const enabledDisplay = role.enable ? '✓' : '✗';
        
        row.innerHTML = `
          <td style="text-align: center; color: ${role.enable ? '#28a745' : '#dc3545'};">
            ${enabledDisplay}
          </td>
          <td>${this.escapeHtml(role.name || 'Unnamed Role')}</td>
          <td>${this.escapeHtml(keywordsDisplay)}</td>
          <td style="text-align: center;">
            <div style="width: 24px; height: 24px; background-color: ${role.highlightColor}; border: 1px solid var(--border-color); border-radius: 4px; margin: 0 auto;"></div>
          </td>
          <td>
            <div class="role-actions">
              <button type="button" class="role-action-btn role-edit-btn" data-action="edit" data-index="${index}">
                <i class="fas fa-edit"></i>
              </button>
              <button type="button" class="role-action-btn role-delete-btn" data-action="delete" data-index="${index}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        `;
      }

      tableBody.appendChild(row);
    });

    // Bind action events
    this.bindRoleActionEvents();
  }

  private bindRoleActionEvents() {
    const actionButtons = this.modal.querySelectorAll('.role-action-btn');
    
    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const action = (button as HTMLElement).getAttribute('data-action');
        const index = parseInt((button as HTMLElement).getAttribute('data-index') || '0');

        switch (action) {
          case 'edit':
            this.editRole(index);
            break;
          case 'delete':
            this.deleteRole(index);
            break;
          case 'save':
            this.saveCurrentRole();
            this.renderRolesTable();
            break;
          case 'cancel':
            // If this is a new role with no name, remove it
            if (this.roles[index] && !this.roles[index].name.trim()) {
              this.roles.splice(index, 1);
            }
            this.editingRoleIndex = -1;
            this.renderRolesTable();
            break;
        }
      });
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private getContrastColor(hexColor: string): string {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light colors, white for dark colors
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  private generateId(): string {
    return 'role_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private handleSave() {
    // Save any currently editing role first
    if (this.editingRoleIndex !== -1) {
      this.saveCurrentRole();
    }

    // Validate form data
    const accountName = (this.modal.querySelector('#account-name') as HTMLInputElement).value.trim();
    const matchPattern = (this.modal.querySelector('#match-pattern') as HTMLSelectElement).value;
    const matchValue = (this.modal.querySelector('#match-value') as HTMLInputElement).value.trim();
    const accountColor = (this.modal.querySelector('#account-color') as HTMLInputElement).value;

    if (!accountName) {
      alert('Please enter an account name.');
      return;
    }

    if (!matchValue) {
      alert('Please enter a match value.');
      return;
    }

    // Create account configuration
    const accountConfig: CloudAccount = {
      id: this.editingAccount?.id || this.generateAccountId(),
      name: accountName,
      enable: this.accountEnableSwitch.isChecked(),
      matchPattern,
      matchValue,
      color: accountColor,
      backgroundEnable: this.backgroundEnableSwitch.isChecked(),
      roles: [...this.roles], // Create a copy of roles array
      created: this.editingAccount?.created || Date.now(),
      modified: Date.now()
    };

    if (this.onSaveCallback) {
      this.onSaveCallback(accountConfig);
    }

    this.close();
  }

  private generateAccountId(): string {
    return 'account_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  public open(
    environment: CloudEnvironment, 
    defaultColors: string[], 
    account?: CloudAccount, 
    onSave?: (account: CloudAccount) => void
  ) {
    this.currentEnvironment = environment;
    
    if (onSave) {
      this.onSaveCallback = onSave;
    }

    const form = this.modal.querySelector('#add-cloud-account-form') as HTMLFormElement;
    const title = this.modal.querySelector('.modal-header h3') as HTMLElement;
    const saveBtn = this.modal.querySelector('.save-btn') as HTMLButtonElement;

    // Setup default colors
    this.setupDefaultColors(defaultColors);

    if (account) {
      // Edit mode
      this.editingAccount = account;
      title.textContent = 'Edit Cloud Account';
      saveBtn.textContent = 'Update Account';

      // Populate form fields
      (this.modal.querySelector('#account-name') as HTMLInputElement).value = account.name;
      (this.modal.querySelector('#match-pattern') as HTMLSelectElement).value = account.matchPattern;
      (this.modal.querySelector('#match-value') as HTMLInputElement).value = account.matchValue;
      (this.modal.querySelector('#account-color') as HTMLInputElement).value = account.color;

      this.accountEnableSwitch.setChecked(account.enable);
      this.backgroundEnableSwitch.setChecked(account.backgroundEnable);

      // Copy roles for editing
      this.roles = account.roles.map(role => ({ ...role }));
      
      // Update color selection
      this.updateColorSelection(account.color);
    } else {
      // Create mode
      this.editingAccount = null;
      title.textContent = 'Add New Cloud Account';
      saveBtn.textContent = 'Create Account';
      
      form.reset();
      this.accountEnableSwitch.setChecked(true);
      this.backgroundEnableSwitch.setChecked(true);
      
      // Initialize with default color
      const defaultColor = defaultColors.length > 0 ? defaultColors[0] : '#4a9eff';
      (this.modal.querySelector('#account-color') as HTMLInputElement).value = defaultColor;
      this.updateColorSelection(defaultColor);
      
      // Clear roles
      this.roles = [];
    }

    // Reset editing state
    this.editingRoleIndex = -1;
    
    // Render roles table
    this.renderRolesTable();

    // Show modal
    document.body.appendChild(this.modal);
    setTimeout(() => {
      this.modal.classList.add('show');
    }, 10);
  }

  public close() {
    this.modal.classList.remove('show');
    // Wait for transition animation to complete before removing element
    setTimeout(() => {
      if (this.modal.parentElement) {
        this.modal.parentElement.removeChild(this.modal);
      }
    }, 300);
  }

  public onSave(callback: (account: CloudAccount) => void) {
    this.onSaveCallback = callback;
  }
}