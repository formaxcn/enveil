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
  private defaultColors: string[] = [];

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
            <div class="form-row env-enable-row">
              <div id="enable-switch" class="top-enable-switch"></div>
              <div class="form-group env-name-group">
                <label for="env-name">Environment Name</label>
                <input type="text" id="env-name" class="form-control" placeholder="e.g. dev" required />
              </div>
            </div>

            <div class="form-row match-row">
              <div class="form-group match-pattern-group">
                <label for="match-pattern">Match Pattern</label>
                <select id="match-pattern" class="form-control" required>
                  <option value="everything" selected>Everything</option>
                  <option value="url">Full URL</option>
                  <option value="urlPrefix">Starts with</option>
                  <option value="domain">Domain</option>
                  <option value="regex">Regex Match</option>
                </select>
              </div>
              <div class="form-group match-value-group">
                <label for="match-value">Match Value</label>
                <input type="text" id="match-value" class="form-control" placeholder="e.g. baidu.com" required />
              </div>
            </div>
            
            <div class="form-section-compact-refined">
              <div class="form-row switches-grid-row">
                <div class="grid-col" id="background-switch"></div>
                <div class="grid-col" id="flag-switch"></div>
                <div class="grid-col hidden" id="position-container">
                  <div class="form-group position-group" style="margin-bottom: 0;">
                    <select id="position" class="form-control" required>
                      <option value="leftTop">Top Left Corner</option>
                      <option value="rightTop">Top Right Corner</option>
                      <option value="leftBottom">Bottom Left Corner</option>
                      <option value="rightBottom">Bottom Right Corner</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="form-row theme-color-row">
                <div class="form-group full-width">
                  <label>Theme Color Selection</label>
                  <input type="hidden" id="color" value="#4a9eff" />
                  <div class="modal-color-selection">
                    <div class="modal-default-colors-header" style="position: relative;">
                      <div id="modal-default-colors" class="modal-default-colors"></div>
                      <div style="position: relative; display: inline-block;">
                        <div id="others-color-btn" class="color-dot custom-color-dot" title="Custom Color">
                          <i class="fas fa-palette"></i>
                        </div>
                        <input type="color" id="custom-picker" class="unified-color-picker" style="position: absolute; top: 100%; left: 0; opacity: 0; width: 28px; height: 28px; pointer-events: none; margin-top: -10px;" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            
            <div class="form-actions">
              <button type="button" class="btn btn-secondary cancel-btn">Cancel</button>
              <button type="submit" class="btn btn-primary save-btn">Save Configuration</button>
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
    this.enableSwitch = new SwitchComponent(enableSwitchContainer, 'Enable Configuration', 'modal-enable', 'local', false, false);

    const backgroundSwitchContainer = this.modal.querySelector('#background-switch') as HTMLElement;
    this.backgroundSwitch = new SwitchComponent(backgroundSwitchContainer, 'Background Effect', 'modal-background', 'local', false, false);

    const flagSwitchContainer = this.modal.querySelector('#flag-switch') as HTMLElement;
    this.flagSwitch = new SwitchComponent(flagSwitchContainer, 'Show Banner', 'modal-flag', 'local', false, false);
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

    // Others 圆形按钮直接触发原生颜色选择器
    const othersBtn = this.modal.querySelector('#others-color-btn') as HTMLElement;
    const picker = this.modal.querySelector('#custom-picker') as HTMLInputElement;
    const mainColorInput = this.modal.querySelector('#color') as HTMLInputElement;

    othersBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // 临时启用 pointer-events 以确保可触发
      picker.style.pointerEvents = 'auto';
      picker.click(); // 直接触发原生颜色选择器
      // 延迟恢复以避免影响选择器弹出
      setTimeout(() => {
        picker.style.pointerEvents = 'none';
      }, 100);
    });

    // 颜色选择器变化时，更新主 color input 和 Others 按钮背景色
    picker.addEventListener('input', (e) => {
      const hex = (e.target as HTMLInputElement).value.toUpperCase();
      mainColorInput.value = hex;
      this.updateActiveColorDot(hex);

      // 更新 Others 圆形按钮背景色，并添加 active 状态
      othersBtn.style.backgroundColor = hex;
      othersBtn.style.color = this.getContrastColor(hex);
      othersBtn.classList.add('active');
    });

    // Banner switch logic
    const positionContainer = this.modal.querySelector('#position-container') as HTMLElement;
    this.flagSwitch.onChange((checked) => {
      if (checked) {
        positionContainer.classList.remove('hidden');
      } else {
        positionContainer.classList.add('hidden');
      }
    });
  }

  private renderDefaultColorsRow() {
    const container = this.modal.querySelector('#modal-default-colors') as HTMLElement;
    container.innerHTML = '';

    this.defaultColors.forEach(color => {
      const dot = document.createElement('div');
      dot.className = 'color-dot';
      dot.style.backgroundColor = color;
      dot.dataset.color = color;
      dot.addEventListener('click', () => {
        (this.modal.querySelector('#color') as HTMLInputElement).value = color;
        this.updateActiveColorDot(color);

        // Hide custom area if a default dot is clicked
        const othersBtn = this.modal.querySelector('#others-color-btn') as HTMLButtonElement;
        const customArea = this.modal.querySelector('#custom-color-picker-area') as HTMLElement;
        othersBtn.classList.remove('active');
        customArea.classList.add('hidden');
      });
      container.appendChild(dot);
    });
  }

  private updateActiveColorDot(hex: string) {
    const dots = this.modal.querySelectorAll('.color-dot');
    dots.forEach(dot => {
      if ((dot as HTMLElement).dataset.color?.toLowerCase() === hex.toLowerCase()) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  // 根据背景色计算对比文字颜色
  private getContrastColor(hexColor: string): string {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155 ? '#000000' : '#ffffff';
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

  public open(defaultColors: string[], site?: SiteConfig, onSave?: (updatedSite: SiteConfig) => void) {
    this.defaultColors = defaultColors;
    if (onSave) {
      this.onSaveCallback = onSave;
    }

    const form = this.modal.querySelector('#add-site-form') as HTMLFormElement;
    const title = this.modal.querySelector('.modal-header h3') as HTMLElement;

    let initialColor = '#4a9eff';

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
      const positionContainer = this.modal.querySelector('#position-container') as HTMLElement;
      if (site.flagEnable) {
        positionContainer.classList.remove('hidden');
      } else {
        positionContainer.classList.add('hidden');
      }
      initialColor = site.color;
    } else {
      this.editingSite = null;
      title.textContent = 'Add New Site Configuration';
      form.reset();
      this.enableSwitch.setChecked(false);
      this.backgroundSwitch.setChecked(false);
      this.flagSwitch.setChecked(false);
      if (this.defaultColors.length > 0) {
        initialColor = this.defaultColors[0];
      }
      (this.modal.querySelector('#color') as HTMLInputElement).value = initialColor;
    }

    this.renderDefaultColorsRow();
    this.updateActiveColorDot(initialColor);

    // Reset Others 圆形按钮样式
    const othersBtn = this.modal.querySelector('#others-color-btn') as HTMLElement;
    othersBtn.style.backgroundColor = '';
    othersBtn.style.color = '';
    othersBtn.classList.remove('active');

    // Sync custom picker state
    (this.modal.querySelector('#custom-picker') as HTMLInputElement).value = initialColor;

    document.body.appendChild(this.modal);
    // 触发显示动画
    setTimeout(() => {
      this.modal.classList.add('show');
    }, 10);
  }

  public openWithDefaults(defaultColors: string[], domain: string, pattern: string): void {
    this.defaultColors = defaultColors;
    const form = this.modal.querySelector('#add-site-form') as HTMLFormElement;
    const title = this.modal.querySelector('.modal-header h3') as HTMLElement;

    this.editingSite = null;
    title.textContent = 'Add New Site Configuration';
    form.reset();

    (this.modal.querySelector('#match-pattern') as HTMLSelectElement).value = pattern;
    (this.modal.querySelector('#match-value') as HTMLInputElement).value = domain;

    this.enableSwitch.setChecked(false);
    this.backgroundSwitch.setChecked(false);
    this.flagSwitch.setChecked(false);
    (this.modal.querySelector('#position-container') as HTMLElement).classList.add('hidden');

    let initialColor = '#4a9eff';
    if (this.defaultColors.length > 0) {
      initialColor = this.defaultColors[0];
    }
    (this.modal.querySelector('#color') as HTMLInputElement).value = initialColor;

    this.renderDefaultColorsRow();
    this.updateActiveColorDot(initialColor);

    // Reset Others 圆形按钮样式
    const othersBtn = this.modal.querySelector('#others-color-btn') as HTMLElement;
    othersBtn.style.backgroundColor = '';
    othersBtn.style.color = '';
    othersBtn.classList.remove('active');

    // Sync custom picker state
    (this.modal.querySelector('#custom-picker') as HTMLInputElement).value = initialColor;

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