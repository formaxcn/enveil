import { SwitchComponent } from './SwitchComponent';
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
  private backgroundSwitch!: SwitchComponent;
  private flagSwitch!: SwitchComponent;
  private defaultColors: string[] = [];

  constructor() {
    // 创建模态框HTML结构
    this.modal = document.createElement('div');
    this.modal.className = 'modal';
    this.modal.innerHTML = modalTemplate;

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
    this.flagSwitch = new SwitchComponent(flagSwitchContainer, 'Corner Banner', 'modal-flag', 'local', false, false);
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
      this.updatePreview();
    });

    // Background switch logic
    this.backgroundSwitch.onChange(() => {
      this.updatePreview();
    });

    // Banner switch logic
    const positionContainer = this.modal.querySelector('#position-container') as HTMLElement;
    const positionSelect = this.modal.querySelector('#position') as HTMLSelectElement;

    this.flagSwitch.onChange((checked) => {
      if (checked) {
        positionContainer.classList.remove('hidden');
      } else {
        positionContainer.classList.add('hidden');
      }
      this.updatePreview();
    });

    positionSelect.addEventListener('change', () => {
      this.updatePreview();
    });

    // Environment name input logic
    const envNameInput = this.modal.querySelector('#env-name') as HTMLInputElement;
    envNameInput.addEventListener('input', () => {
      this.updatePreview();
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
        this.updatePreview();
      });

      container.appendChild(dot);
    });
  }

  private updateActiveColorDot(hex: string) {
    const dots = this.modal.querySelectorAll('.color-dot');
    const othersBtn = this.modal.querySelector('#others-color-btn') as HTMLElement;
    const isDefaultColor = this.defaultColors.some(c => c.toLowerCase() === hex.toLowerCase());

    dots.forEach(dot => {
      const dotColor = (dot as HTMLElement).dataset.color;
      if (dotColor && dotColor.toLowerCase() === hex.toLowerCase()) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    if (!isDefaultColor) {
      othersBtn.classList.add('active');
      othersBtn.style.background = hex;
      othersBtn.style.color = this.getContrastColor(hex);
    } else {
      othersBtn.classList.remove('active');
      othersBtn.style.background = '';
      othersBtn.style.color = '';
    }
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



    // Sync custom picker state
    (this.modal.querySelector('#custom-picker') as HTMLInputElement).value = initialColor;

    this.updatePreview();


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



    // Sync custom picker state
    (this.modal.querySelector('#custom-picker') as HTMLInputElement).value = initialColor;

    this.updatePreview();


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

  private updatePreview() {
    const previewContainer = this.modal.querySelector('.form-section-compact-refined') as HTMLElement;
    if (!previewContainer) return;

    const color = (this.modal.querySelector('#color') as HTMLInputElement).value;
    const backgroundEnable = this.backgroundSwitch.isChecked();
    const flagEnable = this.flagSwitch.isChecked();
    const position = (this.modal.querySelector('#position') as HTMLSelectElement).value;

    // 1. Update background color
    if (backgroundEnable) {
      // Create a soft background color using RGBA
      const rgba = this.hexToRgba(color, 0.15);
      previewContainer.style.backgroundColor = rgba;
    } else {
      previewContainer.style.backgroundColor = '';
    }

    // 2. Update Ribbon
    let ribbon = previewContainer.querySelector('.corner-ribbon') as HTMLElement;
    const envName = (this.modal.querySelector('#env-name') as HTMLInputElement).value;

    if (!ribbon) {
      ribbon = document.createElement('div');
      ribbon.className = 'corner-ribbon';
      previewContainer.appendChild(ribbon);
    }

    ribbon.textContent = envName || 'Preview';

    if (flagEnable) {
      ribbon.classList.remove('hidden');
      ribbon.style.backgroundColor = color;
      ribbon.className = `corner-ribbon ${position}`;
    } else {
      ribbon.classList.add('hidden');
    }
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
