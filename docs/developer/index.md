---
layout: default
title: Developer Documentation
nav_order: 4
has_children: true
---

# Developer Documentation

Welcome to the Enveil developer documentation. This section provides comprehensive technical information for developers who want to understand, modify, or contribute to Enveil.

## Overview

Enveil is built with modern web technologies and follows best practices for browser extension development:

- **Framework**: WXT (Web Extension Tools)
- **Language**: TypeScript with strict mode
- **UI**: React with Tailwind CSS
- **Build System**: Bun (preferred) or npm/yarn
- **Architecture**: Manifest V3 for Chrome, Manifest V2 for Firefox

## Documentation Sections

### [🏗️ Architecture](./architecture.html)
- System architecture and component design
- Data flow and state management
- Extension entry points and communication
- Security model and isolation strategies

### [📚 API Reference](./api-reference.html)
- Core APIs and interfaces
- Data structures and types
- Utility functions and helpers
- Extension APIs and message passing

### [⚙️ Development Setup](./development-setup.html)
- Local development environment
- Build and testing procedures
- Debugging techniques
- Hot reload and development workflow

### [🤝 Contributing Guide](./contributing.html)
- How to contribute to the project
- Code style and conventions
- Pull request process
- Issue reporting guidelines

## Quick Start for Developers

### Prerequisites
```bash
# Required
Node.js 18+
Bun (recommended) or npm/yarn

# Optional but recommended
Git
Chrome/Chromium browser
VS Code with TypeScript extension
```

### Development Setup
```bash
# Clone repository
git clone https://github.com/formaxcn/enveil.git
cd enveil

# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build
```

## Project Structure

```
enveil/
├── components/              # Reusable UI components
│   ├── AddSiteModal.tsx    # Site configuration modal
│   ├── CloudHighlighter.ts # Cloud highlighting logic
│   └── Switch.tsx          # Toggle switch component
├── entrypoints/            # Browser extension entry points
│   ├── background.ts       # Service worker
│   ├── content.ts          # Content script
│   ├── options/           # Options page
│   └── popup/             # Extension popup
├── utils/                  # Utility functions
│   ├── matcher.ts         # URL matching logic
│   ├── cloudMatcher.ts    # Cloud-specific matching
│   └── cloudTemplates.ts  # Cloud provider templates
├── docs/                   # Documentation
├── public/                 # Static assets
└── wxt.config.ts          # WXT configuration
```

## Key Technologies

### WXT Framework
- Modern web extension development framework
- Automatic manifest generation
- Hot reload during development
- Multi-browser support (Chrome, Firefox)

### TypeScript
- Strict mode enabled for type safety
- Comprehensive type definitions
- IntelliSense support in VS Code
- Compile-time error checking

### React + Tailwind CSS
- Modern UI development
- Component-based architecture
- Utility-first CSS framework
- Responsive design support

### Browser Extension APIs
- Manifest V3 for Chrome (future-proof)
- Storage API for configuration persistence
- Tabs API for environment detection
- Content scripts for UI injection

## Development Workflow

### 1. Local Development
```bash
# Start development server with hot reload
bun run dev

# The extension will be built to .output/chrome-mv3
# Load this directory as an unpacked extension in Chrome
```

### 2. Code Changes
- Edit source files in `components/`, `entrypoints/`, or `utils/`
- Changes are automatically detected and rebuilt
- Extension reloads automatically in development mode
- Refresh browser tabs to see content script changes

### 3. Testing
```bash
# Type checking
bun run compile

# Build production version
bun run build

# Create distribution package
bun run zip
```

### 4. Debugging
- Use Chrome DevTools for extension debugging
- Background script: `chrome://extensions` → Inspect views
- Content script: Regular page DevTools
- Options page: Right-click → Inspect

## Architecture Highlights

### Component Communication
```
Background Script ←→ Content Script ←→ Options Page
       ↓                    ↓              ↓
   Tab Events         UI Injection    Configuration
   URL Matching       Visual Updates   User Interface
   Icon Updates       Shadow DOM       Settings Management
```

### Data Flow
```
User Configuration → Storage API → Background Script → Content Script → Visual Indicators
                                      ↓
                                 Tab Events → URL Matching → Icon Updates
```

### Security Model
- **Shadow DOM**: Complete style isolation for injected UI
- **Content Security Policy**: Prevents inline script execution
- **Minimal Permissions**: Only `storage` and `tabs` permissions
- **Local Storage**: No external data transmission

## Contributing

We welcome contributions from the community! Here's how you can help:

### Types of Contributions
- **Bug Fixes**: Fix issues and improve stability
- **Features**: Add new functionality and capabilities
- **Documentation**: Improve guides and API documentation
- **Testing**: Add test coverage and quality assurance
- **Templates**: Create cloud provider configuration templates

### Getting Started
1. **Fork the repository** on GitHub
2. **Create a feature branch** from `main`
3. **Make your changes** following our coding standards
4. **Test thoroughly** with `bun run compile` and manual testing
5. **Submit a pull request** with clear description

### Code Standards
- **TypeScript**: Use strict mode and proper typing
- **Formatting**: Follow existing code style
- **Comments**: Document complex logic and public APIs
- **Commits**: Use clear, descriptive commit messages

## Resources

### External Documentation
- [WXT Framework](https://wxt.dev/) - Extension development framework
- [Chrome Extension APIs](https://developer.chrome.com/docs/extensions/) - Browser extension APIs
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript language guide
- [React Documentation](https://react.dev/) - React framework documentation

### Community
- [GitHub Repository](https://github.com/formaxcn/enveil) - Source code and issues
- [GitHub Discussions](https://github.com/formaxcn/enveil/discussions) - Community discussions
- [Issue Tracker](https://github.com/formaxcn/enveil/issues) - Bug reports and feature requests

---

**Ready to contribute?** Start with the [Development Setup](./development-setup.html) guide or check out our [Contributing Guide](./contributing.html).