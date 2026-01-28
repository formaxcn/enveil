---
layout: default
title: Build Process
parent: Deployment
nav_order: 1
---

# Build Process

This guide covers the complete build process for Enveil, from local development builds to production releases ready for distribution.

## Build System Overview

Enveil uses the WXT framework for building browser extensions, which provides:
- **Automatic Manifest Generation**: Creates proper manifest files for different browsers
- **Multi-browser Support**: Builds for Chrome (MV3) and Firefox (MV2)
- **Asset Optimization**: Compresses images and optimizes resources
- **TypeScript Compilation**: Transpiles TypeScript to JavaScript
- **Hot Reload**: Development server with automatic rebuilds

## Local Build Process

### Development Builds

**Start Development Server:**
```bash
# Chrome development build with hot reload
bun run dev

# Firefox development build
bun run dev:firefox
```

**Development Build Features:**
- Source maps for debugging
- Unminified code for readability
- Hot reload for rapid development
- Debug logging enabled
- Development-specific configurations

**Output Structure:**
```
.output/
├── chrome-mv3/          # Chrome development build
│   ├── manifest.json    # Generated Manifest V3
│   ├── background.js    # Service worker
│   ├── content.js       # Content script
│   ├── options.html     # Options page
│   └── assets/          # Icons and resources
└── firefox-mv2/         # Firefox development build
    ├── manifest.json    # Generated Manifest V2
    ├── background.js    # Background script
    └── ...
```

### Production Builds

**Create Production Build:**
```bash
# Chrome production build
bun run build

# Firefox production build  
bun run build:firefox

# Build both browsers
bun run build && bun run build:firefox
```

**Production Build Features:**
- Code minification and optimization
- Asset compression
- Source maps removed
- Debug logging disabled
- Production-specific configurations

**Build Verification:**
```bash
# Type checking
bun run compile

# Verify build output
ls -la .output/chrome-mv3/
ls -la .output/firefox-mv2/
```

### Distribution Packages

**Create ZIP Packages:**
```bash
# Chrome ZIP for Web Store submission
bun run zip

# Firefox XPI for Add-ons submission
bun run zip:firefox
```

**Package Contents:**
- All extension files
- Proper directory structure
- Optimized assets
- Valid manifest files

## Automated Build Pipeline

### GitHub Actions Workflow

Enveil uses GitHub Actions for automated building and releasing:

**Workflow File:** `.github/workflows/build.yml`

```yaml
name: Build Chrome Extension

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  create:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Bun
      uses: oven-sh/setup-bun@v1
      with:
        bun-version: latest
    
    - name: Install dependencies
      run: bun install
    
    - name: Type check
      run: bun run compile
    
    - name: Build Chrome extension
      run: bun run build
    
    - name: Build Firefox extension
      run: bun run build:firefox
    
    - name: Create distribution packages
      run: |
        bun run zip
        bun run zip:firefox
    
    - name: Upload artifacts
      uses: actions/upload-artifact@v4
      with:
        name: extension-builds
        path: |
          .output/*.zip
          .output/*.xpi
```

### Automated Release Process

**Trigger Conditions:**
- **Push to main**: Development builds
- **Pull requests**: Build validation
- **Tag creation**: Release builds

**Release Workflow:**
1. **Version Detection**: Extract version from Git tag
2. **Build Creation**: Generate production builds
3. **Package Creation**: Create ZIP and CRX files
4. **Release Creation**: Upload to GitHub Releases
5. **Artifact Storage**: Store build artifacts

### Build Artifacts

**Generated Files:**
```
Artifacts/
├── enveil-chrome-v1.0.0.zip     # Chrome Web Store package
├── enveil-firefox-v1.0.0.xpi    # Firefox Add-ons package
├── enveil-chrome-v1.0.0.crx     # Chrome self-hosted package
└── build-info.json              # Build metadata
```

## Build Configuration

### WXT Configuration (`wxt.config.ts`)

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
    description: "Environment Visual Identifier for Chrome",
    icons: {
      "16": "icon/16.png",
      "32": "icon/32.png", 
      "48": "icon/48.png",
      "96": "icon/96.png",
      "128": "icon/128.png",
    },
    permissions: ["storage", "tabs"],
    // Browser-specific configurations handled automatically
  },
});
```

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "extends": "./.wxt/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": [
    "entrypoints/**/*",
    "components/**/*", 
    "utils/**/*"
  ]
}
```

### Package Configuration (`package.json`)

```json
{
  "name": "enveil",
  "version": "1.0.0",
  "scripts": {
    "dev": "wxt",
    "dev:firefox": "wxt -b firefox",
    "build": "wxt build",
    "build:firefox": "wxt build -b firefox", 
    "zip": "wxt zip",
    "zip:firefox": "wxt zip -b firefox",
    "compile": "tsc --noEmit"
  }
}
```

## Build Optimization

### Asset Optimization

**Image Processing:**
- Automatic icon generation for different sizes
- PNG optimization for smaller file sizes
- SVG optimization for vector graphics

**Code Optimization:**
- TypeScript compilation with strict mode
- JavaScript minification in production
- CSS optimization and purging
- Tree shaking to remove unused code

### Bundle Analysis

**Analyze Build Size:**
```bash
# Build with analysis
ANALYZE=true bun run build

# Check bundle sizes
du -sh .output/chrome-mv3/*
```

**Optimization Strategies:**
- Remove unused dependencies
- Optimize large assets
- Split code into smaller chunks
- Use dynamic imports where appropriate

## Build Validation

### Pre-build Checks

```bash
# Type checking
bun run compile

# Dependency audit
bun audit

# License compliance check
npx license-checker --summary
```

### Post-build Validation

```bash
# Verify manifest validity
node -e "console.log(JSON.parse(require('fs').readFileSync('.output/chrome-mv3/manifest.json')))"

# Check file sizes
find .output -name "*.js" -exec wc -c {} +

# Validate extension structure
ls -la .output/chrome-mv3/
```

### Testing Builds

**Load Test Extension:**
1. Open `chrome://extensions/`
2. Enable Developer mode
3. Load unpacked extension from `.output/chrome-mv3`
4. Test core functionality

**Automated Testing:**
```bash
# Run type checks
bun run compile

# Build verification
bun run build
if [ $? -eq 0 ]; then
  echo "Build successful"
else
  echo "Build failed"
  exit 1
fi
```

## Build Troubleshooting

### Common Build Issues

**TypeScript Errors:**
```bash
# Check specific file
npx tsc --noEmit entrypoints/background.ts

# Fix common issues
# - Missing type definitions
# - Incorrect import paths
# - Strict mode violations
```

**Asset Loading Issues:**
```bash
# Verify asset paths
ls -la public/icon/
ls -la .output/chrome-mv3/icon/

# Check manifest references
grep -r "icon" .output/chrome-mv3/manifest.json
```

**Build Size Issues:**
```bash
# Analyze bundle size
npx webpack-bundle-analyzer .output/chrome-mv3/

# Identify large dependencies
npm ls --depth=0
```

### Build Performance

**Optimization Tips:**
- Use `bun` instead of `npm` for faster installs
- Enable parallel builds where possible
- Cache dependencies in CI/CD
- Use incremental TypeScript compilation

**Build Time Monitoring:**
```bash
# Time the build process
time bun run build

# Profile build performance
PROFILE=true bun run build
```

## Environment-Specific Builds

### Development Environment

```bash
# Development with debug features
NODE_ENV=development bun run build
```

### Staging Environment

```bash
# Staging build with limited debug
NODE_ENV=staging bun run build
```

### Production Environment

```bash
# Production build with full optimization
NODE_ENV=production bun run build
```

## Build Artifacts Management

### Artifact Storage

**Local Storage:**
- `.output/` directory for build outputs
- `dist/` directory for distribution packages
- `.cache/` directory for build cache

**Remote Storage:**
- GitHub Releases for tagged versions
- CI/CD artifact storage
- CDN for public distribution

### Cleanup

```bash
# Clean build outputs
rm -rf .output/

# Clean all generated files
rm -rf .output/ .cache/ dist/

# Clean and rebuild
rm -rf .output/ && bun run build
```

---

**Next Steps:** Once you have a successful build, proceed to [Chrome Store Publishing](./chrome-store.html) to distribute your extension.