---
layout: default
title: Development Setup
parent: Developer Documentation
nav_order: 3
---

# Development Setup

This guide will help you set up a local development environment for Enveil, whether you're contributing to the project or building custom features.

## Prerequisites

### Required Software

**Node.js 18+**
```bash
# Check your Node.js version
node --version

# If you need to install or update Node.js
# Visit https://nodejs.org/ or use a version manager like nvm
```

**Bun (Recommended)**
```bash
# Install Bun (preferred package manager)
curl -fsSL https://bun.sh/install | bash

# Or using npm
npm install -g bun

# Verify installation
bun --version
```

**Git**
```bash
# Verify Git installation
git --version

# Configure Git (if not already done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**Chrome/Chromium Browser**
- Chrome 88+ or any Chromium-based browser
- Firefox (optional, for Firefox build testing)

### Recommended Tools

**VS Code with Extensions:**
- TypeScript and JavaScript Language Features (built-in)
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint

**Chrome Extensions for Development:**
- React Developer Tools
- Extension Reloader (for manual extension reloading)

## Project Setup

### 1. Clone the Repository

```bash
# Clone the main repository
git clone https://github.com/formaxcn/enveil.git
cd enveil

# Or clone your fork
git clone https://github.com/YOUR_USERNAME/enveil.git
cd enveil
```

### 2. Install Dependencies

```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install

# Or using yarn
yarn install
```

### 3. Verify Installation

```bash
# Check if all dependencies are installed correctly
bun run compile

# This should complete without errors
```

## Development Workflow

### 1. Start Development Server

```bash
# Start development server with hot reload
bun run dev

# For Firefox development
bun run dev:firefox
```

**What happens:**
- Extension is built to `.output/chrome-mv3` (or `.output/firefox-mv2`)
- File watcher monitors source changes
- Automatic rebuilds on file changes
- Extension reloads automatically in development mode

### 2. Load Extension in Browser

**Chrome/Chromium:**
1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `.output/chrome-mv3` directory
5. Extension should appear in your toolbar

**Firefox:**
1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select any file in `.output/firefox-mv2` directory

### 3. Development Cycle

```bash
# Make changes to source files
# Files are automatically rebuilt
# Extension reloads automatically

# For content script changes, refresh the target web page
# For options page changes, close and reopen the options page
```

### 4. Testing Changes

```bash
# Type checking
bun run compile

# Build production version for testing
bun run build

# Create distribution package
bun run zip
```

## Project Structure for Development

### Key Development Files

```
enveil/
├── entrypoints/              # Extension entry points
│   ├── background.ts         # Service worker logic
│   ├── content.ts           # Content script injection
│   ├── options/             # Options page React app
│   │   ├── App.tsx          # Main options component
│   │   ├── main.tsx         # React entry point
│   │   └── types.ts         # TypeScript definitions
│   └── popup/               # Extension popup
├── components/              # Reusable UI components
│   ├── AddSiteModal.tsx     # Site configuration modal
│   ├── CloudHighlighter.ts  # Cloud highlighting logic
│   └── Switch.tsx           # Toggle switch component
├── utils/                   # Utility functions
│   ├── matcher.ts           # URL matching logic
│   ├── cloudMatcher.ts      # Cloud-specific matching
│   └── cloudTemplates.ts    # Cloud provider templates
├── wxt.config.ts            # WXT framework configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

### Configuration Files

**`wxt.config.ts`** - WXT Framework Configuration
```typescript
import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: "Enveil",
    version: "1.0.0",
    permissions: ["storage", "tabs"],
    // Additional manifest configuration
  },
});
```

**`tsconfig.json`** - TypeScript Configuration
```json
{
  "extends": "./.wxt/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## Development Commands

### Core Commands

```bash
# Development
bun run dev              # Start Chrome development server
bun run dev:firefox      # Start Firefox development server

# Building
bun run build            # Production build for Chrome
bun run build:firefox    # Production build for Firefox
bun run zip              # Create Chrome distribution zip
bun run zip:firefox      # Create Firefox distribution zip

# Quality Assurance
bun run compile          # TypeScript type checking
bun run postinstall      # Prepare WXT environment
```

### Custom Development Scripts

You can add custom scripts to `package.json`:

```json
{
  "scripts": {
    "dev:clean": "rm -rf .output && bun run dev",
    "build:all": "bun run build && bun run build:firefox",
    "test:types": "bun run compile",
    "format": "prettier --write .",
    "lint": "eslint . --ext .ts,.tsx"
  }
}
```

## Debugging

### Background Script Debugging

1. **Open Extension Management**: `chrome://extensions/`
2. **Find Enveil Extension**: Look for your development extension
3. **Click "Inspect views"**: Select "service worker" or "background page"
4. **Use DevTools**: Console, Network, Sources tabs available

**Common Debug Points:**
```typescript
// In background.ts
console.log('[Enveil Background] Tab updated:', tabId, url);
console.log('[Enveil Background] Config loaded:', config);
console.log('[Enveil Background] Match found:', matchedSite);
```

### Content Script Debugging

1. **Open Target Web Page**: Navigate to a page where Enveil should activate
2. **Open DevTools**: F12 or right-click → Inspect
3. **Check Console**: Look for Enveil content script messages
4. **Inspect Elements**: Find injected UI elements

**Common Debug Points:**
```typescript
// In content.ts
console.log('[Enveil Content] Message received:', message);
console.log('[Enveil Content] UI mounted:', site);
console.log('[Enveil Content] Shadow DOM created:', shadowRoot);
```

### Options Page Debugging

1. **Open Options Page**: Click extension icon → Options
2. **Open DevTools**: F12 or right-click → Inspect
3. **Use React DevTools**: If installed, provides component inspection
4. **Check Network Tab**: For import/export operations

### Common Issues and Solutions

**Extension Not Loading:**
```bash
# Check build output
ls -la .output/chrome-mv3/

# Verify manifest.json exists
cat .output/chrome-mv3/manifest.json

# Rebuild if necessary
rm -rf .output && bun run dev
```

**TypeScript Errors:**
```bash
# Run type checking
bun run compile

# Check specific file
npx tsc --noEmit entrypoints/background.ts
```

**Hot Reload Not Working:**
```bash
# Restart development server
# Ctrl+C to stop, then:
bun run dev

# Or clean rebuild
rm -rf .output && bun run dev
```

## Testing Your Changes

### Manual Testing Checklist

**Basic Functionality:**
- [ ] Extension loads without errors
- [ ] Options page opens and displays correctly
- [ ] Can create and save configuration groups
- [ ] Can add and configure site rules
- [ ] Visual indicators appear on matching pages
- [ ] Extension icon updates based on matches

**Advanced Features:**
- [ ] Cloud environment configuration works
- [ ] Import/export functionality operates correctly
- [ ] Browser sync toggles properly
- [ ] Different matching patterns work as expected
- [ ] Background overlays display for production environments

**Cross-Browser Testing:**
```bash
# Test Firefox build
bun run build:firefox
# Load .output/firefox-mv2 in Firefox
```

### Performance Testing

**Memory Usage:**
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Check "Inspect views" for memory usage
4. Monitor over time with multiple tabs

**CPU Usage:**
1. Open Chrome Task Manager (Shift+Esc)
2. Look for extension processes
3. Monitor CPU usage during normal browsing

## Contributing Workflow

### 1. Create Feature Branch

```bash
# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### 2. Make Changes

```bash
# Make your changes
# Test thoroughly
bun run compile
bun run build

# Commit changes
git add .
git commit -m "feat: add new feature description"
```

### 3. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
# Include description of changes and testing performed
```

## Advanced Development

### Custom Cloud Templates

Create new cloud provider templates:

```typescript
// In utils/cloudTemplates.ts
export const CUSTOM_CLOUD_TEMPLATE: CloudTemplate = {
  provider: CloudProvider.CUSTOM,
  name: 'Custom Cloud Provider',
  accountSelectionUrl: 'https://custom.cloud.com/login',
  consoleDomainPattern: '*://*.custom.cloud.com/*',
  selectors: {
    accountSelection: {
      accountContainers: ['.account-selector'],
      roleElements: ['.role-name']
    },
    console: {
      accountContainers: ['.user-info'],
      roleElements: ['.current-role']
    }
  }
};
```

### Custom Matching Logic

Extend the matcher for special use cases:

```typescript
// In utils/matcher.ts
export class CustomMatcher extends Matcher {
  static isCustomMatch(site: SiteConfig, url: string, host: string): boolean {
    // Your custom matching logic
    return false;
  }
}
```

### Development Environment Variables

Create `.env.local` for development-specific settings:

```bash
# .env.local
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

## Getting Help

### Resources
- **WXT Documentation**: [https://wxt.dev/](https://wxt.dev/)
- **Chrome Extension APIs**: [https://developer.chrome.com/docs/extensions/](https://developer.chrome.com/docs/extensions/)
- **TypeScript Handbook**: [https://www.typescriptlang.org/docs/](https://www.typescriptlang.org/docs/)
- **React Documentation**: [https://react.dev/](https://react.dev/)

### Community Support
- **GitHub Issues**: [https://github.com/formaxcn/enveil/issues](https://github.com/formaxcn/enveil/issues)
- **GitHub Discussions**: [https://github.com/formaxcn/enveil/discussions](https://github.com/formaxcn/enveil/discussions)

---

**Ready to start developing?** Follow the setup steps above and you'll be contributing to Enveil in no time!