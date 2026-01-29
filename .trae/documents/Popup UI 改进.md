## 修改计划

### 1. 移除全局开关
- 删除 `popup/App.tsx` 中的 "Enable Enveil" 全局开关部分（第87-94行）
- 删除相关的 `isEnabled` state 和 `toggleEnable` 函数

### 2. 改进 Active Site Configs 列表显示
参考设置界面中的 `SiteItem` 组件样式，修改 popup 中的匹配站点显示：

**当前显示：**
- 只显示 Switch + 环境名称

**改进后显示：**
- 左侧：Switch 开关
- 中间：
  - 第一行：带颜色的环境名称标签 + 匹配模式: 匹配值
  - 第二行：背景效果和角标状态指示器（小圆点 + 文字）
- 参考 SiteItem 组件的样式

### 3. 具体修改内容

**文件: `entrypoints/popup/App.tsx`**
1. 删除 `isEnabled` state
2. 删除 `toggleEnable` 函数
3. 删除全局 Enable Enveil Switch 部分
4. 修改 matchingSites 的渲染部分，采用类似 SiteItem 的样式：
   - 添加 patternMap 用于匹配模式中文显示
   - 添加 positionMap 用于位置显示
   - 显示彩色环境标签
   - 显示匹配信息
   - 显示背景效果和角标状态

### 样式参考
参考 `components/SiteItem.tsx` 的实现：
- 环境名称标签：彩色圆角标签
- 匹配信息：`{pattern}: {value}` 格式
- 状态指示器：小圆点 + 文字说明