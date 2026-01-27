// 声明chrome对象
declare const chrome: any;

export class SwitchComponent {
  private element: HTMLElement;
  private input: HTMLInputElement;
  private storageKey: string;
  private storageType: 'local' | 'sync';
  private persist: boolean;
  private onChangeCallback?: (isChecked: boolean) => void;

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

  private getStorage() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return this.storageType === 'local' ? chrome.storage.local : chrome.storage.sync;
    } else if (typeof browser !== 'undefined' && browser.storage) {
      // Firefox uses browser namespace
      return this.storageType === 'local' ? browser.storage.local : browser.storage.sync;
    } else {
      // Fallback storage using localStorage
      return {
        get: (keys: string[], callback: (result: { [key: string]: any }) => void) => {
          const result: { [key: string]: any } = {};
          keys.forEach(key => {
            try {
              const item = localStorage.getItem(key);
              result[key] = item ? JSON.parse(item) : undefined;
            } catch (e) {
              result[key] = undefined;
            }
          });
          callback(result);
        },
        set: (items: { [key: string]: any }, callback?: () => void) => {
          Object.keys(items).forEach(key => {
            try {
              localStorage.setItem(key, JSON.stringify(items[key]));
            } catch (e) {
              console.error('Error saving to localStorage:', e);
            }
          });
          if (callback) callback();
        }
      };
    }
  }

  private async init() {
    const storage = this.getStorage();

    try {
      const result = await new Promise<{ [key: string]: any }>(resolve => {
        storage.get([this.storageKey], (result: { [key: string]: any }) => {
          resolve(result);
        });
      });

      const isChecked = result[this.storageKey] !== undefined ? result[this.storageKey] : this.input.checked;
      this.input.checked = isChecked;
    } catch (error) {
      console.error('Error initializing switch component:', error);
    }
  }

  private handleChange() {
    const isChecked = this.input.checked;

    if (this.persist) {
      const storage = this.getStorage();
      storage.set({ [this.storageKey]: isChecked }, () => {
        if (this.onChangeCallback) {
          this.onChangeCallback(isChecked);
        }
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