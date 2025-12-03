import { SiteConfig } from '../entrypoints/options/types';

export interface PositionSelectorOptions {
  initialPosition: string;
  color?: string;
  readonly?: boolean;
  onChange?: (position: string) => void;
}

export class PositionSelector {
  private container: HTMLElement;
  private position: string;
  private color: string;
  private readonly: boolean;
  private onChange?: (position: string) => void;

  constructor(container: HTMLElement, options: PositionSelectorOptions) {
    this.container = container;
    this.position = options.initialPosition;
    this.color = options.color || '#8ac64d';
    this.readonly = options.readonly || false;
    this.onChange = options.onChange;

    this.render();
    this.bindEvents();
  }

  private render(): void {
    if (this.readonly) {
      this.renderReadOnly();
    } else {
      this.renderEditable();
    }
  }

  private renderReadOnly(): void {
    const positionClass = this.position.replace(/([A-Z])/g, '-$1').toLowerCase();
    this.container.innerHTML = `
      <div class="position-cell" style="--rectangle-color: ${this.color};">
        <div class="position-triangle ${positionClass}"></div>
      </div>
    `;
  }

  private renderEditable(): void {
    const positionClass = this.position.replace(/([A-Z])/g, '-$1').toLowerCase();
    this.container.innerHTML = `
      <div class="position-selector">
        <div class="position-grid">
          <div class="position-quadrant left-top ${positionClass === 'left-top' ? 'active' : ''}" data-position="leftTop">
            <div class="position-triangle left-top"></div>
          </div>
          <div class="position-quadrant right-top ${positionClass === 'right-top' ? 'active' : ''}" data-position="rightTop">
            <div class="position-triangle right-top"></div>
          </div>
          <div class="position-quadrant left-bottom ${positionClass === 'left-bottom' ? 'active' : ''}" data-position="leftBottom">
            <div class="position-triangle left-bottom"></div>
          </div>
          <div class="position-quadrant right-bottom ${positionClass === 'right-bottom' ? 'active' : ''}" data-position="rightBottom">
            <div class="position-triangle right-bottom"></div>
          </div>
        </div>
      </div>
    `;

    // 应用颜色样式
    const positionCells = this.container.querySelectorAll('.position-quadrant');
    positionCells.forEach(cell => {
      cell.style.setProperty('--rectangle-color', this.color);
    });
  }

  private bindEvents(): void {
    if (!this.readonly) {
      const quadrants = this.container.querySelectorAll('.position-quadrant');
      quadrants.forEach(quadrant => {
        quadrant.addEventListener('click', () => {
          const newPosition = quadrant.getAttribute('data-position') as string;
          this.setPosition(newPosition);
        });
      });
    }
  }

  public setPosition(position: string): void {
    this.position = position;
    this.render();
    this.bindEvents();

    if (this.onChange) {
      this.onChange(position);
    }
  }

  public getPosition(): string {
    return this.position;
  }

  public setColor(color: string): void {
    this.color = color;
    this.render();
    this.bindEvents();
  }

  public isChecked(): boolean {
    // This method is just for consistency with SwitchComponent
    return true;
  }
}
