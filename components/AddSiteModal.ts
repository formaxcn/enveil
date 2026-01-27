import { SwitchComponent } from './SwitchComponent';
import { PreviewComponent, PreviewConfig } from './PreviewComponent';
import modalTemplate from './AddSiteModal.html?raw';
import './AddSiteModal.css';

// 定义网站配置结构类型
interface SiteConfig {
  enable: boolean;
  matchPattern: string;
  matchValue: string;
  envName: string;
  color: string;
  backgroudEnable: boolean;
  Position: string;
  flagEnable: boolean;
}

export class AddSiteModal {
  private modal: HTMLElement;
  private onSaveCallback?: (site: SiteConfig) => void;
  private editingSite: SiteConfig | null = null;
  private enableSwitch!: SwitchComponent;
  private previewComponent!: PreviewComponent;

  constructor() {
    // 创建模态框HTML结构
    this.modal = document.createElement('div');
    this.modal.className = 'modal';
    this.modal.innerHTML = modalTemplate;

    this.initializeComponents();
    this.bindEvents();
  }

  private initializeComponents() {
    // 初始化启用开关
    const enableSwitchContainer = this.modal.querySelector('#enable-switch') as HTMLElement;
    this.enableSwitch = new SwitchComponent(enableSwitchContainer, 'Enable Configuration', 'modal-enable', 'local', false, false);
  }

  private bindEvents() {
    // 关闭按钮事件
    const closeBtn = this.modal.querySelector('.modal-close') as HTMLButtonElement;
    const cancelBtn = this.modal.querySelector('.cancel-btn') as HTMLButtonElement;
    const overlay = this.modal.querySelector('.modal-overlay') as HTMLElement;

    const closeHandler = () => {
      this.close();
    };

    closeBtn.addEventListener('click', closeHandler);
    cancelBtn.addEventListener('click', closeHandler);
    overlay.addEventListener('click', closeHandler);

    // 表单提交事件
    const form = this.modal.querySelector('#add-site-form') as HTMLFormElement;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSave();
    });
  }

  private handleSave() {
    // 获取表单数据
    const matchPattern = (this.modal.querySelector('#match-pattern') as HTMLSelectElement).value;
    const matchValue = (this.modal.querySelector('#match-value') as HTMLInputElement).value;
    
    const previewConfig = this.previewComponent.getConfig();

    const siteConfig: SiteConfig = {
      enable: this.enableSwitch.isChecked(),
      matchPattern,
      matchValue,
      envName: previewConfig.envName,
      color: previewConfig.color,
      backgroudEnable: previewConfig.backgroundEnable,
      Position: previewConfig.position || 'leftTop',
      flagEnable: previewConfig.flagEnable
    };

    if (this.onSaveCallback) {
      this.onSaveCallback(siteConfig);
    }

    this.close();
  }

  public open(defaultColors: string[], site?: SiteConfig, onSave?: (updatedSite: SiteConfig) => void) {
    if (onSave) {
      this.onSaveCallback = onSave;
    }

    const form = this.modal.querySelector('#add-site-form') as HTMLFormElement;
    const title = this.modal.querySelector('.modal-header h3') as HTMLElement;

    let initialConfig: PreviewConfig = {
      envName: 'dev',
      color: defaultColors.length > 0 ? defaultColors[0] : '#4a9eff',
      backgroundEnable: false,
      flagEnable: false,
      position: 'leftTop'
    };

    if (site) {
      this.editingSite = site;
      title.textContent = 'Edit Site Configuration';

      (this.modal.querySelector('#match-pattern') as HTMLSelectElement).value = site.matchPattern;
      (this.modal.querySelector('#match-value') as HTMLInputElement).value = site.matchValue;

      this.enableSwitch.setChecked(site.enable);
      
      initialConfig = {
        envName: site.envName,
        color: site.color,
        backgroundEnable: site.backgroudEnable,
        flagEnable: site.flagEnable,
        position: site.Position
      };
    } else {
      this.editingSite = null;
      title.textContent = 'Add New Site Configuration';
      form.reset();
      this.enableSwitch.setChecked(false);
    }

    // 初始化预览组件
    const previewContainer = this.modal.querySelector('#preview-container') as HTMLElement;
    this.previewComponent = new PreviewComponent(
      previewContainer,
      initialConfig,
      defaultColors,
      {}, // 不需要回调，因为我们在保存时获取配置
      {
        showPositionSelect: true,
        showEnvNameInput: true,
        switchPrefix: 'modal'
      }
    );

    document.body.appendChild(this.modal);
    // 触发显示动画
    setTimeout(() => {
      this.modal.classList.add('show');
    }, 10);
  }

  public openWithDefaults(defaultColors: string[], domain: string, pattern: string): void {
    const form = this.modal.querySelector('#add-site-form') as HTMLFormElement;
    const title = this.modal.querySelector('.modal-header h3') as HTMLElement;

    this.editingSite = null;
    title.textContent = 'Add New Site Configuration';
    form.reset();

    (this.modal.querySelector('#match-pattern') as HTMLSelectElement).value = pattern;
    (this.modal.querySelector('#match-value') as HTMLInputElement).value = domain;

    this.enableSwitch.setChecked(false);

    const initialConfig: PreviewConfig = {
      envName: 'dev',
      color: defaultColors.length > 0 ? defaultColors[0] : '#4a9eff',
      backgroundEnable: false,
      flagEnable: false,
      position: 'leftTop'
    };

    // 初始化预览组件
    const previewContainer = this.modal.querySelector('#preview-container') as HTMLElement;
    this.previewComponent = new PreviewComponent(
      previewContainer,
      initialConfig,
      defaultColors,
      {},
      {
        showPositionSelect: true,
        showEnvNameInput: true,
        switchPrefix: 'modal'
      }
    );

    document.body.appendChild(this.modal);
    setTimeout(() => {
      this.modal.classList.add('show');
    }, 10);
  }

  public close() {
    this.modal.classList.remove('show');
    // 等待过渡动画结束后移除元素
    setTimeout(() => {
      if (this.modal.parentElement) {
        this.modal.parentElement.removeChild(this.modal);
      }
    }, 300);
  }

  public onSave(callback: (site: SiteConfig) => void) {
    this.onSaveCallback = callback;
  }
}