import { AppConfig, CloudEnvironment, CloudAccount } from '../types';
import { CloudConfigurationManager } from './CloudConfigurationManager';
import { SwitchComponent } from '../../../components/SwitchComponent';
import { AddCloudEnvironmentModal } from '../../../components/AddCloudEnvironmentModal';
import { AddCloudAccountModal } from '../../../components/AddCloudAccountModal';

/**
 * CloudRolesTab
 * Manages the Cloud Roles tab UI with environment list rendering and expand/collapse functionality
 */
export class CloudRolesTab {
  private appConfig: AppConfig;
  private cloudConfigManager: CloudConfigurationManager;
  private notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  private saveConfigCallback: () => void;

  constructor(
    appConfig: AppConfig,
    cloudConfigManager: CloudConfigurationManager,
    notificationCallback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void,
    saveConfigCallback: () => void
  ) {
    this.appConfig = appConfig;
    this.cloudConfigManager = cloudConfigManager;
    this.notificationCallback = notificationCallback;
    this.saveConfigCallback = saveConfigCallback;
  }

  /**
   * Initialize the Cloud Roles tab
   */
  public initializeCloudRolesTab(): void {
    this.setupTabNavigation();
    this.setupAddEnvironmentButton();
    this.renderEnvironmentList();
  }

  /**
   * Update configuration reference
   */
  public updateConfig(config: AppConfig): void {
    this.appConfig = config;
    this.renderEnvironmentList();
  }

  /**
   * Setup tab navigation functionality
   */
  private setupTabNavigation(): void {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const tabId = target.getAttribute('data-tab');

        // Remove active class from all tabs and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to clicked tab and corresponding content
        target.classList.add('active');
        const targetContent = document.getElementById(`${tabId}-tab-content`);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  }

  /**
   * Setup Add Environment button
   */
  private setupAddEnvironmentButton(): void {
    const addEnvironmentBtn = document.getElementById('add-cloud-environment');
    if (addEnvironmentBtn) {
      addEnvironmentBtn.addEventListener('click', () => {
        this.showAddEnvironmentModal();
      });
    }
  }

  /**
   * Render the environment list with expand/collapse functionality
   */
  public renderEnvironmentList(): void {
    const container = document.getElementById('cloud-environments-container');
    if (!container) return;

    const environments = this.cloudConfigManager.getCloudEnvironments();

    if (environments.length === 0) {
      container.innerHTML = `
        <div class="empty-environment-message">
          <i class="fas fa-cloud"></i>
          <div>No cloud environments configured</div>
          <div style="margin-top: 10px; font-size: 0.9em;">
            Click "Add Environment" to get started with cloud role highlighting
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = '';

    environments.forEach(environment => {
      const environmentElement = this.createEnvironmentElement(environment);
      container.appendChild(environmentElement);
    });
  }

  /**
   * Create environment element with consistent layout (no expand/collapse, always show accounts)
   */
  private createEnvironmentElement(environment: CloudEnvironment): HTMLElement {
    const environmentDiv = document.createElement('div');
    environmentDiv.className = 'cloud-environment';
    environmentDiv.setAttribute('data-environment-id', environment.id);

    // Environment header with consistent layout (title left, actions right)
    const header = document.createElement('div');
    header.className = 'environment-header';
    header.innerHTML = `
      <div class="environment-header-left">
        <div class="environment-toggle"></div>
        <div>
          <h3 class="environment-title">${this.escapeHtml(environment.name)}</h3>
          <div class="environment-provider">${environment.provider} • ${environment.accounts.length} accounts</div>
        </div>
      </div>
      <div class="environment-header-actions">
        <button class="add-account-btn" title="Add Account">
          <i class="fas fa-plus"></i> Add Account
        </button>
        <button class="group-edit-btn" title="Edit Environment">
          <i class="fas fa-edit"></i>
        </button>
        <button class="group-delete-btn" title="Delete Environment">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    // Add environment toggle switch
    const toggleContainer = header.querySelector('.environment-toggle');
    if (toggleContainer) {
      const toggleSwitch = new SwitchComponent(
        toggleContainer as HTMLElement,
        '',
        `env-toggle-${environment.id}`,
        'local',
        environment.enable,
        false // don't persist to storage, we handle it manually
      );

      toggleSwitch.onChange((isChecked) => {
        environment.enable = isChecked;
        this.saveConfigCallback();
        this.updateEnvironmentVisualState(environmentDiv, environment);
      });
    }

    // Environment accounts container (always visible, no collapse)
    const accountsContainer = document.createElement('div');
    accountsContainer.className = 'environment-accounts expanded';

    // Render accounts for this environment
    this.renderAccountsForEnvironment(environment, accountsContainer);

    // Add click handlers
    this.setupEnvironmentHandlers(header, accountsContainer, environment);

    // Assemble the environment element
    environmentDiv.appendChild(header);
    environmentDiv.appendChild(accountsContainer);

    // Update visual state based on enable status
    this.updateEnvironmentVisualState(environmentDiv, environment);

    return environmentDiv;
  }

  /**
   * Setup event handlers for environment element (simplified, no expand/collapse)
   */
  private setupEnvironmentHandlers(
    header: HTMLElement,
    accountsContainer: HTMLElement,
    environment: CloudEnvironment
  ): void {
    // Edit environment button
    const editBtn = header.querySelector('.group-edit-btn');
    editBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showEditEnvironmentModal(environment);
    });

    // Delete environment button
    const deleteBtn = header.querySelector('.group-delete-btn');
    deleteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteEnvironment(environment);
    });

    // Add account button (now in header)
    const addAccountBtn = header.querySelector('.add-account-btn');
    addAccountBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showAddAccountModal(environment);
    });
  }

  /**
   * Render accounts for a specific environment
   */
  public renderAccountsForEnvironment(environment: CloudEnvironment, container: HTMLElement): void {
    if (environment.accounts.length === 0) {
      container.innerHTML = `
        <div class="empty-environment-message">
          <div>No accounts configured for this environment</div>
          <div style="margin-top: 10px; font-size: 0.9em;">
            Click "Add Account" to configure cloud account highlighting
          </div>
        </div>
      `;
      return;
    }

    // Clear existing content
    const existingAccounts = container.querySelectorAll('.account-item');
    existingAccounts.forEach(item => item.remove());

    environment.accounts.forEach(account => {
      const accountElement = this.createAccountElement(environment, account);
      container.appendChild(accountElement);
    });
  }

  /**
   * Create account list item element
   */
  private createAccountElement(environment: CloudEnvironment, account: CloudAccount): HTMLElement {
    const accountDiv = document.createElement('div');
    accountDiv.className = 'account-item';
    accountDiv.setAttribute('data-account-id', account.id);

    accountDiv.innerHTML = `
      <div class="account-toggle"></div>
      <div class="account-info">
        <div class="account-main-info">
          <div class="account-name">${this.escapeHtml(account.name)}</div>
          <div class="account-color-indicator" style="background-color: ${account.color}"></div>
        </div>
        <div class="account-details">
          <span class="account-pattern">${this.escapeHtml(account.matchValue)}</span>
          <span class="account-roles-count">${account.roles.length} roles</span>
        </div>
      </div>
      <div class="account-actions">
        <button class="account-edit-btn btn btn-small">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="account-delete-btn btn btn-small">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;

    // Add account toggle switch
    const toggleContainer = accountDiv.querySelector('.account-toggle');
    if (toggleContainer) {
      const toggleSwitch = new SwitchComponent(
        toggleContainer as HTMLElement,
        '',
        `account-toggle-${account.id}`,
        'local',
        account.enable,
        false // don't persist to storage, we handle it manually
      );

      toggleSwitch.onChange((isChecked) => {
        account.enable = isChecked;
        this.saveConfigCallback();
        this.updateAccountVisualState(accountDiv, account);
      });
    }

    // Setup account handlers
    this.setupAccountHandlers(accountDiv, environment, account);

    // Update visual state
    this.updateAccountVisualState(accountDiv, account);

    return accountDiv;
  }

  /**
   * Setup event handlers for account element
   */
  private setupAccountHandlers(
    accountDiv: HTMLElement,
    environment: CloudEnvironment,
    account: CloudAccount
  ): void {
    // Edit account button
    const editBtn = accountDiv.querySelector('.account-edit-btn');
    editBtn?.addEventListener('click', () => {
      this.showEditAccountModal(environment, account);
    });

    // Delete account button
    const deleteBtn = accountDiv.querySelector('.account-delete-btn');
    deleteBtn?.addEventListener('click', () => {
      this.deleteAccount(environment, account);
    });
  }

  /**
   * Update environment visual state based on enable status
   */
  private updateEnvironmentVisualState(environmentDiv: HTMLElement, environment: CloudEnvironment): void {
    if (environment.enable) {
      environmentDiv.classList.remove('disabled');
    } else {
      environmentDiv.classList.add('disabled');
    }
  }

  /**
   * Update account visual state based on enable status
   */
  private updateAccountVisualState(accountDiv: HTMLElement, account: CloudAccount): void {
    if (account.enable) {
      accountDiv.classList.remove('disabled');
    } else {
      accountDiv.classList.add('disabled');
    }
  }

  /**
   * Show add environment modal
   */
  private showAddEnvironmentModal(): void {
    const modal = new AddCloudEnvironmentModal();
    modal.open(undefined, (environment: CloudEnvironment) => {
      const result = this.cloudConfigManager.addCloudEnvironment(environment);
      if (result.isValid) {
        this.renderEnvironmentList();
      }
    });
  }

  /**
   * Show edit environment modal
   */
  private showEditEnvironmentModal(environment: CloudEnvironment): void {
    const modal = new AddCloudEnvironmentModal();
    modal.open(environment, (updatedEnvironment: CloudEnvironment) => {
      const result = this.cloudConfigManager.updateCloudEnvironment(environment.id, updatedEnvironment);
      if (result.isValid) {
        this.renderEnvironmentList();
      }
    });
  }

  /**
   * Show add account modal
   */
  private showAddAccountModal(environment: CloudEnvironment): void {
    const addAccountModal = new AddCloudAccountModal();
    addAccountModal.open(
      environment,
      this.appConfig.defaultColors,
      undefined,
      (newAccount: CloudAccount) => {
        const result = this.cloudConfigManager.addCloudAccount(environment.id, newAccount);
        if (result.isValid) {
          this.saveConfigCallback();
          this.renderEnvironmentList();
          this.notificationCallback(`Account "${newAccount.name}" added successfully`, 'success');
        } else {
          this.notificationCallback(`Failed to add account: ${result.errors.join(', ')}`, 'error');
        }
      }
    );
  }

  /**
   * Show edit account modal
   */
  private showEditAccountModal(environment: CloudEnvironment, account: CloudAccount): void {
    const editAccountModal = new AddCloudAccountModal();
    editAccountModal.open(
      environment,
      this.appConfig.defaultColors,
      account,
      (updatedAccount: CloudAccount) => {
        const result = this.cloudConfigManager.updateCloudAccount(environment.id, account.id, updatedAccount);
        if (result.isValid) {
          this.saveConfigCallback();
          this.renderEnvironmentList();
          this.notificationCallback(`Account "${updatedAccount.name}" updated successfully`, 'success');
        } else {
          this.notificationCallback(`Failed to update account: ${result.errors.join(', ')}`, 'error');
        }
      }
    );
  }

  /**
   * Delete environment with confirmation
   */
  private deleteEnvironment(environment: CloudEnvironment): void {
    const accountCount = environment.accounts.length;
    const totalRoles = environment.accounts.reduce((sum, acc) => sum + acc.roles.length, 0);
    
    const confirmMessage = `Delete environment "${environment.name}"?\n\n` +
      `This will also delete:\n` +
      `• ${accountCount} accounts\n` +
      `• ${totalRoles} roles\n\n` +
      `This action cannot be undone.`;

    if (confirm(confirmMessage)) {
      const success = this.cloudConfigManager.deleteCloudEnvironment(environment.id);
      if (success) {
        this.renderEnvironmentList();
      }
    }
  }

  /**
   * Delete account with confirmation
   */
  private deleteAccount(environment: CloudEnvironment, account: CloudAccount): void {
    const roleCount = account.roles.length;
    
    const confirmMessage = `Delete account "${account.name}"?\n\n` +
      `This will also delete ${roleCount} roles.\n\n` +
      `This action cannot be undone.`;

    if (confirm(confirmMessage)) {
      const success = this.cloudConfigManager.deleteCloudAccount(environment.id, account.id);
      if (success) {
        this.renderEnvironmentList();
      }
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}