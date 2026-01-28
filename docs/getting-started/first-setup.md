---
layout: default
title: First Setup
parent: Getting Started
nav_order: 2
---

# First Setup

After installing Enveil, let's perform basic configuration and create your first environment identification rule.

## Open Configuration Page

1. **Click Extension Icon**: Find the Enveil icon in Chrome toolbar
2. **Select Options**: Click "Options" in the popup menu
3. **Configuration Page**: Opens in a new tab with the full configuration interface

## Interface Overview

The configuration page has two main sections:

### Left Panel (Global Settings)
- **Browser Sync**: Cross-device configuration synchronization
- **Default Colors**: Preset environment color palette
- **Import/Export**: Configuration file management

### Right Main Area (Configuration Management)
- **Configs Tab**: Traditional site environment configuration
- **Cloud Tab**: Cloud platform account and role configuration

## Create Your First Environment Rule

### Step 1: Add Configuration Group

1. Click the **"Add Group"** button in the top-right
2. Fill in group information:
   - **Group Name**: `Development Environment`
   - **Default Environment Name**: `DEV`
   - **Default Color**: Select blue `#4a9eff`
   - **Enable Banner**: ✓
   - **Enable Background**: ✗ (development environments usually don't need this)
3. Click **"Save"**

### Step 2: Add Site Rule

1. In the newly created group, click the **"Add Site"** button
2. Configure site rule:
   - **Enable**: ✓
   - **Match Pattern**: Select `domain`
   - **Match Value**: Enter `localhost`
   - **Environment Name**: `DEV`
   - **Color**: Blue `#4a9eff`
   - **Position**: Select `rightTop` (top-right corner)
   - **Show Banner**: ✓
   - **Show Background**: ✗
3. Click **"Save"**

### Step 3: Test Configuration

1. Open a new tab
2. Visit `http://localhost:3000` (or any localhost address)
3. You should see a blue "DEV" banner in the top-right corner

## Add More Environments

Let's add rules for testing and production environments:

### Test Environment Configuration

1. Add a new site in the same group:
   - **Match Pattern**: `domain`
   - **Match Value**: `test.yourcompany.com`
   - **Environment Name**: `TEST`
   - **Color**: Yellow `#ff9800`
   - **Position**: `rightTop`
   - **Show Banner**: ✓

### Production Environment Configuration

1. Create new group `Production Environment`:
   - **Default Environment Name**: `PROD`
   - **Default Color**: Red `#f44336`
   - **Enable Background**: ✓ (production environment warning)

2. Add production site:
   - **Match Pattern**: `domain`
   - **Match Value**: `yourcompany.com`
   - **Environment Name**: `PROD`
   - **Color**: Red `#f44336`
   - **Position**: `rightTop`
   - **Show Banner**: ✓
   - **Show Background**: ✓

## Cloud Environment Configuration (Optional)

If you use cloud platforms (AWS, Azure, GCP), you can configure cloud environment identification:

### Add AWS Environment

1. Switch to **"Cloud"** tab
2. Click **"Add Env"** button
3. Configure cloud environment:
   - **Environment Name**: `AWS Development Environment`
   - **Cloud Provider**: Select `AWS China` or `AWS Global`
   - **Enable**: ✓

4. Add cloud account:
   - **Account Name**: `Development Account`
   - **Match Pattern**: `urlPrefix`
   - **Match Value**: `https://signin.amazonaws.cn/saml`
   - **Background Color**: Blue `#4a9eff`
   - **Enable Background Highlighting**: ✓

## Configuration Verification

After completing basic configuration, test these scenarios:

1. **Local Development**: Visit `localhost` should show blue DEV banner
2. **Test Environment**: Visit test domain should show yellow TEST banner
3. **Production Environment**: Visit production domain should show red PROD banner and background warning
4. **Cloud Platform**: Visit AWS console should show account background highlighting

## Advanced Configuration Options

### Browser Sync

If you use Chrome on multiple devices:
1. Enable **"Browser Sync"** toggle in the left panel
2. Configuration will automatically sync to all Chrome browsers logged into the same Google account

### Custom Colors

1. In the left panel color area, click any color circle
2. Use the color picker to customize colors
3. Click the `+` button to add new colors

### Export Configuration

To backup your configuration:
1. Click the **"Export"** button in the left panel
2. Save the JSON configuration file to a safe location

## Common Configuration Patterns

### Development Team Standard Configuration
```
🔵 DEV (localhost, *.dev) - Blue banner
🟡 STAGING (*.staging.com) - Yellow banner
🟠 UAT (*.uat.com) - Orange banner
🔴 PROD (*.com, production domains) - Red banner + background warning
```

### Multi-Project Configuration
```
Project A:
  🔵 DEV (a-dev.com) - Blue
  🔴 PROD (a.com) - Red

Project B:
  🟢 DEV (b-dev.com) - Green
  🟣 PROD (b.com) - Purple
```

## Next Steps

After completing configuration, you can:

- Check [User Guide](../user-guide/) for more advanced features
- Learn detailed usage of [Cloud Environment Configuration](../user-guide/cloud-environments.html)
- Understand [Advanced Matching Patterns](../user-guide/advanced-features.html) like regular expressions

---

**Configuration Complete!** Now you can safely work across different environments without worrying about mixing them up.