import './style.css';
import { SwitchComponent } from '../../components/SwitchComponent';

// 获取元素
const configureBtn = document.getElementById('configure-btn') as HTMLButtonElement;

// 创建开关组件
const switchContainer = document.getElementById('enable-switch') as HTMLDivElement;
const globalSwitch = new SwitchComponent(switchContainer, 'Enable Enveil', 'isEnabled', 'local');

// 更新图标颜色的函数
function updateIconColor(isEnabled: boolean) {
  const githubLink = document.getElementById('github-link');
  if (githubLink) {
    if (isEnabled) {
      githubLink.classList.remove('disabled');
    } else {
      githubLink.classList.add('disabled');
    }
  }
}

// 监听开关变化
globalSwitch.onChange((isChecked) => {
  updateIconColor(isChecked);
});

// 初始化图标状态
globalSwitch.waitForInitialization().then(() => {
  updateIconColor(globalSwitch.isChecked());
});

// 配置按钮点击事件
configureBtn.addEventListener('click', () => {
  (globalThis as any).chrome.runtime.openOptionsPage();
});