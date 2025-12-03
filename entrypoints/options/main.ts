import { AppController } from './managers/AppController';

// 声明chrome对象
declare const chrome: any;

// 初始化应用控制器
let appController: AppController;

// 初始化主题
function initTheme() {
  // 检查系统主题偏好并应用相应主题
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = prefersDark ? 'dark' : 'light';
  document.body.classList.add(theme + '-theme');
  
  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    document.body.classList.remove('dark-theme', 'light-theme');
    const newTheme = e.matches ? 'dark' : 'light';
    document.body.classList.add(newTheme + '-theme');
  });
}

// DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化主题
  initTheme();
  
  try {
    // 创建并初始化AppController
    appController = new AppController();
    await appController.init();
    
    console.log('Enveil Options App initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Enveil Options App:', error);
    // 显示错误通知
    const notificationContainer = document.getElementById('notification-container');
    if (notificationContainer) {
      const notification = document.createElement('div');
      notification.className = 'notification notification-error';
      notification.textContent = 'Failed to initialize application. Please refresh the page.';
      notificationContainer.appendChild(notification);
      setTimeout(() => notification.classList.add('show'), 10);
    }
  }
});

// 导出appController以便在需要时可以访问（例如在控制台调试）
(window as any).enveilApp = {
  getController: () => appController
};