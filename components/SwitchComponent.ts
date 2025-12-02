export class SwitchComponent {
  private element: HTMLElement;
  private input: HTMLInputElement;
  private storageKey: string;
  private storageType: 'local' | 'sync';
  private onChangeCallback?: (isChecked: boolean) => void;

  constructor(
    container: HTMLElement, 
    label: string, 
    storageKey: string, 
    storageType: 'local' | 'sync' = 'local'
  ) {
    this.storageKey = storageKey;
    this.storageType = storageType;

    // 创建开关组件HTML结构
    container.innerHTML = `
      <div class="switch-container">
        <label class="switch">
          <input type="checkbox" id="${storageKey}-toggle" />
          <span class="slider"></span>
        </label>
        <span class="switch-label">${label}</span>
      </div>
    `;

    this.element = container;
    this.input = container.querySelector(`#${storageKey}-toggle`) as HTMLInputElement;

    // 绑定事件
    this.input.addEventListener('change', this.handleChange.bind(this));

    // 初始化状态
    this.init();
  }

  private async init() {
    const storage = this.storageType === 'local' 
      ? (globalThis as any).chrome.storage.local 
      : (globalThis as any).chrome.storage.sync;

    try {
      const result = await new Promise<{ [key: string]: any }>(resolve => {
        storage.get([this.storageKey], (result: { [key: string]: any }) => {
          resolve(result);
        });
      });

      const isChecked = result[this.storageKey] !== undefined ? result[this.storageKey] : true;
      this.input.checked = isChecked;
    } catch (error) {
      console.error('Error initializing switch component:', error);
      // 默认设为开启状态
      this.input.checked = true;
    }
  }

  private handleChange() {
    const isChecked = this.input.checked;
    
    const storage = this.storageType === 'local' 
      ? (globalThis as any).chrome.storage.local 
      : (globalThis as any).chrome.storage.sync;

    storage.set({ [this.storageKey]: isChecked }, () => {
      if (this.onChangeCallback) {
        this.onChangeCallback(isChecked);
      }
    });
  }

  public onChange(callback: (isChecked: boolean) => void) {
    this.onChangeCallback = callback;
  }

  public isChecked(): boolean {
    return this.input.checked;
  }

  public setChecked(checked: boolean) {
    this.input.checked = checked;
  }
  
  public async waitForInitialization(): Promise<void> {
    return new Promise(resolve => {
      const checkInitialized = () => {
        if (this.input) {
          resolve();
        } else {
          setTimeout(checkInitialized, 10);
        }
      };
      checkInitialized();
    });
  }
}