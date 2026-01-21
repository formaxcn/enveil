export class AddGroupModal {
    private modal: HTMLElement;
    private onSaveCallback?: (name: string) => void;

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
            <div class="form-group">
              <label for="group-name">Group Name:</label>
              <input type="text" id="group-name" placeholder="e.g. Production" required />
            </div>
            
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
    }

    private handleSave() {
        const groupName = (this.modal.querySelector('#group-name') as HTMLInputElement).value;

        if (this.onSaveCallback && groupName.trim()) {
            this.onSaveCallback(groupName.trim());
        }

        this.close();
    }

    public open(currentName?: string, onSave?: (name: string) => void) {
        if (onSave) {
            this.onSaveCallback = onSave;
        }

        const input = this.modal.querySelector('#group-name') as HTMLInputElement;
        const title = this.modal.querySelector('.modal-header h3') as HTMLElement;

        if (currentName) {
            title.textContent = 'Edit Configuration Group';
            input.value = currentName;
        } else {
            title.textContent = 'Add New Configuration Group';
            input.value = '';
        }

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

    public onSave(callback: (name: string) => void) {
        this.onSaveCallback = callback;
    }
}
