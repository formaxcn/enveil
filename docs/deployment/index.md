---
layout: default
title: Deployment
nav_order: 5
has_children: true
---

# Deployment Documentation

This section covers the build, packaging, and deployment processes for Enveil across different platforms and distribution channels.

## Overview

Enveil supports multiple deployment targets and distribution methods:

- **Chrome Web Store**: Official Chrome extension marketplace
- **Firefox Add-ons**: Mozilla's extension marketplace  
- **GitHub Releases**: Direct distribution via GitHub
- **Self-hosted**: Private distribution for organizations

## Deployment Targets

### Browser Support Matrix

| Browser | Manifest | Build Command | Output Directory |
|---------|----------|---------------|------------------|
| **Chrome** | V3 | `bun run build` | `.output/chrome-mv3` |
| **Firefox** | V2 | `bun run build:firefox` | `.output/firefox-mv2` |
| **Edge** | V3 | `bun run build` | `.output/chrome-mv3` |

### Distribution Formats

| Format | Use Case | Creation Command |
|--------|----------|------------------|
| **ZIP** | Store submission | `bun run zip` |
| **CRX** | Self-hosting | GitHub Actions |
| **XPI** | Firefox self-hosting | `bun run zip:firefox` |

## Quick Navigation

### [🏗️ Build Process](./build-process.html)
- Local build procedures
- Automated CI/CD pipeline
- Build optimization and validation
- Multi-browser build management

### [🏪 Chrome Store Publishing](./chrome-store.html)
- Chrome Web Store submission process
- Store listing optimization
- Review process and guidelines
- Update and maintenance procedures

## Build Overview

### Development vs Production

**Development Build:**
```bash
bun run dev
# - Source maps enabled
# - Hot reload active
# - Debug logging enabled
# - Unminified code
```

**Production Build:**
```bash
bun run build
# - Code minification
# - Asset optimization
# - Source maps removed
# - Debug logging disabled
```

### Automated Builds

Enveil uses GitHub Actions for automated building and releasing:

- **Push to main**: Creates development builds
- **Tag creation**: Triggers release builds
- **Pull requests**: Validates build integrity

## Release Process

### Version Management

Enveil follows semantic versioning (SemVer):
- **Major** (1.0.0): Breaking changes
- **Minor** (1.1.0): New features, backward compatible
- **Patch** (1.1.1): Bug fixes, backward compatible

### Release Workflow

1. **Version Bump**: Update version in `package.json` and `wxt.config.ts`
2. **Build & Test**: Ensure all builds complete successfully
3. **Tag Release**: Create Git tag with version number
4. **Automated Build**: GitHub Actions creates release artifacts
5. **Store Submission**: Upload to Chrome Web Store and Firefox Add-ons

## Security Considerations

### Code Signing

- **Chrome**: Automatic signing by Chrome Web Store
- **Firefox**: Automatic signing by Mozilla Add-ons
- **Self-hosted**: Manual signing with private keys

### Content Security Policy

Production builds enforce strict CSP:
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### Permission Auditing

Regular review of requested permissions:
- **storage**: Configuration persistence
- **tabs**: URL detection and icon updates
- **No network permissions**: Maintains privacy guarantee

## Distribution Channels

### Official Stores
- **Chrome Web Store**: Primary distribution channel
- **Firefox Add-ons**: Secondary distribution channel
- **Edge Add-ons**: Future consideration

### Direct Distribution
- **GitHub Releases**: Development and beta versions
- **Enterprise**: Custom distribution for organizations
- **Self-hosted**: Private deployment scenarios

## Monitoring and Analytics

### Build Monitoring
- GitHub Actions status
- Build success/failure rates
- Build time optimization

### Distribution Metrics
- Download counts from stores
- User adoption rates
- Version distribution

### Error Tracking
- Extension error reporting
- Crash analytics
- Performance monitoring

---

Ready to deploy? Start with the [Build Process](./build-process.html) guide or jump directly to [Chrome Store Publishing](./chrome-store.html).