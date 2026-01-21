import { SwitchComponent } from './SwitchComponent';

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
  private backgroundSwitch!: SwitchComponent;
  private flagSwitch!: SwitchComponent;

  constructor() {
    // 创建模态框HTML结构
    this.modal = document.createElement('div');
    this.modal.className = 'modal';
    this.modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add New Site Configuration</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="add-site-form">
            <div class="form-group">
              <label for="match-pattern">Match Pattern:</label>
              <select id="match-pattern" required>
                <option value="everything">Everything</option>
                <option value="url">URL</option>
                <option value="urlPrefix">URLs starting with</option>
                <option value="domain" selected>URLs on the domain</option>
                <option value="regex">URLs matching the regexp</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="match-value">Match Value:</label>
              <input type="text" id="match-value" placeholder="e.g. baidu.com" required />
            </div>
            
            <div class="form-group">
              <label for="env-name">Environment Name:</label>
              <input type="text" id="env-name" placeholder="e.g. dev" required />
            </div>
            
            <div class="form-group">
              <label for="color">Color:</label>
              <input type="color" id="color" value="#FF0000" />
            </div>
            
            <div class="form-group">
              <label for="position">Position:</label>
              <select id="position" required>
                <option value="leftTop">Left Top</option>
                <option value="rightTop">Right Top</option>
                <option value="leftBottom">Left Bottom</option>
                <option value="rightBottom">Right Bottom</option>
              </select>
            </div>
            
            <div class="form-group switch-group">
              <label>Enable:</label>
              <div id="enable-switch"></div>
            </div>
            
            <div class="form-group switch-group">
              <label>Background Enable:</label>
              <div id="background-switch"></div>
            </div>
            
            <div class="form-group switch-group">
              <label>Flag Enable:</label>
              <div id="flag-switch"></div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="cancel-btn">Cancel</button>
              <button type="submit" class="save-btn">Save</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.initializeComponents();
    this.bindEvents();
  }

  private initializeComponents() {
    // 初始化开关组件
    const enableSwitchContainer = this.modal.querySelector('#enable-switch') as HTMLElement;
    this.enableSwitch = new SwitchComponent(enableSwitchContainer, '', 'modal-enable', 'local');
    this.enableSwitch.setChecked(false);

    const backgroundSwitchContainer = this.modal.querySelector('#background-switch') as HTMLElement;
    this.backgroundSwitch = new SwitchComponent(backgroundSwitchContainer, '', 'modal-background', 'local');
    this.backgroundSwitch.setChecked(false);

    const flagSwitchContainer = this.modal.querySelector('#flag-switch') as HTMLElement;
    this.flagSwitch = new SwitchComponent(flagSwitchContainer, '', 'modal-flag', 'local');
    this.flagSwitch.setChecked(false);
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
    const envName = (this.modal.querySelector('#env-name') as HTMLInputElement).value;
    const color = (this.modal.querySelector('#color') as HTMLInputElement).value;
    const position = (this.modal.querySelector('#position') as HTMLSelectElement).value;

    const siteConfig: SiteConfig = {
      enable: this.enableSwitch.isChecked(),
      matchPattern,
      matchValue,
      envName,
      color,
      backgroudEnable: this.backgroundSwitch.isChecked(),
      Position: position,
      flagEnable: this.flagSwitch.isChecked()
    };

    if (this.onSaveCallback) {
      this.onSaveCallback(siteConfig);
    }

    this.close();
  }

  public open(site?: SiteConfig, onSave?: (updatedSite: SiteConfig) => void) {
    if (onSave) {
      this.onSaveCallback = onSave;
    }

    const form = this.modal.querySelector('#add-site-form') as HTMLFormElement;
    const title = this.modal.querySelector('.modal-header h3') as HTMLElement;

    if (site) {
      this.editingSite = site;
      title.textContent = 'Edit Site Configuration';

      (this.modal.querySelector('#match-pattern') as HTMLSelectElement).value = site.matchPattern;
      (this.modal.querySelector('#match-value') as HTMLInputElement).value = site.matchValue;
      (this.modal.querySelector('#env-name') as HTMLInputElement).value = site.envName;
      (this.modal.querySelector('#color') as HTMLInputElement).value = site.color;
      (this.modal.querySelector('#position') as HTMLSelectElement).value = site.Position;

      this.enableSwitch.setChecked(site.enable);
      this.backgroundSwitch.setChecked(site.backgroudEnable);
      this.flagSwitch.setChecked(site.flagEnable);
    } else {
      this.editingSite = null;
      title.textContent = 'Add New Site Configuration';
      form.reset();
      this.enableSwitch.setChecked(false);
      this.backgroundSwitch.setChecked(false);
      this.flagSwitch.setChecked(false);
    }

    document.body.appendChild(this.modal);
    // 触发显示动画
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