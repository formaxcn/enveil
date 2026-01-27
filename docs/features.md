---
layout: default
title: Features
nav_order: 2
---

# Features Overview

Enveil provides comprehensive environment identification through visual indicators and intelligent URL matching. Here's a complete overview of all features available in the extension.

## Core Features

### 🎯 Intelligent URL Matching
**Five sophisticated matching strategies for maximum flexibility**

- **Everything (Auto-Match)**: Intelligent pattern detection with multiple fallback strategies
- **Domain Matching**: Hostname-based with subdomain support
- **URL Prefix**: Path-based matching for specific sections
- **Exact URL**: Precise page targeting
- **Regex**: Advanced pattern matching with JavaScript RegExp

### 🎨 Visual Indicators
**Multiple ways to identify environments visually**

#### Corner Banners
- **4 Positions**: Top-left, top-right, bottom-left, bottom-right
- **Customizable**: Colors, text, and positioning
- **Rotated Design**: 45-degree angled ribbons for visibility
- **Shadow DOM**: Isolated from page styles to prevent conflicts

#### Background Overlays
- **Subtle Tinting**: 5% opacity full-page color overlay
- **Non-intrusive**: Doesn't interfere with page functionality
- **Configurable**: Enable/disable per rule
- **Perfect for Production**: Subtle warning for dangerous environments

### 📁 Configuration Groups
**Organize rules logically for better management**

- **Hierarchical Structure**: Groups contain multiple site rules
- **Group Defaults**: Set default colors, positions, and settings
- **Bulk Operations**: Enable/disable entire groups at once
- **Export Individual Groups**: Share specific project configurations

### 🎨 Advanced Color System
**Comprehensive color management**

#### Default Palette
10 predefined colors optimized for different environments:
- Blue (`#4a9eff`) - Development
- Green (`#4CAF50`) - Staging  
- Orange (`#ff9800`) - Testing
- Red (`#f44336`) - Production
- Purple, Cyan, Yellow, Brown, Blue Grey, Pink

#### Custom Colors
- **Color Picker**: Full spectrum selection
- **Hex Input**: Direct color code entry
- **Unlimited Colors**: No restrictions on color count
- **Contrast Optimization**: Automatic text color selection

## Management Features

### 📤 Import/Export System
**Flexible configuration sharing and backup**

#### Export Options
- **Full Configuration**: Complete setup with all groups (`enveil.json`)
- **Individual Groups**: Single group export (`enveil.group.json`)
- **Automatic Naming**: Intelligent filename generation

#### Import Options
- **Full Import**: Replace entire configuration (with confirmation)
- **Group Import**: Add groups to existing configuration
- **Conflict Resolution**: Automatic handling of duplicate group names
- **Validation**: Complete configuration integrity checking

### 🔄 Browser Synchronization
**Cross-device configuration synchronization**

#### Sync Features
- **Real-time Updates**: Changes propagate immediately across devices
- **Chrome Storage Sync**: Built on Chrome's native sync infrastructure
- **Conflict Detection**: Intelligent handling of simultaneous edits
- **Version Control**: Timestamp-based conflict resolution

#### Conflict Resolution
- **Automatic Detection**: Identifies configuration conflicts
- **User Choice**: Options to keep local, use remote, or merge
- **Backup Creation**: Automatic backup before applying changes
- **5-minute Threshold**: Smart conflict detection timing

### ⚙️ Advanced Configuration
**Power user features for complex setups**

#### URL Parameters
Quick actions via URL parameters:
```
?action=addSite&domain=example.com&pattern=domain
```

#### Configuration Migration
- **Automatic Detection**: Identifies old configuration formats
- **Safe Migration**: Creates backups before updating
- **Schema Validation**: Ensures data integrity

## User Interface Features

### 🖥️ Options Page
**Comprehensive configuration interface**

#### Layout
- **Split Panel**: 30% left panel for global settings, 70% right for configurations
- **Responsive Design**: Minimum 1200px width for optimal experience
- **Dark/Light Theme**: Automatic theme detection and support

#### Components
- **Real-time Preview**: Live preview of banners and overlays
- **Form Validation**: Real-time validation with error feedback
- **Modal Dialogs**: Intuitive add/edit interfaces
- **Drag & Drop**: Reorder rules and groups (planned)

### 🔧 Popup Interface
**Quick access and control**

- **Global Toggle**: Enable/disable extension instantly
- **Current Site Status**: Shows if current page matches any rules
- **Quick Add**: Add current site with pre-filled domain
- **Options Access**: Direct link to full configuration

### 🎛️ Component System
**Reusable UI components for consistency**

#### Switch Components
- **Standardized Toggles**: Consistent on/off switches
- **Storage Integration**: Automatic persistence
- **Change Callbacks**: Real-time update handling

#### Preview Components
- **Live Preview**: Real-time banner and overlay preview
- **Interactive**: Click to test different positions and colors
- **Integrated**: Used in all configuration dialogs

## Technical Features

### 🔒 Security & Privacy
**Privacy-first design with robust security**

#### Data Privacy
- **Local Storage**: All data stored locally or synced via Chrome
- **No Tracking**: Zero analytics or data collection
- **No External Calls**: No network requests to external services

#### Security Measures
- **Shadow DOM**: Complete style isolation for injected UI
- **Input Validation**: Comprehensive validation of all user inputs
- **CSP Protection**: Content Security Policy prevents code injection
- **Minimal Permissions**: Only requests necessary browser permissions

### ⚡ Performance Optimization
**Efficient operation with minimal impact**

#### Matching Optimization
- **First Match Wins**: Stops processing after first successful match
- **Rule Ordering**: Processes rules in order for optimal performance
- **Lazy Loading**: Components loaded only when needed

#### Memory Management
- **Event Cleanup**: Proper removal of event listeners
- **Minimal Storage**: Efficient data structure design
- **Background Efficiency**: Event-driven processing only

### 🛠️ Development Features
**Built for developers, by developers**

#### WXT Framework
- **Modern Tooling**: Built with WXT (Web Extension Tools)
- **TypeScript**: Full type safety and IntelliSense support
- **Hot Reload**: Automatic extension reload during development
- **Multi-browser**: Chrome and Firefox support

#### Build System
- **Automatic Manifest**: Generates Manifest V3 automatically
- **Asset Optimization**: Icon processing and optimization
- **Source Maps**: Full debugging support in development

## Integration Features

### 🌐 Browser Integration
**Seamless browser experience**

#### Extension Icon
- **Dynamic Icons**: Colored when matching, gray when not
- **Per-tab Icons**: Different icon states per browser tab
- **Visual Feedback**: Instant visual confirmation of rule matching

#### Content Script Integration
- **Universal Injection**: Works on all websites (`<all_urls>`)
- **Non-intrusive**: Doesn't affect page functionality
- **Real-time Updates**: Updates immediately when configuration changes

### 📱 Cross-platform Support
**Works across different environments**

#### Browser Support
- **Chrome**: Full feature support (primary target)
- **Firefox**: Compatible build available
- **Manifest V3**: Future-proof extension format

#### Operating System
- **Windows**: Full compatibility
- **macOS**: Native support
- **Linux**: Complete functionality

## Planned Features

### 🚀 Upcoming Enhancements
**Features in development or planned**

#### Shadow DOM Complete
- **Full Isolation**: Complete style isolation implementation
- **Performance**: Optimized rendering performance
- **Compatibility**: Enhanced compatibility with complex sites

#### Testing Suite
- **Unit Tests**: Comprehensive test coverage
- **E2E Tests**: End-to-end functionality testing
- **Pattern Testing**: Built-in regex and pattern testing tools

#### UI Enhancements
- **Drag & Drop**: Reorder rules and groups
- **Rule Templates**: Pre-built rule templates for common scenarios
- **Bulk Edit**: Edit multiple rules simultaneously
- **Advanced Search**: Search and filter rules

#### Advanced Matching
- **Conditional Logic**: AND/OR operations for complex rules
- **Time-based Rules**: Rules active only during certain times
- **User Agent Matching**: Match based on browser or device type
- **Cookie-based Rules**: Match based on cookie presence/values

## Feature Comparison

| Feature | Basic Use | Advanced Use | Power User |
|---------|-----------|--------------|------------|
| URL Matching | Domain, URL | Regex, Prefix | Everything (Auto) |
| Visual Indicators | Corner Banners | + Background Overlay | + Custom Positions |
| Configuration | Single Rules | Groups | + Defaults, Sync |
| Management | Manual Setup | Import/Export | + Browser Sync |
| Customization | Basic Colors | Custom Colors | + Unlimited Palette |

## Getting the Most from Enveil

### Best Practices
1. **Start Simple**: Begin with domain matching for basic needs
2. **Organize Logically**: Use groups to separate different projects or teams
3. **Color Code Consistently**: Use the same colors for similar environments across projects
4. **Test Patterns**: Use the preview feature to test complex regex patterns
5. **Export Regularly**: Create backups of your configuration

### Common Use Cases
- **Development Teams**: Separate dev/staging/prod environments
- **QA Testing**: Identify different testing environments
- **Client Work**: Distinguish between different client projects
- **API Development**: Identify different API versions or endpoints
- **Multi-tenant Applications**: Distinguish between different tenants or instances

Enveil is designed to grow with your needs, from simple domain matching to complex multi-environment setups with advanced synchronization and management features.