# 解决Chrome插件选项页面太窄问题

## 问题分析

当前options页面太窄，是因为使用`chrome.runtime.openOptionsPage()`打开选项页面时，Chrome会在浏览器的默认设置页面框架中打开，这个框架通常比较窄，无法充分利用屏幕空间。

## 解决方案

修改popup中的代码，将选项页面的打开方式从`chrome.runtime.openOptionsPage()`改为`window.open()`，这样选项页面会在新标签页中打开，能够充分利用浏览器窗口的宽度。

## 修改文件

* `d:\Github\enveil\entrypoints\popup\main.ts`

## 修改内容

第38-45行：将当前的选项页面打开逻辑修改为总是使用`window.open()`在新标签页中打开

```typescript
// 配置按钮点击事件
configureBtn.addEventListener('click', () => {
  // 直接在新标签页中打开选项页面，确保页面宽度足够
  window.open(chrome.runtime.getURL('options.html'));
});
```

## 预期效果

修改后，当用户点击popup中的"Options"按钮时，选项页面会在新标签页中打开，能够充分利用浏览器窗口的宽度，显示更舒适的布局。

## 其他考虑

* 移除不再需要的`open_in_tab`配置

* 确保选项页面本身的样式能够适应宽屏显示

