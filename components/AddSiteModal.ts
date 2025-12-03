import { SwitchComponent } from './SwitchComponent';
// @ts-ignore
import Pickr from '@simonwep/pickr';
// @ts-ignore
import '@simonwep/pickr/dist/themes/classic.min.css';

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
  private enableSwitch!: SwitchComponent;
  private backgroundSwitch!: SwitchComponent;
  private flagSwitch!: SwitchComponent;
  private positionSelect!: HTMLSelectElement;
  private colorPicker!: Pickr;

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
            <div class="form-row modal-enable-row">
              <div class="form-group switch-group">
                <label>Enable:</label>
                <div id="enable-switch"></div>
              </div>
              <div class="form-group modal-name-group">
                <label for="env-name">Name:</label>
                <input type="text" id="env-name" placeholder="e.g. dev" required />
              </div>
            </div>
            
            <div class="form-row modal-pattern-color-row">
              <div class="form-group modal-pattern-group">
                <label for="match-pattern">Pattern:</label>
                <select id="match-pattern" required>
                  <option value="regex">Regex</option>
                  <option value="urlPrefix">URL Prefix</option>
                  <option value="domain" selected>Domain</option>
                </select>
              </div>
              <div class="form-group modal-color-group">
                <label for="color">Color:</label>
                <div id="color-picker-container"></div>
              </div>
            </div>
            
            <div class="form-group modal-value-group">
              <label for="match-value">Value:</label>
              <input type="text" id="match-value" placeholder="e.g. baidu.com" required />
            </div>
            
            <div class="form-row modal-flag-row">
              <div class="form-group flag-enable-group">
                <label>Flag Enable:</label>
                <div id="flag-switch"></div>
              </div>
              <div class="form-group modal-position-group">
                <label for="position">Position:</label>
                <select id="position" required>
                  <option value="leftTop">Left Top</option>
                  <option value="rightTop">Right Top</option>
                  <option value="leftBottom">Left Bottom</option>
                  <option value="rightBottom">Right Bottom</option>
                </select>
              </div>
            </div>
            
            <div class="form-row modal-background-row">
              <div class="form-group background-enable-group">
                <label>Background Enable:</label>
                <div id="background-switch"></div>
              </div>
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
    
    // 初始化颜色选择器
    const colorPickerContainer = this.modal.querySelector('#color-picker-container') as HTMLElement;
    this.colorPicker = Pickr.create({
      el: colorPickerContainer,
      theme: 'classic',
      default: '#8ac64d',
      swatches: [
        '#8ac64d',
        '#018fd0',
        '#ea582f'
      ],
      components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: {
          hex: true,
          rgba: true,
          hsla: false,
          hsva: false,
          cmyk: false,
          input: true,
          clear: false,
          save: true
        }
      }
    });

    // 获取position下拉菜单引用
    this.positionSelect = this.modal.querySelector('#position') as HTMLSelectElement;
    
    // 初始隐藏position选择器
    const positionGroup = this.modal.querySelector('.modal-position-group') as HTMLElement;
    positionGroup.style.display = 'none';
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
    
    // 当flag开关切换时，显示/隐藏position选择器
    this.flagSwitch.onChange((checked) => {
      const positionGroup = this.modal.querySelector('.modal-position-group') as HTMLElement;
      if (checked) {
        positionGroup.style.display = 'block';
      } else {
        positionGroup.style.display = 'none';
      }
    });
  }

  private handleSave() {
    // 获取表单数据
    const matchPattern = (this.modal.querySelector('#match-pattern') as HTMLSelectElement).value;
    const matchValue = (this.modal.querySelector('#match-value') as HTMLInputElement).value;
    const envName = (this.modal.querySelector('#env-name') as HTMLInputElement).value;
    const color = this.colorPicker.getColor().toHEXA().toString();
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

  public open() {
    // 重置表单
    const form = this.modal.querySelector('#add-site-form') as HTMLFormElement;
    form.reset();
    
    // 重置开关状态
    this.enableSwitch.setChecked(false);
    this.backgroundSwitch.setChecked(false);
    this.flagSwitch.setChecked(false);
    
    // 设置颜色选择器为默认值
    this.colorPicker.setColor('#8ac64d');
    
    // 隐藏position选择器
    const positionGroup = this.modal.querySelector('.modal-position-group') as HTMLElement;
    positionGroup.style.display = 'none';
    
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