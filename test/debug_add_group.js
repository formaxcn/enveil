// 简单的调试脚本，用于测试添加配置组功能
console.log('Debug script loaded');

// 查找添加配置组按钮
const addButton = document.getElementById('add-config-group');
console.log('Add button:', addButton);

if (addButton) {
  console.log('Add button found, attaching event listener');
  addButton.addEventListener('click', function() {
    console.log('Add button clicked!');
    // 这里应该触发添加配置组的逻辑
  });
} else {
  console.log('Add button not found');
}

// 查看配置组容器
const configGroupsContainer = document.getElementById('config-groups-container');
console.log('Config groups container:', configGroupsContainer);