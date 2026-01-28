---
layout: default
title: Home
nav_order: 1
---

# Enveil - Environment Visual Identifier

**Enveil** is a powerful Chrome Extension designed to help developers, DevOps engineers, and QA teams visually distinguish between different environments (Development, Staging, Production) through configurable visual indicators injected into web pages.

## Why Enveil?

Working with multiple environments can be confusing and dangerous. Accidentally running commands on production, testing on the wrong environment, or deploying to the wrong server can have serious consequences. Enveil solves this by providing instant visual feedback about which environment you're currently viewing.

## Key Features

### 🎯 **Intelligent URL Matching**
- **5 Matching Strategies**: Domain, URL Prefix, Exact URL, Regex, and smart "Everything" mode
- **Subdomain Support**: Automatically matches subdomains when using domain patterns
- **Regex Power**: Advanced pattern matching for complex scenarios
- **Auto-Detection**: Smart pattern recognition with multiple fallback strategies

### 🎨 **Flexible Visual Indicators**
- **Corner Banners**: Rotated ribbons in any of 4 corners with custom text and colors
- **Background Overlays**: Subtle full-page color tinting (5% opacity) for dangerous environments
- **Shadow DOM Isolation**: UI elements don't interfere with page functionality or styles
- **Customizable Positioning**: Choose the perfect spot for your environment indicators

### 📁 **Configuration Groups**
- **Logical Organization**: Group related rules by project, team, or environment type
- **Group Defaults**: Set default colors, positions, and settings for new sites
- **Bulk Operations**: Enable/disable entire groups with one click
- **Hierarchical Management**: Organize complex multi-environment setups efficiently

### 🎨 **Advanced Color System**
- **10 Default Colors**: Carefully chosen palette optimized for different environments
- **Unlimited Custom Colors**: Full color picker with hex code support
- **Consistent Theming**: Use the same colors across different projects
- **High Contrast**: Automatic text color optimization for readability

### 🔄 **Configuration Management**
- **Import/Export**: Share configurations as JSON files
- **Group Export**: Export individual project configurations
- **Browser Sync**: Synchronize settings across Chrome instances
- **Conflict Resolution**: Smart handling of configuration conflicts
- **Backup & Restore**: Safe configuration management with automatic backups

## Quick Start

### 1. **Installation**
Currently in development. Install as an unpacked extension:

```bash
# Clone and build
git clone https://github.com/your-repo/enveil.git
cd enveil
bun install
bun run build

# Load in Chrome
# 1. Go to chrome://extensions
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the .output/chrome-mv3 folder
```

### 2. **Basic Configuration**
1. Click the Enveil icon in your toolbar
2. Select **Options** to open the configuration dashboard
3. Create your first configuration group (e.g., "Work Projects")
4. Add a site rule:
   - **Pattern**: `domain`
   - **Value**: `localhost` (or your development domain)
   - **Environment Name**: `DEV`
   - **Color**: Blue (`#4a9eff`)
   - **Position**: `rightTop`
   - **Enable Banner**: ✓

### 3. **See It in Action**
Visit your configured site (e.g., `http://localhost:3000`) and see the banner appear instantly!

## Common Use Cases

### **Development Teams**
```
🔵 DEV (localhost) - Blue banner, top-right
🟡 STAGING (staging.app.com) - Yellow banner, top-right  
🔴 PROD (app.com) - Red banner + background overlay, top-right
```

### **QA Testing**
```
🟢 TEST-1 (test1.example.com) - Green banner
🟠 TEST-2 (test2.example.com) - Orange banner
🟣 UAT (uat.example.com) - Purple banner
```

### **API Development**
```
🔵 API-V1 (api.example.com/v1) - Blue banner
🟡 API-V2 (api.example.com/v2) - Yellow banner
🔴 API-PROD (api.example.com/prod) - Red banner + overlay
```

### **Multi-tenant Applications**
```
🔵 CLIENT-A (client-a.app.com) - Blue banner
🟢 CLIENT-B (client-b.app.com) - Green banner
🟠 CLIENT-C (client-c.app.com) - Orange banner
```

## Advanced Features

### **Smart Pattern Matching**
The "Everything" pattern uses intelligent detection:
- `*` → Matches all URLs
- `localhost` → Matches localhost and subdomains
- `https://api.example.com` → URL prefix matching
- `/^https?:\/\/.*\.dev$/` → Regex for .dev domains

### **Configuration Groups with Defaults**
Set up group-level defaults to speed up configuration:
```json
{
  "name": "Production Sites",
  "defaults": {
    "envName": "PROD",
    "color": "#f44336",
    "backgroundEnable": true,
    "flagEnable": true
  }
}
```

### **Cross-Device Synchronization**
Enable browser sync to keep configurations synchronized across all your Chrome instances with intelligent conflict resolution.

### **Import/Export System**
- **Full Export**: Complete configuration backup (`enveil.json`)
- **Group Export**: Share project-specific configurations (`enveil.group.json`)
- **Team Sharing**: Distribute standardized environment configurations

## Technical Highlights

### **Built for Performance**
- **First Match Wins**: Stops processing after finding a match
- **Event-Driven**: Only processes when needed
- **Minimal Memory**: Efficient data structures and cleanup
- **Shadow DOM**: Isolated UI with zero page impact

### **Privacy & Security**
- **100% Local**: All data stored locally or synced via Chrome
- **No Tracking**: Zero analytics or external data collection
- **No Network**: No external API calls or data transmission
- **Secure Isolation**: Shadow DOM prevents style conflicts and interference

### **Developer-Friendly**
- **TypeScript**: Full type safety and IntelliSense support
- **WXT Framework**: Modern extension development tools
- **Hot Reload**: Instant updates during development
- **Multi-browser**: Chrome and Firefox support

## Documentation

Comprehensive documentation is available:

- **[Features Overview](./features.md)** - Complete feature list and capabilities
- **[Getting Started](./getting-started.md)** - Installation and basic setup
- **[Configuration Guide](./configuration.md)** - Detailed configuration options
- **[Architecture](./architecture.md)** - Technical architecture and design
- **[API Reference](./api-reference.md)** - Developer API documentation
- **[Development](./development.md)** - Development setup and contribution guide
- **[Security](./security.md)** - Security model and privacy information

## Browser Support

| Browser | Status | Notes |
|---------|--------|-------|
| **Chrome** | ✅ Full Support | Primary target, all features |
| **Firefox** | ✅ Compatible | Build available with `bun run build:firefox` |
| **Edge** | 🔄 Planned | Chromium-based, should work |
| **Safari** | ❌ Not Supported | Different extension architecture |

## Roadmap

### **Current (v1.0)**
- ✅ Core visual indicators (banners, overlays)
- ✅ 5 matching strategies with intelligent auto-detection
- ✅ Configuration groups with defaults
- ✅ Import/export system
- ✅ Browser synchronization
- ✅ Shadow DOM isolation

### **Near Term (v1.1)**
- 🔄 Complete Shadow DOM implementation
- 🔄 Unit and E2E test coverage
- 🔄 Enhanced Options page UX
- 🔄 Rule testing and validation tools
- 🔄 Configuration templates

### **Future (v2.0+)**
- 📋 Drag & drop rule reordering
- 📋 Conditional logic (AND/OR operations)
- 📋 Time-based rules
- 📋 User agent matching
- 📋 Plugin architecture
- 📋 Rule templates library

## Contributing

Enveil is open source and welcomes contributions! Whether you're fixing bugs, adding features, improving documentation, or sharing configuration templates, your help is appreciated.

### **Development Setup**
```bash
git clone https://github.com/your-repo/enveil.git
cd enveil
bun install
bun run dev  # Start development server
```

### **Ways to Contribute**
- 🐛 **Bug Reports**: Found an issue? Let us know!
- 💡 **Feature Requests**: Have an idea? We'd love to hear it!
- 🔧 **Code Contributions**: Submit pull requests for fixes and features
- 📚 **Documentation**: Help improve our docs and examples
- 🎨 **Templates**: Share useful configuration templates
- 🧪 **Testing**: Help test new features and report feedback

## License

MIT License - see [LICENSE](../LICENSE) for details.

---

**Ready to eliminate environment confusion?** Install Enveil and never accidentally work on the wrong environment again!

[Get Started](./getting-started.md){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/your-repo/enveil){: .btn .fs-5 .mb-4 .mb-md-0 }
