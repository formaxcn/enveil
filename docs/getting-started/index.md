---
layout: default
title: Getting Started
nav_order: 2
has_children: true
---

# Getting Started

Welcome to Enveil! This guide will help you quickly install and configure Enveil to start using environment visual identification features within minutes.

## Overview

Enveil is a Chrome browser extension that helps you distinguish between different work environments through visual indicators. Whether you're a developer, DevOps engineer, or QA tester, Enveil helps you avoid operating in the wrong environment.

## Key Features

- **Environment Banners**: Display environment names in page corners
- **Background Alerts**: Full-page color warnings for dangerous environments (like production)
- **Cloud Environment Support**: Account and role identification for AWS, Azure, GCP, and other cloud platforms
- **Flexible Matching**: Support for domain, URL prefix, exact URL, and regex matching

## Quick Navigation

### [📦 Installation Guide](./installation.html)
Learn how to install the Enveil extension in your Chrome browser

### [⚙️ First Setup](./first-setup.html)
Basic configuration after installation, create your first environment rule

## 5-Minute Quick Experience

1. **Install Extension**: Build from source or load unpacked extension
2. **Open Configuration**: Click extension icon → Select "Options"
3. **Add First Rule**:
   - Match Pattern: `domain`
   - Match Value: `localhost`
   - Environment Name: `DEV`
   - Color: Blue (`#4a9eff`)
   - Position: Top-right
4. **See Results**: Visit `http://localhost:3000`, see blue "DEV" banner

## Common Use Cases

### Development Team Environment Distinction
```
🔵 Local Development (localhost) → Blue banner
🟡 Test Environment (test.company.com) → Yellow banner
🔴 Production Environment (company.com) → Red banner + background warning
```

### Cloud Platform Account Management
```
☁️ AWS Development Account → Blue background highlighting
☁️ AWS Production Account → Red background highlighting + role keyword highlighting
```

## Need Help?

- Check [User Guide](../user-guide/) for detailed configuration options
- Having issues? See [Troubleshooting](../user-guide/troubleshooting.html)
- Want to contribute? Check [Developer Documentation](../developer/)

---

**Ready to get started?** [Install Enveil Now](./installation.html)