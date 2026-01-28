---
layout: default
title: Architecture
parent: Developer Documentation
nav_order: 1
---

# Architecture Documentation

## Overview

Enveil is built using modern web extension technologies with a focus on performance, security, and maintainability. The architecture follows Chrome Extension Manifest V3 standards while maintaining compatibility with Firefox through Manifest V2 builds.

## Technology Stack

### Core Technologies
- **WXT Framework**: Modern web extension development framework
- **TypeScript**: Strict mode for type safety and better developer experience
- **React**: UI components for the options page
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Bun**: Package manager and build tool (preferred over npm/yarn)

### Browser Extension Architecture
- **Manifest V3**: Primary target for Chrome and Chromium-based browsers
- **Manifest V2**: Firefox compatibility build
- **Service Worker**: Background script for Chrome (replaces background pages)
- **Content Scripts**: Injected into web pages for UI rendering
- **Shadow DOM**: Style isolation for injected UI elements

## System Architecture

### High-Level Component Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Options Page  │    │ Background      │    │ Content Script  │
│   (React UI)    │    │ Service Worker  │    │ (UI Injection)  │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Configuration │    │ • URL Matching  │    │ • Banner Render │
│ • Group Mgmt    │    │ • Tab Events    │    │ • Overlay Render│
│ • Import/Export │    │ • Icon Updates  │    │ • Shadow DOM    │
│ • Cloud Config  │    │ • Message Route │    │ • Cloud Highlight│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Chrome Storage  │
                    │ API (Sync)      │
                    ├─────────────────┤
                    │ • App Config    │
                    │ • Cloud Envs    │
                    │ • Default Colors│
                    └─────────────────┘
```

### Data Flow Architecture

```
User Action → Options Page → Storage API → Background Script → Content Script → Visual Update
     ↑                                           ↓
Configuration UI                            Tab Events
     ↑                                           ↓
Import/Export                              URL Matching
     ↑                                           ↓
Browser Sync                               Icon Updates
```

## Core Components

### 1. Background Service Worker (`entrypoints/background.ts`)

**Responsibilities:**
- Monitor tab events (`tabs.onUpdated`, `tabs.onActivated`)
- Perform URL matching against configured rules
- Update extension icon based on match status
- Send messages to content scripts
- Handle configuration changes via storage events

**Key Functions:**
```typescript
// Main tab checking function
async function checkAndNotifyTab(tabId: number, url: string)

// Configuration loading
async function loadConfig(): Promise<AppConfig | null>

// Icon management
async function setIconForTab(tabId: number, isMatch: boolean)
```

**Event Handling:**
- **Tab Updates**: Detects page loads and URL changes
- **Tab Activation**: Updates when switching between tabs
- **Storage Changes**: Responds to configuration updates
- **Extension Install**: Initial setup and configuration

### 2. Content Script (`entrypoints/content.ts`)

**Responsibilities:**
- Receive messages from background script
- Create and manage visual indicators
- Handle Shadow DOM for style isolation
- Manage cloud environment highlighting
- Clean up UI elements when needed

**UI Components:**
- **Corner Banners**: Rotated ribbons with environment labels
- **Background Overlays**: Full-page color tinting
- **Cloud Highlighting**: Account and role text highlighting

**Shadow DOM Implementation:**
```typescript
// Create isolated shadow root
shadowHost = document.createElement('div');
shadowRoot = shadowHost.attachShadow({ mode: 'open' });

// Inject styles and UI elements
shadowRoot.innerHTML = `
  <style>/* Isolated styles */</style>
  <div class="banner-container">...</div>
`;
```

### 3. Options Page (`entrypoints/options/`)

**Architecture Pattern**: Component-based React application

**Main Components:**
- **App.tsx**: Main application component with tab management
- **ConfigGroup.tsx**: Configuration group management
- **CloudEnvironmentItem.tsx**: Cloud environment configuration
- **Modal Components**: Add/edit dialogs for sites, groups, and cloud configs

**State Management:**
- Local React state for UI interactions
- Chrome Storage API for persistence
- Real-time updates via storage events

**Key Features:**
- Tabbed interface (Configs vs Cloud)
- Modal-based editing
- Real-time preview
- Import/export functionality
- Browser sync management

### 4. Utility Layer (`utils/`)

#### Matcher (`utils/matcher.ts`)
Core URL matching logic supporting multiple strategies:

```typescript
class Matcher {
  static isMatch(site: SiteConfig, url: string, host: string): boolean
  static getMatchInfo(site: SiteConfig): string
}
```

**Matching Strategies:**
- **Domain**: Hostname matching with subdomain support
- **URL Prefix**: Path-based matching
- **Exact URL**: Precise URL matching
- **Regex**: Advanced pattern matching
- **Everything**: Auto-detection with fallback strategies

#### Cloud Matcher (`utils/cloudMatcher.ts`)
Extended matching for cloud environments:

```typescript
class CloudMatcher extends Matcher {
  static isCloudAccountMatch(account: CloudAccount, url: string, host: string): boolean
  static findMatchingRoles(roles: CloudRole[], pageContent: string): CloudRole[]
  static extractRoleKeywords(content: string, roles: CloudRole[]): string[]
}
```

#### Cloud Templates (`utils/cloudTemplates.ts`)
Pre-configured templates for major cloud providers:

```typescript
const HARDCODED_CLOUD_TEMPLATES: Record<CloudProvider, CloudTemplate> = {
  [CloudProvider.AWS_CN]: { /* AWS China configuration */ },
  [CloudProvider.AWS_GLOBAL]: { /* AWS Global configuration */ },
  [CloudProvider.AZURE]: { /* Microsoft Azure configuration */ },
  [CloudProvider.GCP]: { /* Google Cloud Platform configuration */ }
}
```

## Data Architecture

### Configuration Structure

```typescript
interface AppConfig {
  browserSync: boolean;           // Cross-device sync toggle
  defaultColors: string[];        // Color palette
  settings: Setting[];            // Traditional site configurations
  cloudEnvironments?: CloudEnvironment[]; // Cloud-specific configurations
}

interface Setting {
  name: string;                   // Group name
  enable: boolean;                // Group toggle
  sites: SiteConfig[];            // Site rules
  defaults?: GroupDefaults;       // Group-level defaults
}

interface CloudEnvironment {
  id: string;                     // Unique identifier
  name: string;                   // Display name
  provider: CloudProvider;        // AWS, Azure, GCP, etc.
  accounts: CloudAccount[];       // Account configurations
  enable: boolean;                // Environment toggle
}
```

### Storage Strategy

**Primary Storage**: Chrome Storage Sync API
- **Key**: `sync:appConfig`
- **Capacity**: 100KB limit (Chrome sync storage)
- **Sync**: Automatic across Chrome instances
- **Fallback**: Local storage for large configurations

**Storage Events**: Real-time configuration updates
```typescript
storage.watch<AppConfig>('sync:appConfig', async (newConfig) => {
  // Re-evaluate all tabs when configuration changes
  const tabs = await browser.tabs.query({});
  for (const tab of tabs) {
    if (tab.id && tab.url) {
      await checkAndNotifyTab(tab.id, tab.url);
    }
  }
});
```

## Security Architecture

### Permissions Model
- **`storage`**: Configuration persistence and sync
- **`tabs`**: URL detection and icon updates
- **No network permissions**: 100% local operation

### Content Security Policy
- **No inline scripts**: All JavaScript in separate files
- **No eval()**: Static code only
- **Strict CSP**: Prevents code injection attacks

### Style Isolation
- **Shadow DOM**: Complete CSS isolation for injected UI
- **Scoped Styles**: No interference with host page styles
- **Z-index Management**: Proper layering without conflicts

### Data Privacy
- **Local Storage**: All data stored locally or synced via Chrome
- **No Analytics**: Zero external data collection
- **No Network Calls**: No external API dependencies

## Performance Architecture

### Optimization Strategies

**Matching Performance:**
- **First Match Wins**: Stop processing after finding a match
- **Rule Ordering**: Process most likely matches first
- **Lazy Loading**: Load configurations only when needed

**Memory Management:**
- **Event Cleanup**: Proper removal of event listeners
- **DOM Cleanup**: Remove UI elements when not needed
- **Storage Efficiency**: Minimal data structure overhead

**Background Script Efficiency:**
- **Event-Driven**: Only process when tabs change
- **Debounced Updates**: Batch multiple rapid changes
- **Selective Processing**: Skip inactive tabs

### Build Optimization

**WXT Framework Benefits:**
- **Tree Shaking**: Remove unused code
- **Code Splitting**: Separate bundles for different entry points
- **Asset Optimization**: Automatic image and resource optimization
- **Source Maps**: Development debugging support

## Extension Communication

### Message Passing Architecture

```typescript
// Background → Content Script
interface MatchUpdateMessage {
  action: 'MATCH_UPDATE';
  site: SiteConfig | null;
}

interface CloudMatchUpdateMessage {
  action: 'CLOUD_MATCH_UPDATE';
  cloudAccount: CloudAccount | null;
  cloudRoles: CloudRole[] | null;
}
```

### Event Flow

1. **Tab Event**: User navigates to new page
2. **Background Processing**: URL matching against rules
3. **Icon Update**: Extension icon reflects match status
4. **Message Dispatch**: Send match results to content script
5. **UI Injection**: Content script creates visual indicators
6. **Storage Sync**: Configuration changes propagate across devices

## Cloud Architecture Integration

### Multi-Cloud Support

**Provider Templates:**
- Pre-configured selectors for major cloud platforms
- Extensible architecture for custom providers
- Template-based account and role detection

**Dual-Layer Highlighting:**
- **Account Level**: Background color highlighting
- **Role Level**: Text keyword highlighting
- **Coordinated Display**: Both layers work together

**Dynamic Content Handling:**
- **Mutation Observer**: Detect dynamically loaded content
- **Re-highlighting**: Apply rules to new content
- **Performance Optimization**: Debounced updates

## Development Architecture

### Build System
- **WXT Configuration**: `wxt.config.ts` for build settings
- **TypeScript Config**: Strict mode with comprehensive type checking
- **Multi-Browser Builds**: Chrome (MV3) and Firefox (MV2) support

### Development Workflow
- **Hot Reload**: Automatic extension reload during development
- **Source Maps**: Full debugging support
- **Type Safety**: Compile-time error detection
- **Linting**: Code quality enforcement

### Testing Strategy
- **Type Checking**: `bun run compile` for static analysis
- **Build Verification**: `bun run build` for production readiness
- **Manual Testing**: Browser-based functional testing
- **Performance Monitoring**: Chrome DevTools integration

## Scalability Considerations

### Configuration Scaling
- **Group Organization**: Logical grouping for large configurations
- **Rule Optimization**: Efficient matching algorithms
- **Storage Limits**: Chrome sync storage capacity management

### Feature Extensibility
- **Plugin Architecture**: Planned for future versions
- **Template System**: Extensible cloud provider support
- **API Design**: Stable interfaces for future enhancements

### Performance Scaling
- **Rule Caching**: In-memory caching for frequently accessed rules
- **Batch Processing**: Efficient handling of multiple tab updates
- **Resource Management**: Minimal memory and CPU usage

This architecture provides a solid foundation for Enveil's current functionality while supporting future enhancements and maintaining excellent performance and security standards.