import { AppController } from './managers/AppController';
import './test/cloudRolesTabTest'; // Import test utilities
import './test/cloudConfigUITest'; // Import checkpoint test utilities

// 声明chrome对象
declare const chrome: any;

// 初始化应用控制器
let appController: AppController;

// DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 创建并初始化AppController
    appController = new AppController();
    await appController.init();
    
    // 检查URL参数，看是否需要打开add modal预填域名
    checkUrlParams();
    
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

// 检查URL参数并处理
function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  
  if (action === 'addSite') {
    const domain = urlParams.get('domain');
    const pattern = urlParams.get('pattern') || 'everything';
    
    if (domain) {
      // 延迟执行以确保appController已完全初始化
      setTimeout(() => {
        if (appController) {
          appController.openAddSiteModalWithDomain(domain, pattern);
        }
      }, 100);
    }
    
    // 清除URL参数，避免刷新时重复触发
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// 导出appController以便在需要时可以访问（例如在控制台调试）
(window as any).enveilApp = {
  getController: () => appController
};