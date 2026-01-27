---
layout: default
title: API Reference
nav_order: 7
---

# API Reference

This document provides detailed technical reference for Enveil's internal APIs, data structures, and extension points.

## Data Structures

### Core Configuration Types

#### `AppConfig`
Main configuration object stored in `chrome.storage.sync`

```typescript
interface AppConfig {
  browserSync: boolean;           // Enable cross-device synchronization
  defaultColors: string[];        // Default color palette (10 colors)
  settings: Setting[];            // Configuration groups array
}
```

#### `Setting` (Configuration Group)
Represents a logical grouping of site rules

```typescript
interface Setting {
  name: string;                   // Group display name
  enable: boolean;                // Group enable/disable toggle
  sites: SiteConfig[];            // Array of site rules
  defaults?: GroupDefaults;       // Optional group-level defaults
}
```

#### `SiteConfig` (Site Rule)
Individual URL matching rule with visual configuration

```typescript
interface SiteConfig {
  enable: boolean;                // Rule enable/disable
  matchPattern: MatchPattern;     // Matching strategy
  matchValue: string;             // Pattern value to match
  envName: string;                // Environment display name
  color: string;                  // Hex color code
  backgroudEnable: boolean;       // Background overlay toggle
  Position: BannerPosition;       // Banner corner position
  flagEnable: boolean;            // Banner display toggle
}
```

#### `GroupDefaults`
Default settings applied to new sites in a group

```typescript
interface GroupDefaults {
  envName: string;                // Default environment name
  backgroundEnable: boolean;      // Default background overlay state
  flagEnable: boolean;            // Default banner state
  color: string;                  // Default color
}
```

### Enumeration Types

#### `MatchPattern`
URL matching strategies

```typescript
type MatchPattern = 
  | 'everything'    // Auto-detection with multiple strategies
  | 'domain'        // Hostname matching with subdomain support
  | 'urlPrefix'     // URL prefix matching
  | 'url'           // Exact URL matching
  | 'regex';        // Regular expression matching
```

#### `BannerPosition`
Corner positions for banner placement

```typescript
type BannerPosition = 
  | 'leftTop'       // Top-left corner
  | 'rightTop'      // Top-right corner
  | 'leftBottom'    // Bottom-left corner
  | 'rightBottom';  // Bottom-right corner
```

#### `NotificationType`
Notification message types

```typescript
type NotificationType = 
  | 'success'       // Green success messages
  | 'error'         // Red error messages
  | 'warning'       // Orange warning messages
  | 'info';         // Blue informational messages
```

### Sync Data Structures

#### `CloudSyncData`
Structure for cross-device synchronization

```typescript
interface CloudSyncData {
  configs: Setting[];             // Configuration groups
  defaultColors: string[];       // Color palette
  lastModified: number;           // Unix timestamp
  version: string;                // Schema version
}
```

#### `ConflictResolutionStrategy`
Sync conflict resolution options

```typescript
type ConflictResolutionStrategy = 
  | 'local'         // Keep local configuration
  | 'remote'        // Use remote configuration
  | 'merge'         // Attempt to merge (where possible)
  | 'ask';          // Prompt user for decision
```

## Core APIs

### Matcher API

#### `Matcher.isMatch(site, currentUrl, currentHost)`
Determines if a site configuration matches the current page

**Parameters:**
- `site: SiteConfig` - Site rule to test
- `currentUrl: string` - Full URL to match against
- `currentHost: string` - Hostname to match against

**Returns:** `boolean` - True if the rule matches

**Example:**
```typescript
import { Matcher } from '../utils/matcher';

const site: SiteConfig = {
  enable: true,
  matchPattern: 'domain',
  matchValue: 'localhost',
  envName: 'DEV',
  color: '#4a9eff',
  backgroudEnable: false,
  Position: 'rightTop',
  flagEnable: true
};

const isMatch = Matcher.isMatch(
  site, 
  'http://localhost:3000/app', 
  'localhost'
); // Returns: true
```

#### `Matcher.getMatchInfo(site)`
Returns formatted string describing the match rule

**Parameters:**
- `site: SiteConfig` - Site configuration

**Returns:** `string` - Formatted match description

### Component APIs

#### `SwitchComponent`
Reusable toggle switch component

**Constructor:**
```typescript
new SwitchComponent(
  container: HTMLElement,         // Parent container
  label: string,                  // Switch label text
  storageKey: string,             // Storage key for persistence
  storageType: 'local' | 'sync',  // Storage type
  initialValue: boolean,          // Initial state
  persist: boolean                // Enable persistence
)
```

**Methods:**
- `isChecked(): boolean` - Get current state
- `setChecked(value: boolean): void` - Set state
- `onChange(callback: (isChecked: boolean) => void): void` - Set change callback

#### `PreviewComponent`
Real-time configuration preview component

**Constructor:**
```typescript
new PreviewComponent(
  container: HTMLElement,
  config: PreviewConfig,
  defaultColors: string[],
  callbacks: PreviewCallbacks,
  options: PreviewOptions
)
```

**Methods:**
- `updateConfig(config: Partial<PreviewConfig>): void` - Update preview
- `getConfig(): PreviewConfig` - Get current configuration
- `destroy(): void` - Clean up component

### Manager APIs

#### `AppController`
Main application controller

**Methods:**
- `init(): Promise<void>` - Initialize application
- `loadConfig(): Promise<void>` - Load configuration from storage
- `saveConfig(): Promise<void>` - Save configuration to storage
- `updateConfig(newConfig: AppConfig): void` - Update configuration
- `showNotification(message: string, type: NotificationType): void` - Display notification

#### `SiteEditorManager`
Site rule and group management

**Methods:**
- `initSiteEditorUI(): void` - Initialize UI components
- `updateConfigDisplay(): void` - Refresh configuration display
- `addConfigGroup(): void` - Add new configuration group
- `editSite(groupIndex: number, siteIndex: number): void` - Edit site rule
- `deleteSite(groupIndex: number, siteIndex: number): void` - Delete site rule
- `exportGroup(groupIndex: number): void` - Export configuration group

#### `ConfigImportExportManager`
Configuration import/export functionality

**Methods:**
- `handleExport(): void` - Export full configuration
- `exportAllConfig(): void` - Export complete configuration
- `exportGroup(group: Setting): void` - Export single group
- `importConfig(event: Event): void` - Import configuration from file
- `validateConfig(config: any): boolean` - Validate configuration structure

#### `BrowserSyncManager`
Cross-device synchronization

**Methods:**
- `initSync(): Promise<void>` - Initialize synchronization
- `performSync(): Promise<void>` - Execute sync operation
- `enableSync(): Promise<void>` - Enable synchronization
- `disableSync(): Promise<void>` - Disable synchronization
- `resolveConflicts(local: CloudSyncData, remote: CloudSyncData): Promise<ConflictResolutionStrategy>` - Handle conflicts

## Extension APIs

### Background Script API

#### Message Types
Messages sent between background and content scripts

```typescript
// Background → Content Script
interface MatchUpdateMessage {
  action: 'MATCH_UPDATE';
  site: SiteConfig | null;        // Matched site or null
}
```

#### Storage Keys
Chrome storage keys used by the extension

```typescript
const STORAGE_KEYS = {
  APP_CONFIG: 'appConfig',                    // Main configuration
  CLOUD_SYNC: 'enveil_cloud_sync_data',      // Sync data
  BROWSER_SYNC: 'browserSync'                // Sync toggle
} as const;
```

### Content Script API

#### UI Creation Functions

```typescript
// Create corner banner element
function createBanner(site: SiteConfig): HTMLElement

// Create background overlay element  
function createOverlay(site: SiteConfig): HTMLElement

// Mount UI elements in Shadow DOM
function mountUI(site: SiteConfig): void

// Remove all UI elements
function unmountUI(): void
```

#### Shadow DOM Structure
```html
<div id="enveil-host">
  #shadow-root
    <div class="banner-container">
      <div class="banner-ribbon">ENV_NAME</div>
    </div>
    <div class="background-overlay"></div>
</div>
```

## Storage API

### Configuration Storage

#### Save Configuration
```typescript
// Save to Chrome sync storage
await chrome.storage.sync.set({ appConfig: config });

// Save to local storage (fallback)
await chrome.storage.local.set({ appConfig: config });
```

#### Load Configuration
```typescript
// Load from Chrome sync storage
const result = await chrome.storage.sync.get(['appConfig']);
const config: AppConfig = result.appConfig;
```

#### Listen for Changes
```typescript
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.appConfig) {
    const newConfig = changes.appConfig.newValue;
    // Handle configuration update
  }
});
```

## Event System

### Browser Events

#### Tab Events
```typescript
// Tab updated (page load, URL change)
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if ((changeInfo.status === 'complete' || changeInfo.url) && tab.url) {
    checkAndNotifyTab(tabId, tab.url);
  }
});

// Tab activated (switched to)
browser.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await browser.tabs.get(activeInfo.tabId);
  if (tab.url) {
    checkAndNotifyTab(tab.id!, tab.url);
  }
});
```

#### Storage Events
```typescript
// Configuration changed
browser.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'sync' && changes.appConfig) {
    // Re-evaluate all tabs
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url) {
        await checkAndNotifyTab(tab.id, tab.url);
      }
    }
  }
});
```

## Utility Functions

### Color Utilities
```typescript
// Validate hex color format
function isValidHexColor(color: string): boolean

// Generate contrasting text color
function getContrastColor(backgroundColor: string): string

// Convert color formats
function hexToRgb(hex: string): { r: number, g: number, b: number }
```

### URL Utilities
```typescript
// Extract hostname from URL
function getHostFromUrl(url: string): string

// Validate URL format
function isValidUrl(url: string): boolean

// Parse URL components
function parseUrl(url: string): URL
```

### Validation Utilities
```typescript
// Validate regex pattern
function isValidRegex(pattern: string): boolean

// Validate configuration structure
function validateAppConfig(config: any): config is AppConfig

// Validate site configuration
function validateSiteConfig(site: any): site is SiteConfig
```

## Error Handling

### Error Types
```typescript
class EnveilError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'EnveilError';
  }
}

// Specific error types
class ConfigurationError extends EnveilError {}
class MatchingError extends EnveilError {}
class StorageError extends EnveilError {}
class SyncError extends EnveilError {}
```

### Error Codes
```typescript
const ERROR_CODES = {
  INVALID_CONFIG: 'INVALID_CONFIG',
  STORAGE_FAILED: 'STORAGE_FAILED',
  SYNC_FAILED: 'SYNC_FAILED',
  INVALID_REGEX: 'INVALID_REGEX',
  IMPORT_FAILED: 'IMPORT_FAILED'
} as const;
```

## Extension Points

### Custom Matchers
Extend matching functionality by implementing the `Matcher` interface:

```typescript
interface CustomMatcher {
  isMatch(site: SiteConfig, url: string, host: string): boolean;
  getMatchInfo(site: SiteConfig): string;
}
```

### Custom Components
Create reusable UI components following the component pattern:

```typescript
interface Component {
  render(): void;
  destroy(): void;
  update(data: any): void;
}
```

### Plugin Architecture (Planned)
Future plugin system for extending functionality:

```typescript
interface EnveilPlugin {
  name: string;
  version: string;
  init(api: EnveilAPI): void;
  destroy(): void;
}
```

This API reference provides the foundation for understanding and extending Enveil's functionality. All APIs are designed to be stable and backward-compatible within major versions.