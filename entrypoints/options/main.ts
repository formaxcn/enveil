import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Options page loaded');
  
  // 页面已正确配置为在独立标签页中打开
  const container = document.getElementById('options-container');
  if (container) {
    container.innerHTML = `
      <h2>Extension Configuration</h2>
      <p>Extension options page is working!</p>
      <p>This page opens in a dedicated tab, not as a popup.</p>
      <p>You can configure your extension settings here.</p>
      <div style="margin-top: 20px; padding: 15px; background-color: #eee; border-radius: 5px;">
        <h3>How to use Enveil:</h3>
        <ul style="text-align: left; max-width: 500px; margin: 0 auto;">
          <li>Add domain patterns to identify different environments</li>
          <li>Customize banner and overlay appearance</li>
          <li>Toggle features on or off as needed</li>
          <li>Save your configuration to apply changes</li>
        </ul>
      </div>
      <div style="margin-top: 20px;">
        <p>More configuration options will be added here in the future.</p>
      </div>
    `;
  }
});