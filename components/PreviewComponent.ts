import { SwitchComponent } from './SwitchComponent';

// 预览组件配置接口
export interface PreviewConfig {
  envName: string;
  color: string;
  backgroundEnable: boolean;
  flagEnable: boolean;
  position?: string;
}

// 预览组件回调接口
export interface PreviewCallbacks {
  onEnvNameChange?: (envName: string) => void;
  onColorChange?: (color: string) => void;
  onBackgroundChange?: (enabled: boolean) => void;
  onFlagChange?: (enabled: boolean) => void;
  onPositionChange?: (position: string) => void;
}

export class PreviewComponent {
  private container: HTMLElement;
  private backgroundSwitch!: SwitchComponent;
  private flagSwitch!: SwitchComponent;
  private defaultColors: string[] = [];
  private callbacks: PreviewCallbacks = {};
  private config: PreviewConfig;
  private showPositionSelect: boolean;
  private showEnvNameInput: boolean;

  constructor(
    container: HTMLElement,
    config: PreviewConfig,
    defaultColors: string[],
    callbacks: PreviewCallbacks = {},
    options: {
      showPositionSelect?: boolean;
      showEnvNameInput?: boolean;
      switchPrefix?: string;
    } = {}
  ) {
    this.container = container;
    this.config = { ...config };
    this.defaultColors = defaultColors;
    this.callbacks = callbacks;
    this.showPositionSelect = options.showPositionSelect ?? true;
    this.showEnvNameInput = options.showEnvNameInput ?? true;

    this.render(options.switchPrefix || 'preview');
    this.initializeComponents(options.switchPrefix || 'preview');
    this.bindEvents();
    this.updatePreview();
  }

  private render(switchPrefix: string) {
    this.container.innerHTML = `
      ${this.showEnvNameInput ? `
      <div class="form-row env-name-row">
        <div class="form-group env-name-group">
          <label for="${switchPrefix}-env-name">Environment Name</label>
          <input type="text" id="${switchPrefix}-env-name" class="form-control" placeholder="e.g. dev" value="${this.config.envName}" />
        </div>
      </div>
      ` : ''}
      
      <div class="form-section-compact-refined">
        <div class="form-row switches-grid-row">
          <div class="grid-col" id="${switchPrefix}-background-switch"></div>
          <div class="grid-col" id="${switchPrefix}-flag-switch"></div>
          ${this.showPositionSelect ? `
          <div class="grid-col ${this.config.flagEnable ? '' : 'hidden'}" id="${switchPrefix}-position-container">
            <div class="form-group position-group">
              <select id="${switchPrefix}-position" class="form-control" required>
                <option value="leftTop" ${this.config.position === 'leftTop' ? 'selected' : ''}>Top Left</option>
                <option value="rightTop" ${this.config.position === 'rightTop' ? 'selected' : ''}>Top Right</option>
                <option value="leftBottom" ${this.config.position === 'leftBottom' ? 'selected' : ''}>Bottom Left</option>
                <option value="rightBottom" ${this.config.position === 'rightBottom' ? 'selected' : ''}>Bottom Right</option>
              </select>
            </div>
          </div>
          ` : ''}
        </div>
        <div class="form-row theme-color-row">
          <div class="form-group full-width">
            <label>Theme Color Selection</label>
            <input type="hidden" id="${switchPrefix}-color" value="${this.config.color}" />
            <div class="modal-color-selection">
              <div class="modal-default-colors-header">
                <div id="${switchPrefix}-default-colors" class="modal-default-colors"></div>
                <div class="color-picker-wrapper">
                  <div id="${switchPrefix}-others-color-btn" class="color-dot custom-color-dot" title="Custom Color">
                    <i class="fas fa-palette"></i>
                  </div>
                  <input type="color" id="${switchPrefix}-custom-picker" class="unified-color-picker" value="${this.config.color}" style="position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0;" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private initializeComponents(switchPrefix: string) {
    // 初始化开关组件
    const backgroundSwitchContainer = this.container.querySelector(`#${switchPrefix}-background-switch`) as HTMLElement;
    this.backgroundSwitch = new SwitchComponent(
      backgroundSwitchContainer, 
      'Background Effect', 
      `${switchPrefix}-background`, 
      'local', 
      this.config.backgroundEnable, 
      false
    );

    const flagSwitchContainer = this.container.querySelector(`#${switchPrefix}-flag-switch`) as HTMLElement;
    this.flagSwitch = new SwitchComponent(
      flagSwitchContainer, 
      'Corner Banner', 
      `${switchPrefix}-flag`, 
      'local', 
      this.config.flagEnable, 
      false
    );

    // 渲染默认颜色
    this.renderDefaultColors(switchPrefix);
    this.updateActiveColorDot(this.config.color, switchPrefix);
  }

  private bindEvents() {
    const switchPrefix = this.getSwitchPrefix();
    
    // 环境名称输入事件
    if (this.showEnvNameInput) {
      const envNameInput = this.container.querySelector(`#${switchPrefix}-env-name`) as HTMLInputElement;
      if (envNameInput) {
        envNameInput.addEventListener('input', (e) => {
          const value = (e.target as HTMLInputElement).value;
          this.config.envName = value;
          this.callbacks.onEnvNameChange?.(value);
          this.updatePreview();
        });
      }
    }

    // 颜色选择相关事件
    const othersBtn = this.container.querySelector(`#${switchPrefix}-others-color-btn`) as HTMLElement;
    const picker = this.container.querySelector(`#${switchPrefix}-custom-picker`) as HTMLInputElement;
    const mainColorInput = this.container.querySelector(`#${switchPrefix}-color`) as HTMLInputElement;

    othersBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      picker.style.pointerEvents = 'auto';
      picker.click();
      setTimeout(() => {
        picker.style.pointerEvents = 'none';
      }, 100);
    });

    picker.addEventListener('input', (e) => {
      const hex = (e.target as HTMLInputElement).value.toUpperCase();
      mainColorInput.value = hex;
      this.config.color = hex;
      this.updateActiveColorDot(hex, switchPrefix);
      this.callbacks.onColorChange?.(hex);
      this.updatePreview();
    });

    // 开关变化事件
    this.backgroundSwitch.onChange((checked) => {
      this.config.backgroundEnable = checked;
      this.callbacks.onBackgroundChange?.(checked);
      this.updatePreview();
    });

    this.flagSwitch.onChange((checked) => {
      this.config.flagEnable = checked;
      this.callbacks.onFlagChange?.(checked);
      
      if (this.showPositionSelect) {
        const positionContainer = this.container.querySelector(`#${switchPrefix}-position-container`) as HTMLElement;
        if (positionContainer) {
          if (checked) {
            positionContainer.classList.remove('hidden');
          } else {
            positionContainer.classList.add('hidden');
          }
        }
      }
      
      this.updatePreview();
    });

    // 位置选择事件
    if (this.showPositionSelect) {
      const positionSelect = this.container.querySelector(`#${switchPrefix}-position`) as HTMLSelectElement;
      if (positionSelect) {
        positionSelect.addEventListener('change', (e) => {
          const value = (e.target as HTMLSelectElement).value;
          this.config.position = value;
          this.callbacks.onPositionChange?.(value);
          this.updatePreview();
        });
      }
    }
  }

  private getSwitchPrefix(): string {
    // 从第一个开关的ID中提取前缀
    const backgroundSwitch = this.container.querySelector('[id$="-background-switch"]');
    if (backgroundSwitch) {
      const id = backgroundSwitch.id;
      return id.replace('-background-switch', '');
    }
    return 'preview';
  }

  private renderDefaultColors(switchPrefix: string) {
    const container = this.container.querySelector(`#${switchPrefix}-default-colors`) as HTMLElement;
    container.innerHTML = '';

    this.defaultColors.forEach(color => {
      const dot = document.createElement('div');
      dot.className = 'color-dot';
      dot.style.backgroundColor = color;
      dot.dataset.color = color;
      dot.addEventListener('click', () => {
        (this.container.querySelector(`#${switchPrefix}-color`) as HTMLInputElement).value = color;
        this.config.color = color;
        this.updateActiveColorDot(color, switchPrefix);
        this.callbacks.onColorChange?.(color);
        this.updatePreview();
      });

      container.appendChild(dot);
    });
  }

  private updateActiveColorDot(hex: string, switchPrefix: string) {
    const dots = this.container.querySelectorAll('.color-dot');
    const othersBtn = this.container.querySelector(`#${switchPrefix}-others-color-btn`) as HTMLElement;
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

  private getContrastColor(hexColor: string): string {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155 ? '#000000' : '#ffffff';
  }

  private updatePreview() {
    const previewContainer = this.container.querySelector('.form-section-compact-refined') as HTMLElement;
    if (!previewContainer) return;

    // 更新背景色
    if (this.config.backgroundEnable) {
      const rgba = this.hexToRgba(this.config.color, 0.15);
      previewContainer.style.backgroundColor = rgba;
    } else {
      previewContainer.style.backgroundColor = '';
    }

    // 更新角标
    let ribbon = previewContainer.querySelector('.corner-ribbon') as HTMLElement;

    if (!ribbon) {
      ribbon = document.createElement('div');
      ribbon.className = 'corner-ribbon';
      previewContainer.appendChild(ribbon);
    }

    ribbon.textContent = this.config.envName || 'Preview';

    if (this.config.flagEnable) {
      ribbon.classList.remove('hidden');
      ribbon.style.backgroundColor = this.config.color;
      
      // 设置位置类
      const position = this.config.position || 'leftTop';
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

  // 公共方法
  public updateConfig(config: Partial<PreviewConfig>) {
    this.config = { ...this.config, ...config };
    
    const switchPrefix = this.getSwitchPrefix();
    
    // 更新UI元素
    if (config.envName !== undefined && this.showEnvNameInput) {
      const envInput = this.container.querySelector(`#${switchPrefix}-env-name`) as HTMLInputElement;
      if (envInput) envInput.value = config.envName;
    }
    
    if (config.color !== undefined) {
      const colorInput = this.container.querySelector(`#${switchPrefix}-color`) as HTMLInputElement;
      const picker = this.container.querySelector(`#${switchPrefix}-custom-picker`) as HTMLInputElement;
      if (colorInput) colorInput.value = config.color;
      if (picker) picker.value = config.color;
      this.updateActiveColorDot(config.color, switchPrefix);
    }
    
    if (config.backgroundEnable !== undefined) {
      this.backgroundSwitch.setChecked(config.backgroundEnable);
    }
    
    if (config.flagEnable !== undefined) {
      this.flagSwitch.setChecked(config.flagEnable);
      
      if (this.showPositionSelect) {
        const positionContainer = this.container.querySelector(`#${switchPrefix}-position-container`) as HTMLElement;
        if (positionContainer) {
          if (config.flagEnable) {
            positionContainer.classList.remove('hidden');
          } else {
            positionContainer.classList.add('hidden');
          }
        }
      }
    }
    
    if (config.position !== undefined && this.showPositionSelect) {
      const positionSelect = this.container.querySelector(`#${switchPrefix}-position`) as HTMLSelectElement;
      if (positionSelect) positionSelect.value = config.position;
    }
    
    this.updatePreview();
  }

  public getConfig(): PreviewConfig {
    return { ...this.config };
  }

  public updateDefaultColors(colors: string[]) {
    this.defaultColors = colors;
    const switchPrefix = this.getSwitchPrefix();
    this.renderDefaultColors(switchPrefix);
    this.updateActiveColorDot(this.config.color, switchPrefix);
  }

  public setCallbacks(callbacks: PreviewCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
}