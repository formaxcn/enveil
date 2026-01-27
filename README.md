# Enveil - Environment Visual Identifier

> **Status**: Beta / Active Development

A powerful Chrome extension for developers, DevOps engineers, and QA teams to visually distinguish different environments (Development, Staging, Production) through configurable banners, overlays, and intelligent URL matching.

## 🚀 Features

### **Visual Environment Identification**
- **Corner Banners**: Rotated ribbons in 4 positions with custom colors and text
- **Background Overlays**: Subtle full-page tinting (5% opacity) for critical environments
- **Shadow DOM Isolation**: UI elements don't interfere with page functionality
- **Real-time Updates**: Changes apply immediately without page refresh

### **Intelligent URL Matching**
- **5 Matching Strategies**: Domain, URL Prefix, Exact URL, Regex, and smart "Everything" mode
- **Auto-Detection**: Smart pattern recognition with multiple fallback strategies
- **Subdomain Support**: Automatic subdomain matching for domain patterns
- **Regex Power**: Advanced pattern matching for complex scenarios

### **Advanced Configuration Management**
- **Configuration Groups**: Organize rules by project, team, or environment type
- **Group Defaults**: Set default colors, positions, and settings for new sites
- **Import/Export**: Share configurations as JSON files (full or individual groups)
- **Browser Sync**: Cross-device synchronization with conflict resolution
- **10 Default Colors**: Carefully chosen palette optimized for different environments

## 📖 Documentation

**Complete documentation available at: [GitHub Pages](https://formaxcn.github.io/enveil/)**

- **[🏠 Home](https://formaxcn.github.io/enveil/)** - Overview and quick start
- **[✨ Features](https://formaxcn.github.io/enveil/features.html)** - Complete feature list
- **[🚀 Getting Started](https://formaxcn.github.io/enveil/getting-started.html)** - Installation and setup
- **[⚙️ Configuration](https://formaxcn.github.io/enveil/configuration.html)** - Detailed configuration guide
- **[🏗️ Architecture](https://formaxcn.github.io/enveil/architecture.html)** - Technical architecture
- **[📚 API Reference](https://formaxcn.github.io/enveil/api-reference.html)** - Developer API docs
- **[🔧 Development](https://formaxcn.github.io/enveil/development.html)** - Development guide
- **[🔒 Security](https://formaxcn.github.io/enveil/security.html)** - Security and privacy

## 🎯 Quick Start

### Installation (Development)
```bash
# Clone and build
git clone https://github.com/formaxcn/enveil.git
cd enveil
bun install
bun run build

# Load in Chrome
# 1. Go to chrome://extensions
# 2. Enable Developer mode  
# 3. Click "Load unpacked"
# 4. Select the .output/chrome-mv3 folder
```

### Basic Configuration
1. Click the Enveil icon → **Options**
2. Create a configuration group (e.g., "Work Projects")
3. Add a site rule:
   ```
   Pattern: domain
   Value: localhost
   Environment: DEV
   Color: Blue (#4a9eff)
   Position: Top Right
   ```
4. Visit `http://localhost:3000` and see your banner!

## 🎨 Common Use Cases

### Development Teams
```
🔵 DEV (localhost) - Blue banner, top-right
🟡 STAGING (staging.app.com) - Yellow banner, top-right  
🔴 PROD (app.com) - Red banner + background overlay
```

### API Development
```
🔵 API-V1 (api.example.com/v1) - Blue banner
🟡 API-V2 (api.example.com/v2) - Yellow banner
🔴 API-PROD (api.example.com/prod) - Red banner + overlay
```

### Multi-tenant Applications
```
🔵 CLIENT-A (client-a.app.com) - Blue banner
🟢 CLIENT-B (client-b.app.com) - Green banner
🟠 CLIENT-C (client-c.app.com) - Orange banner
```

## 🛠️ Development

### Prerequisites
- **Node.js** (v18+)
- **Bun** (Latest)
- **Chrome** (for testing)

### Development Workflow
```bash
# Install dependencies
bun install

# Development server with hot-reload
bun run dev

# Build for production
bun run build

# Build for Firefox
bun run build:firefox

# Create extension package
bun run zip
```

### Project Structure
```
enveil/
├── entrypoints/          # Extension entry points
│   ├── background.ts     # Service worker
│   ├── content.ts        # Content script
│   ├── popup/           # Extension popup
│   └── options/         # Configuration interface
├── components/          # Reusable UI components
├── utils/              # Utility functions
├── docs/               # Documentation (GitHub Pages)
└── public/             # Static assets
```

## 🏗️ Architecture

### Core Components
- **Background Service Worker**: Handles tab events, configuration sync, and URL matching
- **Content Script**: Injects visual indicators using Shadow DOM
- **Options Page**: Comprehensive configuration interface with manager pattern
- **Popup**: Quick access and status indicator

### Data Flow
```
User Configuration → Storage → Background Script → 
URL Matching → Content Script → Visual Indicators
```

### Key Technologies
- **Framework**: WXT (Web Extension Tools) with Manifest V3
- **Language**: TypeScript with full type safety
- **Storage**: Chrome Storage API (sync for cross-device)
- **UI**: Vanilla HTML/CSS/JS with modular components
- **Build**: Bun with TypeScript compilation

## 🔒 Privacy & Security

- **100% Local**: All data stored locally or synced via Chrome Storage
- **No Tracking**: Zero analytics or external data collection  
- **No Network**: No external API calls or data transmission
- **Shadow DOM**: Complete style isolation prevents page interference
- **Minimal Permissions**: Only requests `storage` and `tabs` permissions

## 🌟 Browser Support

| Browser | Status | Notes |
|---------|--------|-------|
| **Chrome** | ✅ Full Support | Primary target, all features |
| **Firefox** | ✅ Compatible | Build with `bun run build:firefox` |
| **Edge** | 🔄 Planned | Chromium-based, should work |

## 📋 Roadmap

### **Current (v1.0)**
- ✅ Visual indicators (banners, overlays)
- ✅ 5 matching strategies with auto-detection
- ✅ Configuration groups with defaults
- ✅ Import/export system
- ✅ Browser synchronization

### **Near Term (v1.1)**
- 🔄 Complete Shadow DOM implementation
- 🔄 Unit and E2E test coverage
- 🔄 Enhanced Options page UX
- 🔄 Rule testing tools

### **Future (v2.0+)**
- 📋 Drag & drop rule reordering
- 📋 Conditional logic (AND/OR)
- 📋 Time-based rules
- 📋 Plugin architecture

## 🤝 Contributing

Contributions welcome! Whether fixing bugs, adding features, improving docs, or sharing templates.

### Ways to Contribute
- 🐛 **Bug Reports**: Found an issue? Let us know!
- 💡 **Feature Requests**: Have an idea? We'd love to hear it!
- 🔧 **Code**: Submit pull requests for fixes and features
- 📚 **Documentation**: Help improve our docs and examples
- 🎨 **Templates**: Share useful configuration templates

### Development Setup
```bash
git clone https://github.com/formaxcn/enveil.git
cd enveil
bun install
bun run dev
```

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Never work on the wrong environment again!** 🎯

[📖 Read the Docs](https://formaxcn.github.io/enveil/) | [🚀 Get Started](https://formaxcn.github.io/enveil/getting-started.html) | [⚙️ Configuration Guide](https://formaxcn.github.io/enveil/configuration.html)