---
layout: default
title: Enveil Documentation
nav_order: 1
---

# Enveil - Environment Veil

> **Enveil** = **En**vironment + **Veil** — A Chrome extension that drapes a visual veil over your web environments, helping developers instantly identify whether they're on DEV, STAGING, or PRODUCTION.

## 🚀 Core Features

### 🎯 Intelligent URL Matching
- **5 Matching Strategies**: Domain, URL prefix, exact URL, regex, and smart "everything" mode
- **Subdomain Support**: Automatically matches subdomains when using domain patterns
- **Regex Power**: Advanced pattern matching for complex scenarios

### 🎨 Flexible Visual Indicators
- **Corner Banners**: Rotated ribbons in any of 4 corners with custom text and colors
- **Background Overlays**: Subtle full-page color tinting (5% opacity) for dangerous environments
- **Shadow DOM Isolation**: UI elements don't interfere with page functionality or styles

### ☁️ Cloud Environment Role Highlighting
- **Multi-Cloud Support**: Environment identification for AWS, Azure, GCP, and other cloud platforms
- **Account Background Highlighting**: Background color differentiation for different cloud accounts
- **Role Text Highlighting**: Keyword-based highlighting of role names and descriptions

### 📁 Configuration Groups
- **Logical Organization**: Group related rules by project, team, or environment type
- **Group Defaults**: Set default colors, positions, and settings for new sites
- **Bulk Operations**: Enable/disable entire groups with one click

## 📚 Documentation Navigation

### [🚀 Getting Started](./getting-started/)
- [Installation Guide](./getting-started/installation.html)
- [First Setup](./getting-started/first-setup.html)

### [📖 User Guide](./user-guide/)
- [Basic Configuration](./user-guide/basic-configuration.html)
- [Advanced Features](./user-guide/advanced-features.html)
- [Cloud Environments](./user-guide/cloud-environments.html)
- [Troubleshooting](./user-guide/troubleshooting.html)

### [🛠️ Developer Documentation](./developer/)
- [Architecture](./developer/architecture.html)
- [API Reference](./developer/api-reference.html)
- [Development Setup](./developer/development-setup.html)
- [Contributing Guide](./developer/contributing.html)

### [🚀 Deployment](./deployment/)
- [Build Process](./deployment/build-process.html)
- [Chrome Store Publishing](./deployment/chrome-store.html)

## 🎯 Common Use Cases

### Development Teams
```
🔵 DEV (localhost) - Blue banner, top-right
🟡 STAGING (staging.app.com) - Yellow banner, top-right  
🔴 PROD (app.com) - Red banner + background overlay, top-right
```

### QA Testing
```
🟢 TEST-1 (test1.example.com) - Green banner
🟠 TEST-2 (test2.example.com) - Orange banner
🟣 UAT (uat.example.com) - Purple banner
```

### Cloud Environment Management
```
☁️ AWS-DEV - Development account background highlighting
☁️ AWS-PROD - Production account background highlighting + role keyword highlighting
```

## 🔧 Technical Features

- **Modern Tech Stack**: Built with WXT framework, TypeScript, React
- **High Performance**: First match wins, event-driven processing
- **Privacy First**: 100% local storage, no external data collection
- **Cross-Device Sync**: Chrome browser sync support

## 📊 Browser Support

| Browser | Status | Notes |
|---------|--------|-------|
| **Chrome** | ✅ Full Support | Primary target platform, all features |
| **Firefox** | ✅ Compatible | Build with `bun run build:firefox` |
| **Edge** | 🔄 Planned | Chromium-based, should work |

## 🤝 Contributing

Enveil is open source and welcomes contributions! Whether you're fixing bugs, adding features, improving documentation, or sharing configuration templates, your help is appreciated.

[View Contributing Guide](./developer/contributing.html) | [GitHub Repository](https://github.com/formaxcn/enveil)

---

**Ready to eliminate environment confusion?** Install Enveil and never accidentally work on the wrong environment again!

[🌐 Install from Chrome Web Store](https://chromewebstore.google.com/detail/enveil/mnejdnnkcdilfcfkplekhelfelkbjiia){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[📦 Download from GitHub Releases](https://github.com/formaxcn/enveil/releases){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[Get Started](./getting-started/){: .btn .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/formaxcn/enveil){: .btn .fs-5 .mb-4 .mb-md-0 }