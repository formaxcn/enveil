# 部署说明

## Chrome 扩展打包和发布

### 1. 私钥设置

项目已经生成了本地私钥文件 `extension-key.pem`，需要将其内容添加到 GitHub Secrets 中：

1. 查看私钥内容：
   ```bash
   cat extension-key.pem
   ```

2. 复制完整的私钥内容（包括 `-----BEGIN RSA PRIVATE KEY-----` 和 `-----END RSA PRIVATE KEY-----`）

3. 在 GitHub 仓库中设置 Secret：
   - 进入仓库的 Settings > Secrets and variables > Actions
   - 点击 "New repository secret"
   - Name: `EXTENSION_PRIVATE_KEY`
   - Value: 粘贴完整的私钥内容

### 2. 手动触发构建

- 进入 GitHub 仓库的 Actions 页面
- 选择 "Build Chrome Extension" 工作流
- 点击 "Run workflow" 按钮手动触发

### 3. 自动触发构建

- 推送到 `main` 分支会触发开发版本构建
- 创建 `v*` 格式的标签会触发正式版本构建和发布

### 4. 本地打包（可选）

如果需要本地打包测试：

```bash
# 构建扩展
npm run build

# 使用 WXT 内置的打包功能
npm run zip

# 或者手动打包
cd .output/chrome-mv3
zip -r ../../enveil-local.zip .
```

### 5. Chrome 商店发布

1. 从 GitHub Actions 的 Artifacts 中下载 `.zip` 文件
2. 登录 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
3. 上传 ZIP 文件并填写相关信息
4. 提交审核

### 注意事项

- 私钥文件 `extension-key.pem` 已添加到 `.gitignore`，不会被提交到仓库
- CRX 文件主要用于自托管分发，Chrome 商店只需要 ZIP 文件
- 确保 `manifest.json` 中的版本号与发布版本一致