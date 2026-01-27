import { SwitchComponent } from './SwitchComponent';
import { CloudEnvironment, CloudProvider, CloudTemplate } from '../entrypoints/options/types';
import { createCloudEnvironment } from '../utils/cloudUtils';
import { getCloudTemplate, getCloudTemplateNames } from '../utils/cloudTemplates';
import modalTemplate from './AddCloudEnvironmentModal.html?raw';
import './AddCloudEnvironmentModal.css';

export class AddCloudEnvironmentModal {
  private modal: HTMLElement;
  private onSaveCallback?: (environment: CloudEnvironment) => void;
  private editingEnvironment: CloudEnvironment | null = null;
  private enableSwitch!: SwitchComponent;

  constructor() {
    // Create modal HTML structure
    this.modal = document.createElement('div');
    this.modal.className = 'modal';
    this.modal.innerHTML = modalTemplate;

    this.initializeComponents();
    this.bindEvents();
  }

  private initializeComponents() {
    // Initialize enable switch
    const enableSwitchContainer = this.modal.querySelector('#enable-switch') as HTMLElement;
    this.enableSwitch = new SwitchComponent(
      enableSwitchContainer, 
      'Enable Environment', 
      'modal-env-enable', 
      'local', 
      true, // Default to enabled
      false // Don't persist to storage
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
    const form = this.modal.querySelector('#add-cloud-environment-form') as HTMLFormElement;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSave();
    });

    // Provider selection change event
    const providerSelect = this.modal.querySelector('#cloud-provider') as HTMLSelectElement;
    providerSelect.addEventListener('change', (e) => {
      const selectedProvider = (e.target as HTMLSelectElement).value as CloudProvider;
      this.handleProviderChange(selectedProvider);
    });
  }

  private handleProviderChange(provider: CloudProvider) {
    const templateSection = this.modal.querySelector('#template-section') as HTMLElement;
    const customSection = this.modal.querySelector('#custom-section') as HTMLElement;
    const templateProviderName = this.modal.querySelector('#template-provider-name') as HTMLElement;

    // Hide both sections initially
    templateSection.style.display = 'none';
    customSection.style.display = 'none';

    if (!provider) {
      return;
    }

    if (provider === CloudProvider.CUSTOM) {
      // Show custom configuration section
      customSection.style.display = 'block';
      this.clearTemplateFields();
    } else {
      // Show template section and apply hardcoded template
      templateSection.style.display = 'block';
      templateSection.setAttribute('data-provider', provider);
      
      const templateNames = getCloudTemplateNames();
      templateProviderName.textContent = templateNames[provider];
      
      this.applyHardcodedTemplate(provider);
    }
  }

  private applyHardcodedTemplate(provider: CloudProvider) {
    const template = getCloudTemplate(provider);
    
    // Fill template fields with hardcoded values
    const accountSelectionUrl = this.modal.querySelector('#account-selection-url') as HTMLInputElement;
    const consoleDomainPattern = this.modal.querySelector('#console-domain-pattern') as HTMLInputElement;
    const samlUrl = this.modal.querySelector('#saml-url') as HTMLInputElement;

    accountSelectionUrl.value = template.accountSelectionUrl;
    consoleDomainPattern.value = template.consoleDomainPattern;
    samlUrl.value = template.samlUrl || '';
  }

  private clearTemplateFields() {
    // Clear template fields when switching to custom
    const accountSelectionUrl = this.modal.querySelector('#account-selection-url') as HTMLInputElement;
    const consoleDomainPattern = this.modal.querySelector('#console-domain-pattern') as HTMLInputElement;
    const samlUrl = this.modal.querySelector('#saml-url') as HTMLInputElement;

    accountSelectionUrl.value = '';
    consoleDomainPattern.value = '';
    samlUrl.value = '';
  }

  private handleSave() {
    // Get form data
    const environmentName = (this.modal.querySelector('#environment-name') as HTMLInputElement).value.trim();
    const selectedProvider = (this.modal.querySelector('#cloud-provider') as HTMLSelectElement).value as CloudProvider;

    // Validate required fields
    if (!environmentName) {
      alert('Environment name is required');
      return;
    }

    if (!selectedProvider) {
      alert('Please select a cloud provider');
      return;
    }

    // Create cloud template based on provider selection
    let template: CloudTemplate;

    if (selectedProvider === CloudProvider.CUSTOM) {
      // Get custom configuration values
      const customAccountUrl = (this.modal.querySelector('#custom-account-selection-url') as HTMLInputElement).value.trim();
      const customConsolePattern = (this.modal.querySelector('#custom-console-domain-pattern') as HTMLInputElement).value.trim();
      const customSamlUrl = (this.modal.querySelector('#custom-saml-url') as HTMLInputElement).value.trim();

      // Get custom selectors
      const accountContainers = (this.modal.querySelector('#custom-account-containers') as HTMLTextAreaElement).value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      const roleElements = (this.modal.querySelector('#custom-role-elements') as HTMLTextAreaElement).value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      const consoleContainers = (this.modal.querySelector('#custom-console-containers') as HTMLTextAreaElement).value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      const consoleRoleElements = (this.modal.querySelector('#custom-console-role-elements') as HTMLTextAreaElement).value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Validate custom fields
      if (!customAccountUrl || !customConsolePattern) {
        alert('Account Selection URL and Console Domain Pattern are required for custom providers');
        return;
      }

      template = {
        provider: selectedProvider,
        name: 'Custom Cloud Provider',
        accountSelectionUrl: customAccountUrl,
        consoleDomainPattern: customConsolePattern,
        samlUrl: customSamlUrl || undefined,
        selectors: {
          accountSelection: {
            accountContainers,
            roleElements
          },
          console: {
            accountContainers: consoleContainers,
            roleElements: consoleRoleElements
          }
        }
      };
    } else {
      // Use hardcoded template
      template = getCloudTemplate(selectedProvider);
    }

    // Create or update cloud environment
    let cloudEnvironment: CloudEnvironment;

    if (this.editingEnvironment) {
      // Update existing environment
      cloudEnvironment = {
        ...this.editingEnvironment,
        name: environmentName,
        enable: this.enableSwitch.isChecked(),
        provider: selectedProvider,
        template: template,
        modified: Date.now()
      };
    } else {
      // Create new environment
      cloudEnvironment = createCloudEnvironment(environmentName, selectedProvider);
      cloudEnvironment.enable = this.enableSwitch.isChecked();
      cloudEnvironment.template = template;
    }

    if (this.onSaveCallback) {
      this.onSaveCallback(cloudEnvironment);
    }

    this.close();
  }

  public open(environment?: CloudEnvironment, onSave?: (environment: CloudEnvironment) => void) {
    if (onSave) {
      this.onSaveCallback = onSave;
    }

    const form = this.modal.querySelector('#add-cloud-environment-form') as HTMLFormElement;
    const title = this.modal.querySelector('.modal-header h3') as HTMLElement;
    const saveBtn = this.modal.querySelector('.save-btn') as HTMLButtonElement;

    if (environment) {
      // Edit mode
      this.editingEnvironment = environment;
      title.textContent = 'Edit Cloud Environment';
      saveBtn.textContent = 'Update Environment';

      // Fill form with existing data
      (this.modal.querySelector('#environment-name') as HTMLInputElement).value = environment.name;
      (this.modal.querySelector('#cloud-provider') as HTMLSelectElement).value = environment.provider;
      
      this.enableSwitch.setChecked(environment.enable);
      
      // Trigger provider change to show appropriate section
      this.handleProviderChange(environment.provider);

      // If custom provider, fill custom fields
      if (environment.provider === CloudProvider.CUSTOM) {
        (this.modal.querySelector('#custom-account-selection-url') as HTMLInputElement).value = environment.template.accountSelectionUrl;
        (this.modal.querySelector('#custom-console-domain-pattern') as HTMLInputElement).value = environment.template.consoleDomainPattern;
        (this.modal.querySelector('#custom-saml-url') as HTMLInputElement).value = environment.template.samlUrl || '';
        
        // Fill custom selectors
        (this.modal.querySelector('#custom-account-containers') as HTMLTextAreaElement).value = 
          environment.template.selectors.accountSelection.accountContainers.join('\n');
        (this.modal.querySelector('#custom-role-elements') as HTMLTextAreaElement).value = 
          environment.template.selectors.accountSelection.roleElements.join('\n');
        (this.modal.querySelector('#custom-console-containers') as HTMLTextAreaElement).value = 
          environment.template.selectors.console.accountContainers.join('\n');
        (this.modal.querySelector('#custom-console-role-elements') as HTMLTextAreaElement).value = 
          environment.template.selectors.console.roleElements.join('\n');
      }
    } else {
      // Create mode
      this.editingEnvironment = null;
      title.textContent = 'Add New Cloud Environment';
      saveBtn.textContent = 'Create Environment';
      
      // Reset form
      form.reset();
      this.enableSwitch.setChecked(true);
      
      // Hide template sections
      (this.modal.querySelector('#template-section') as HTMLElement).style.display = 'none';
      (this.modal.querySelector('#custom-section') as HTMLElement).style.display = 'none';
    }

    document.body.appendChild(this.modal);
    // Trigger show animation
    setTimeout(() => {
      this.modal.classList.add('show');
      // Focus on environment name input
      (this.modal.querySelector('#environment-name') as HTMLInputElement).focus();
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

  public onSave(callback: (environment: CloudEnvironment) => void) {
    this.onSaveCallback = callback;
  }
}