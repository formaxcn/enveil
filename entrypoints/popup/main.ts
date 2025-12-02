import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <div class="header">
      <div class="switch-container">
        <label class="switch">
          <input type="checkbox" id="global-toggle" />
          <span class="slider"></span>
        </label>
        <span class="switch-label">Enable Enveil</span>
      </div>
    </div>
    
    <div class="content">
      <div class="options-container">
        <button id="configure-btn" class="configure-button">Options</button>
        <a href="https://github.com/formaxcn/enveil" target="_blank" id="github-link" class="icon-link">
          <svg id="github-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
        </a>
      </div>
    </div>
  </div>
`;

// 添加事件监听器
const globalToggle = document.getElementById('global-toggle') as HTMLInputElement;
const configureBtn = document.getElementById('configure-btn') as HTMLButtonElement;
const githubIcon = document.getElementById('github-icon') as HTMLElement;

// 初始化开关状态
(globalThis as any).chrome.storage.sync.get(['isEnabled'], (result: { [key: string]: any }) => {
  const isEnabled = result.isEnabled !== false; // 默认开启
  globalToggle.checked = isEnabled;
  updateIconColor(isEnabled);
});

// 监听开关变化
globalToggle.addEventListener('change', () => {
  const isEnabled = globalToggle.checked;
  (globalThis as any).chrome.storage.sync.set({ isEnabled });
  updateIconColor(isEnabled);
});

// 配置按钮点击事件
configureBtn.addEventListener('click', () => {
  (globalThis as any).chrome.runtime.openOptionsPage();
});

// 更新图标颜色的函数
function updateIconColor(isEnabled: boolean) {
  if (isEnabled) {
    githubIcon.style.stroke = '#646cff';
  } else {
    githubIcon.style.stroke = 'currentColor';
  }
}