## 修改计划

### 1. 统一样式 (CloudEnvironmentItem.tsx)
- 修改图标区域样式，使用与 ConfigGroup 类似的简洁图标展示方式
- 统一标题和统计信息的展示格式

### 2. 为 Cloud Provider 添加导出功能
- **CloudEnvironmentItem.tsx**: 添加 `onExport` prop 和导出按钮
- **App.tsx**: 添加导出函数，文件名格式为 `enveil-cloud-${environment.name}.json`
- 导出格式: `{ cloudEnvironments: [environment] }`

### 3. 修改导入逻辑支持 Cloud Provider
- **App.tsx**: 修改 `importConfig` 函数，检测导入文件的类型：
  - **全局配置** (包含 `browserSync` 或同时有 `settings` 和 `cloudEnvironments`): 需要 confirm 确认后覆盖整个配置
  - **Config Group** (只包含 `settings`): 直接追加到现有 settings 数组
  - **Cloud Provider** (只包含 `cloudEnvironments`): 直接追加到现有 cloudEnvironments 数组

### 文件名区分：
- 全局导出: `enveil-config-${date}.json`
- Config Group 导出: `enveil-group-${name}.json`
- Cloud Provider 导出: `enveil-cloud-${name}.json`

### 导入策略：
- 全局导入: confirm 确认覆盖
- Config Group 导入: 直接添加，不去重
- Cloud Provider 导入: 直接添加，不去重

请确认这个计划后，我将开始执行修改。