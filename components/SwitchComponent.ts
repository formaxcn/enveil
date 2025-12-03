import { StorageManager, StorageType } from './StorageManager';

export class SwitchComponent {
  private element: HTMLElement;
  private input: HTMLInputElement;
  private storageKey: string;
  private storageType: 'local' | 'sync';
  private persist: boolean;
  private onChangeCallback?: (isChecked: boolean) => void;
  private storageManager: StorageManager;

  constructor(
    container: HTMLElement,
    label: string,
    storageKey: string,
    storageType: 'local' | 'sync' = 'local',
    initialValue: boolean = true,
    persist: boolean = true
  ) {
    this.storageKey = storageKey;
    this.storageType = storageType;
    this.persist = persist;
    this.storageManager = StorageManager.getInstance();
    this.storageManager.setStorageType(storageType === 'local' ? StorageType.Local : StorageType.Sync);

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

    // Set initial value immediately
    this.input.checked = initialValue;

    // 绑定事件
    this.input.addEventListener('change', this.handleChange.bind(this));

    // 初始化状态 (only if persisting)
    if (this.persist) {
      this.init();
    }
  }

  private async init() {
    try {
      const isChecked = await this.storageManager.get<boolean>(this.storageKey, this.input.checked);
      if (isChecked !== undefined) {
        this.input.checked = isChecked;
      }
    } catch (error) {
      console.error('Error initializing switch component:', error);
    }
  }

  private handleChange() {
    const isChecked = this.input.checked;

    if (this.persist) {
      this.storageManager.set(this.storageKey, isChecked).then(() => {
        if (this.onChangeCallback) {
          this.onChangeCallback(isChecked);
        }
      }).catch(error => {
        console.error('Error saving switch state:', error);
      });
    } else {
      if (this.onChangeCallback) {
        this.onChangeCallback(isChecked);
      }
    }
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
    if (!this.persist) return Promise.resolve();

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