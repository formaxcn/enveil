import './style.css';
import { SwitchComponent } from '../../components/SwitchComponent';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Options page loaded');
  
  // 创建开关组件
  const switchContainer = document.getElementById('enable-switch-option') as HTMLDivElement;
  const globalSwitch = new SwitchComponent(switchContainer, 'Enable Enveil', 'isEnabled', 'local');
  
  // 可以在这里添加更多选项页面的功能
});