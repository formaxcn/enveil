---
layout: default
title: Architecture
nav_order: 5
---

# Architecture Documentation

## Overview
Enveil is a Chrome Extension built using the [WXT](https://wxt.dev/) framework. It helps developers and DevOps engineers identify different environments (dev, staging, prod) by injecting configurable visual indicators into web pages based on sophisticated matching rules.

## Tech Stack
- **Framework**: WXT (Web Extension Tools) with Manifest V3
- **Runtime/Package Manager**: Bun
- **Language**: TypeScript
- **UI**: Vanilla HTML/CSS/JS with modular component system
- **Storage**: Chrome Storage API (sync for cross-device, local for temporary data)
- **Build**: TypeScript compilation with WXT bundling

## Core Architecture

### 1. Background Service Worker (`entrypoints/background.ts`)
**Central coordinator handling browser events and configuration management**

**Key Responsibilities**:
- **Tab Event Monitoring**: Listens to `tabs.onUpdated` and `tabs.onActivated`
- **Configuration Sync**: Monitors `storage.onChanged` for real-time updates
- **URL Matching**: Evaluates current page against all configured rules
- **Icon Management**: Updates extension icon (colored/gray) based on match status
- **Message Routing**: Sends `MATCH_UPDATE` messages to content scripts

**Core Algorithm**:
```
Tab Event → Load Config → Parse URL → Match Rules → Update Icon → Notify Content Script
```

### 2. Content Script (`entrypoints/content.ts`)
**UI injection engine with Shadow DOM isolation**

**Key Features**:
- **Shadow DOM**: Prevents style conflicts with host pages
- **Message Handling**: Receives `MATCH_UPDATE` from background
- **Dynamic UI**: Creates/destroys banners and overlays on demand
- **Position System**: 4-corner banner positioning (leftTop, rightTop, leftBottom, rightBottom)
- **Overlay System**: Full-page background tinting with 5% opacity

**UI Components**:
- **Corner Banners**: Rotated ribbons with environment labels
- **Background Overlays**: Subtle full-page color tinting
- **Responsive Design**: Adapts to different screen sizes

### 3. Options Page (`entrypoints/options/`)
**Comprehensive configuration interface with manager pattern**

**Manager Architecture**:
- **AppController**: Main coordinator and configuration manager
- **SiteEditorManager**: Handles site rules and configuration groups
- **ConfigImportExportManager**: Manages JSON import/export functionality
- **BrowserSyncManager**: Handles cross-device synchronization

**Key Features**:
- **Configuration Groups**: Organize rules into logical groups
- **Real-time Preview**: Live preview of banner/overlay effects
- **Bulk Operations**: Import/export entire configurations or individual groups
- **Default Colors**: Predefined color palette with custom color support

### 4. Popup (`entrypoints/popup/`)
**Quick access interface**

**Features**:
- **Global Toggle**: Enable/disable extension
- **Quick Add**: Add current site with pre-filled domain
- **Options Access**: Direct link to configuration page

## Data Architecture

### Configuration Structure
```typescript
interface AppConfig {
  browserSync: boolean;           // Cross-device sync toggle
  defaultColors: string[];        // Color palette (10 predefined colors)
  settings: Setting[];            // Configuration groups
}

interface Setting {
  name: string;                   // Group name
  enable: boolean;                // Group enable/disable
  sites: SiteConfig[];            // Site rules
  defaults?: GroupDefaults;       // Group-level defaults
}

interface SiteConfig {
  enable: boolean;                // Rule enable/disable
  matchPattern: string;           // Matching strategy
  matchValue: string;             // Pattern value
  envName: string;                // Display label
  color: string;                  // Theme color
  backgroudEnable: boolean;       // Background overlay toggle
  Position: string;               // Banner position
  flagEnable: boolean;            // Banner toggle
}
```

### Storage Strategy
- **Primary Storage**: `chrome.storage.sync` for cross-device synchronization
- **Sync Key**: `appConfig` contains the complete configuration
- **Cloud Sync**: Optional enhanced sync with conflict resolution
- **Local Cache**: Temporary storage for performance optimization

## Component System

### Reusable Components (`components/`)

#### **SwitchComponent**
- **Purpose**: Standardized toggle switches
- **Features**: Storage persistence, change callbacks, fallback support
- **Storage**: Supports both local and sync storage

#### **PreviewComponent**
- **Purpose**: Real-time configuration preview
- **Features**: Live banner/overlay preview, color selection, position testing
- **Integration**: Used in both AddSiteModal and AddGroupModal

#### **AddSiteModal**
- **Purpose**: Site rule creation/editing
- **Features**: Pattern validation, preview integration, form persistence
- **Validation**: Real-time pattern testing and error feedback

#### **AddGroupModal**
- **Purpose**: Configuration group management
- **Features**: Group defaults, bulk configuration, preview integration

## Matching Engine (`utils/matcher.ts`)

### Supported Patterns

#### **Everything (Auto-Match)**
Intelligent pattern detection with multiple strategies:
- **Wildcard**: `*` matches all URLs
- **Exact URL**: Direct URL comparison
- **Domain**: Host matching with subdomain support
- **URL Prefix**: Prefix matching with protocol handling
- **Regex**: `/pattern/` format for advanced matching

#### **Domain**
- **Logic**: `host === value || host.endsWith('.' + value)`
- **Example**: `example.com` matches `example.com` and `app.example.com`

#### **URL Prefix**
- **Logic**: `url.startsWith(value)`
- **Example**: `https://github.com/enveil` matches repository paths

#### **Exact URL**
- **Logic**: `url === value`
- **Example**: `http://localhost:8080/admin` matches only that page

#### **Regex**
- **Logic**: `new RegExp(value).test(url)`
- **Example**: `^https?:\/\/.*\.test\.com` matches test.com subdomains

### Matching Priority
1. Check rule enable status
2. Iterate through configuration groups (order matters)
3. Iterate through site rules (order matters)
4. First match wins, stop processing

## Data Flow Architecture

### Configuration Update Flow
```
User Action → Manager → AppConfig Update → Storage Save → Background Listener → 
Tab Re-evaluation → Content Script Update → UI Refresh
```

### Page Load Flow
```
Tab Load → Background Detection → Config Retrieval → URL Parsing → 
Pattern Matching → Icon Update → Content Script Notification → UI Injection
```

### Sync Flow
```
Config Change → Storage Event → Background Sync → All Tabs Re-evaluation → 
Cross-device Propagation (if enabled)
```

## Security Architecture

### Permissions Model
- **storage**: Configuration persistence
- **tabs**: Tab information and icon updates
- **host_permissions**: `<all_urls>` for content script injection

### Isolation Strategy
- **Shadow DOM**: Complete style isolation for injected UI
- **Content Security Policy**: Prevents inline script execution
- **Input Validation**: Regex validation and sanitization
- **No Remote Code**: All logic bundled, no external dependencies

### Privacy Protection
- **Local Storage**: All data stored locally/synced via Chrome
- **No Tracking**: Zero analytics or data collection
- **No Network**: No external API calls or data transmission

## Build & Deployment Architecture

### WXT Configuration
```typescript
// wxt.config.ts
export default defineConfig({
  manifest: {
    name: "Enveil",
    version: "1.0.0",
    permissions: ["storage", "tabs"],
    // Automatic Manifest V3 generation
  }
});
```

### Build Pipeline
1. **TypeScript Compilation**: Source code compilation
2. **Asset Processing**: Icon generation and optimization
3. **Manifest Generation**: Automatic Manifest V3 creation
4. **Bundle Creation**: Extension packaging for Chrome/Firefox

### Development Workflow
- **Hot Reload**: Automatic extension reload during development
- **Source Maps**: Full debugging support
- **Multi-browser**: Chrome and Firefox support

## Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Components loaded on demand
- **Event Debouncing**: Reduced storage operations
- **Efficient Matching**: Early exit on first match
- **Shadow DOM**: Minimal DOM impact

### Memory Management
- **Component Cleanup**: Proper event listener removal
- **Storage Optimization**: Minimal data persistence
- **Background Efficiency**: Event-driven processing

## Extension Points

### Planned Enhancements
- **Shadow DOM**: Complete implementation for style isolation
- **Testing**: Unit and E2E test coverage
- **UI Polish**: Enhanced Options page UX
- **Storage Migration**: Robust schema update handling
- **Advanced Matching**: Conditional logic (AND/OR operations)

### Customization Points
- **Color Themes**: Extensible color system
- **Position System**: Additional banner positions
- **Pattern Types**: New matching strategies
- **Export Formats**: Additional configuration formats
