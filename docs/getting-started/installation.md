---
layout: default
title: Installation Guide
parent: Getting Started
nav_order: 1
---

# Installation Guide

Enveil is currently in development and needs to be installed by loading an unpacked extension. This guide provides detailed installation instructions.

## System Requirements

- **Browser**: Chrome 88+ or Chromium-based browsers (Edge, Brave, etc.)
- **Operating System**: Windows, macOS, Linux
- **Development Environment** (if building from source):
  - Node.js 18+
  - Bun (recommended) or npm/yarn

## Installation Methods

### Method 1: Download from GitHub Releases (Recommended)

1. **Download Build Package**
   - Visit [GitHub Releases page](https://github.com/formaxcn/enveil/releases)
   - Download the latest `enveil-chrome-v*.zip` file
   - Extract to a local directory

2. **Load into Chrome**
   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top-right corner
   - Click "Load unpacked"
   - Select the extracted folder

### Method 2: Build from Source

1. **Clone Repository**
   ```bash
   git clone https://github.com/formaxcn/enveil.git
   cd enveil
   ```

2. **Install Dependencies**
   ```bash
   # Using bun (recommended)
   bun install
   
   # Or using npm
   npm install
   ```

3. **Build Extension**
   ```bash
   # Chrome version
   bun run build
   
   # Firefox version
   bun run build:firefox
   ```

4. **Load into Browser**
   - **Chrome**: Build output is in `.output/chrome-mv3` directory
   - **Firefox**: Build output is in `.output/firefox-mv2` directory
   - Follow the "Load into Chrome" steps above

## Verify Installation

After successful installation, you should see:

1. **Extension Icon**: Enveil icon appears in Chrome toolbar (gray state)
2. **Extension List**: "Enveil" extension visible in `chrome://extensions/`
3. **Permission Confirmation**: Extension requests storage and tabs permissions

## Development Mode Installation

If you want to participate in development or test latest features:

1. **Start Development Server**
   ```bash
   bun run dev
   ```

2. **Auto-reload**
   - In development mode, code changes automatically rebuild
   - Extension auto-reloads (need to refresh page to see changes)

## Troubleshooting

### Common Issues

**Q: Extension icon shows as gray**
- A: This is normal, indicating no environment rules match the current page

**Q: Cannot load extension, "Invalid manifest file" error**
- A: Ensure you're selecting the build output directory (`.output/chrome-mv3`), not the source root directory

**Q: Extension loads but doesn't respond**
- A: Check browser console for error messages, ensure Chrome version supports Manifest V3

**Q: Firefox support status**
- A: Firefox version uses Manifest V2, functionality may differ slightly

### Permission Explanation

Enveil requests these permissions:
- **storage**: Store configuration data (local storage)
- **tabs**: Detect current tab URL to match environment rules

All data is stored locally and never sent to external servers.

## Updating Extension

### Manual Update
1. Download new version build package
2. Remove old version in `chrome://extensions/`
3. Follow installation steps to load new version

### Development Version Update
```bash
git pull origin main
bun install
bun run build
```
Then click "Reload" button on the extension management page.

## Uninstallation

To uninstall Enveil:
1. Navigate to `chrome://extensions/`
2. Find Enveil extension
3. Click "Remove" button
4. Confirm deletion

All configuration data will be cleared.

---

**Installation Complete?** [Continue with First Setup](./first-setup.html)