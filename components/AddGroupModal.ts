import { SwitchComponent } from './SwitchComponent';
import { PreviewComponent, PreviewConfig } from './PreviewComponent';

// 定义组默认配置结构
interface GroupDefaults {
  envName: string;
  backgroundEnable: boolean;
  flagEnable: boolean;
  color: string;
}

export class AddGroupModal {
    private modal: HTMLElement;
    private onSaveCallback?: (name: string, defaults: GroupDefaults) => void;
    private previewComponent!: PreviewComponent;

    constructor() {
        this.modal = document.createElement('div');
        this.modal.className = 'modal';
        this.modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add New Configuration Group</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="add-group-form">
            <div class="form-row group-name-row">
              <div class="form-group group-name-group">
                <label for="group-name">Group Name:</label>
                <input type="text" id="group-name" class="form-control" placeholder="e.g. Production" required />
              </div>
              <div class="form-group default-env-name-group">
                <label for="default-env-name">Default Environment Name:</label>
                <input type="text" id="default-env-name" class="form-control" placeholder="e.g. prod" />
              </div>
            </div>
            
            <div id="group-preview-container"></div>
            
            <div class="form-actions">
              <button type="button" class="cancel-btn">Cancel</button>
              <button type="submit" class="save-btn">Save</button>
            </div>
          </form>
        </div>
      </div>
    `;

        this.bindEvents();
    }

    private bindEvents() {
        const closeBtn = this.modal.querySelector('.modal-close') as HTMLButtonElement;
        const cancelBtn = this.modal.querySelector('.cancel-btn') as HTMLButtonElement;
        const overlay = this.modal.querySelector('.modal-overlay') as HTMLElement;

        const closeHandler = () => {
            this.close();
        };

        closeBtn.addEventListener('click', closeHandler);
        cancelBtn.addEventListener('click', closeHandler);
        overlay.addEventListener('click', closeHandler);

        const form = this.modal.querySelector('#add-group-form') as HTMLFormElement;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave();
        });

        // 监听外部环境名称输入框的变化，同步到预览组件
        const externalEnvInput = this.modal.querySelector('#default-env-name') as HTMLInputElement;
        if (externalEnvInput) {
            externalEnvInput.addEventListener('input', (e) => {
                const value = (e.target as HTMLInputElement).value;
                if (this.previewComponent) {
                    this.previewComponent.updateConfig({ envName: value });
                }
            });
        }
    }

    private handleSave() {
        const groupName = (this.modal.querySelector('#group-name') as HTMLInputElement).value;
        const envName = (this.modal.querySelector('#default-env-name') as HTMLInputElement).value;
        const previewConfig = this.previewComponent.getConfig();

        const defaults: GroupDefaults = {
            envName: envName.trim() || 'dev',
            backgroundEnable: previewConfig.backgroundEnable,
            flagEnable: previewConfig.flagEnable,
            color: previewConfig.color
        };

        if (this.onSaveCallback && groupName.trim()) {
            this.onSaveCallback(groupName.trim(), defaults);
        }

        this.close();
    }

    public open(defaultColors: string[], currentName?: string, currentDefaults?: GroupDefaults, onSave?: (name: string, defaults: GroupDefaults) => void) {
        if (onSave) {
            this.onSaveCallback = onSave;
        }

        const input = this.modal.querySelector('#group-name') as HTMLInputElement;
        const envInput = this.modal.querySelector('#default-env-name') as HTMLInputElement;
        const title = this.modal.querySelector('.modal-header h3') as HTMLElement;

        let initialConfig: PreviewConfig = {
            envName: 'dev',
            color: defaultColors.length > 0 ? defaultColors[0] : '#4a9eff',
            backgroundEnable: false,
            flagEnable: false,
            position: 'leftTop'
        };

        if (currentName) {
            title.textContent = 'Edit Configuration Group';
            input.value = currentName;
            
            if (currentDefaults) {
                envInput.value = currentDefaults.envName;
                initialConfig = {
                    envName: currentDefaults.envName,
                    color: currentDefaults.color,
                    backgroundEnable: currentDefaults.backgroundEnable,
                    flagEnable: currentDefaults.flagEnable,
                    position: 'leftTop'
                };
            }
        } else {
            title.textContent = 'Add New Configuration Group';
            input.value = '';
            envInput.value = '';
        }

        // 初始化预览组件
        const previewContainer = this.modal.querySelector('#group-preview-container') as HTMLElement;
        this.previewComponent = new PreviewComponent(
            previewContainer,
            initialConfig,
            defaultColors,
            {
                onEnvNameChange: (envName: string) => {
                    // 同步环境名称到外部输入框
                    const externalEnvInput = this.modal.querySelector('#default-env-name') as HTMLInputElement;
                    if (externalEnvInput) {
                        externalEnvInput.value = envName;
                    }
                }
            },
            {
                showPositionSelect: false, // 组默认配置不需要位置选择
                showEnvNameInput: false,  // 不显示环境名称输入，使用外部的
                switchPrefix: 'group-default'
            }
        );

        document.body.appendChild(this.modal);
        setTimeout(() => {
            this.modal.classList.add('show');
            input.focus();
        }, 10);
    }

    public close() {
        this.modal.classList.remove('show');
        setTimeout(() => {
            if (this.modal.parentElement) {
                this.modal.parentElement.removeChild(this.modal);
            }
        }, 300);
    }

    public onSave(callback: (name: string, defaults: GroupDefaults) => void) {
        this.onSaveCallback = callback;
    }
}
