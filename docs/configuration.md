---
layout: default
title: Configuration
nav_order: 3
---

# Configuration Guide

Enveil uses a hierarchical configuration system with support for both traditional **Site Configurations** and **Cloud Environments**. This guide covers both configuration types in detail.

## Configuration Structure

### Dual-Tab Interface

The Options page is organized into two main tabs:

1. **Site Configurations**: Traditional URL-based environment identification
2. **Cloud Environments**: Cloud provider account and role highlighting

![Cloud Portal](./assets/images/clouds-portal.png)
*Configuration interface with Site and Cloud Environment tabs*

---

## Site Configuration

### Configuration Groups
Each group contains:
- **Group Name**: Logical identifier (e.g., "Production Sites")
- **Enable/Disable**: Toggle entire group on/off
- **Site Rules**: List of URL matching rules
- **Group Defaults**: Default settings for new sites in this group

![Site Portal Group](./assets/images/sites-portal-group.png)
*Site configuration groups with multiple environment rules*

### Site Rules
Each site rule defines:

| Field | Description | Type | Example |
|-------|-------------|------|---------|
| **Enable** | Toggle this specific rule on/off | Boolean | ✓ |
| **Match Pattern** | How to match the current page | Enum | `domain` |
| **Match Value** | The string/regex to match against | String | `localhost` |
| **Environment Name** | Text to display in banner | String | `DEV` |
| **Color** | Background color of indicator | Hex/RGB | `#4a9eff` |
| **Position** | Banner corner placement | Enum | `rightTop` |
| **Banner Enable** | Show corner ribbon/banner | Boolean | ✓ |
| **Background Enable** | Show full-page overlay | Boolean | ✗ |

## Match Patterns

Enveil supports five sophisticated matching strategies:

### 1. Everything (Auto-Match) - `everything`
**Intelligent pattern detection with multiple fallback strategies**

The system automatically detects the best matching approach:

- **Wildcard**: `*` matches all URLs
- **Exact URL**: Direct comparison with current URL
- **Domain Match**: Hostname matching with subdomain support
- **URL Prefix**: Prefix matching with intelligent protocol handling
- **Regex Detection**: Patterns wrapped in `/pattern/` format

**Examples**:
```
*                           → Matches everything
localhost                   → Matches localhost and *.localhost
https://api.example.com     → Matches URL prefix
/^https?:\/\/.*\.dev$/      → Regex for .dev domains
```

### 2. Domain - `domain`
**Hostname-based matching with subdomain support**

- **Logic**: `host === value || host.endsWith('.' + value)`
- **Use Case**: Match entire domains and their subdomains

**Examples**:
```
example.com     → Matches example.com, app.example.com, api.example.com
localhost       → Matches localhost only
staging.app.io  → Matches staging.app.io only
```

### 3. URL Prefix - `urlPrefix`
**Path-based matching for specific sections**

- **Logic**: `url.startsWith(value)`
- **Use Case**: Target specific paths or API endpoints

**Examples**:
```
https://github.com/enveil          → Matches repository and sub-paths
http://localhost:3000/admin        → Matches admin section
https://api.example.com/v1         → Matches API v1 endpoints
```

### 4. Exact URL - `url`
**Precise URL matching**

- **Logic**: `url === value`
- **Use Case**: Target specific pages exactly

**Examples**:
```
http://localhost:8080/admin        → Only admin page
https://app.example.com/dashboard  → Only dashboard page
```

### 5. Regex - `regex`
**Advanced pattern matching with JavaScript RegExp**

- **Logic**: `new RegExp(value).test(url)`
- **Use Case**: Complex matching scenarios

**Examples**:
```
^https?:\/\/.*\.test\.com          → All test.com subdomains
localhost:\d+                      → Localhost with any port
\/admin|\/dashboard                → Admin or dashboard paths
```

## Visual Indicators

### Corner Banners
**Rotated ribbons in page corners**

**Positions**:
- `leftTop`: Top Left Corner (45° rotation)
- `rightTop`: Top Right Corner (-45° rotation)  
- `leftBottom`: Bottom Left Corner (-45° rotation)
- `rightBottom`: Bottom Right Corner (45° rotation)

**Styling**:
- **Size**: 150x150px container with 220px ribbon
- **Typography**: Bold, uppercase, 13px font
- **Shadow**: Drop shadow for visibility
- **Colors**: Configurable background with white text

### Background Overlays
**Full-page color tinting**

When `Background Enable` is checked:
- **Opacity**: 5% (0.05) for subtle effect
- **Coverage**: Full viewport (100vw × 100vh)
- **Z-index**: Below banners but above page content
- **Use Case**: Dangerous environments (Production) warning

---

## Cloud Environment Configuration

### Overview

Cloud Environment configuration allows you to visually distinguish between different cloud provider accounts and roles. Currently supported providers:

- **AWS China**: `*.amazonaws.cn` domains
- **AWS Global**: `*.aws.amazon.com` domains
- **Custom**: User-defined providers

![Cloud Environment Configuration](./assets/images/clouds-env-config.png)
*Cloud environment configuration with provider selection*

### Cloud Environment Structure

```
Cloud Environment
├── Provider: AWS China / AWS Global / Custom
├── Name: "Production AWS"
├── Enable/Disable: Toggle
└── Accounts: List of cloud accounts
    ├── Account 1: "prod-main"
    │   ├── Background Color: #f44336 (Red)
    │   ├── Account Patterns: URL matching patterns
    │   └── Roles: Keyword highlighting rules
    └── Account 2: "dev-sandbox"
        ├── Background Color: #4a9eff (Blue)
        ├── Account Patterns: URL matching patterns
        └── Roles: Keyword highlighting rules
```

### Cloud Account Configuration

Each cloud account defines:

| Field | Description | Example |
|-------|-------------|---------|
| **Name** | Account identifier | `prod-main` |
| **Enable** | Toggle account highlighting | ✓ |
| **Background Enable** | Show background overlay | ✓ |
| **Background Color** | Account highlight color | `#f44336` |
| **Account Patterns** | URL patterns to match account | `domain: 123456789012` |
| **Roles** | Role keyword highlighting rules | `Admin`, `ReadOnly` |

### Account Patterns

Account patterns use the same matching strategies as site configurations:

- **Domain**: Match account by account ID in domain
- **URL Prefix**: Match by URL path
- **Regex**: Complex pattern matching
- **Everything**: Auto-detection

**AWS Account Pattern Examples**:
```
# Match by account ID (12 digits)
Pattern: domain
Value: 123456789012

# Match by account name in URL
Pattern: urlPrefix
Value: https://123456789012.signin.aws.amazon.com

# Match multiple accounts with regex
Pattern: regex
Value: (123456789012|987654321098)
```

### Role Highlighting

Roles define keywords to highlight within cloud pages:

| Field | Description | Example |
|-------|-------------|---------|
| **Enable** | Toggle role highlighting | ✓ |
| **Match Pattern** | Matching strategy | `contains` or `regex` |
| **Match Value** | Keyword to highlight | `Administrator` |

**Role Configuration Examples**:
```
# Highlight Administrator roles
Match Pattern: contains
Match Value: Administrator

# Highlight multiple role patterns
Match Pattern: regex
Match Value: (Admin|PowerUser|FullAccess)

# Highlight specific role names
Match Pattern: contains
Match Value: ReadOnlyAccess
```

### Visual Effects

#### Account Background Highlighting
- **Opacity**: 25% (0.25) with border
- **Border**: 2px solid with glow effect
- **Coverage**: Account containers on selection pages
- **Transition**: Smooth 0.3s ease animation

#### Role Text Highlighting
- **Background**: Yellow (`#ffeb3b`)
- **Text Color**: Black (`#000000`)
- **Font Weight**: Bold
- **Padding**: 1px 3px
- **Border Radius**: 2px

![AWS Account Selection Page](./assets/images/clouds-example-aws.png)
*AWS account selection page with account highlighting and role keyword emphasis*

### Cloud Provider Templates

#### AWS China Template
```typescript
{
  provider: 'aws-cn',
  accountSelectionUrl: 'https://signin.amazonaws.cn/saml',
  consoleDomainPattern: '*://*.amazonaws.cn/*',
  selectors: {
    accountSelection: {
      accountContainers: ['fieldset > div.saml-account:has(> .expandable-container .saml-account-name)'],
      roleElements: ['.saml-role-name', '.saml-role-description', 'label.saml-role']
    },
    console: {
      accountContainers: ['#nav-usernav-popover', '.awsc-username-display'],
      roleElements: ['.awsc-username-display .awsc-username', '.awsc-role-display-name']
    }
  }
}
```

#### AWS Global Template
```typescript
{
  provider: 'aws-global',
  accountSelectionUrl: 'https://signin.aws.amazon.com/saml',
  consoleDomainPattern: '*://*.aws.amazon.com/*',
  // Same selectors as AWS China
}
```

---

## Configuration Groups

### Group Management
- **Create Groups**: Organize rules by project, environment type, or team
- **Group Defaults**: Set default colors, positions, and settings for new sites
- **Bulk Operations**: Enable/disable entire groups
- **Export Groups**: Export individual groups as JSON

### Group Defaults
Each group can define defaults for new sites:
```typescript
{
  envName: "PROD",           // Default environment name
  backgroundEnable: true,    // Enable background overlay
  flagEnable: true,          // Enable corner banner
  color: "#f44336"          // Default red for production
}
```

---

## Color System

### Default Color Palette
Enveil includes 10 predefined colors:
- `#4a9eff` - Blue (Development)
- `#4CAF50` - Green (Staging)
- `#ff9800` - Orange (Testing)
- `#f44336` - Red (Production)
- `#9c27b0` - Purple
- `#00bcd4` - Cyan
- `#ffeb3b` - Yellow
- `#795548` - Brown
- `#607d8b` - Blue Grey
- `#e91e63` - Pink

### Custom Colors
- **Color Picker**: Full spectrum color selection
- **Hex Input**: Direct hex code entry
- **Validation**: Automatic color format validation

---

## Import/Export System

### Export Options

#### **Full Configuration Export**
- **Filename**: `enveil-config-YYYY-MM-DD.json`
- **Contents**: Complete configuration including all groups and cloud environments
- **Use Case**: Backup, sharing complete setups

#### **Individual Group Export**
- **Filename**: `enveil-group-{name}.json`
- **Contents**: Single configuration group with its sites
- **Use Case**: Sharing specific project configurations

#### **Cloud Environment Export**
- **Filename**: `enveil-cloud-{name}.json`
- **Contents**: Single cloud environment with accounts and roles
- **Use Case**: Sharing cloud provider configurations

### Import Options

#### **Full Configuration Import**
- **Behavior**: Replaces entire configuration
- **Confirmation**: Warns about overwriting existing data
- **Validation**: Checks configuration structure and compatibility

#### **Group Import**
- **Behavior**: Adds groups to existing configuration
- **Conflict Handling**: Renames if group name exists
- **Validation**: Ensures group structure integrity

#### **Cloud Import**
- **Behavior**: Adds cloud environments to existing configuration
- **Conflict Handling**: Renames if environment name exists
- **Validation**: Ensures cloud configuration integrity

### Configuration Validation
The system validates:
- **Required Fields**: Ensures all mandatory fields are present
- **Data Types**: Validates field types and formats
- **Pattern Validity**: Tests regex patterns for syntax errors
- **Color Formats**: Validates hex color codes
- **Version Compatibility**: Checks for schema version compatibility

---

## Browser Synchronization

### Sync Features
- **Cross-Device**: Synchronize configurations across Chrome instances
- **Real-time Updates**: Changes propagate immediately
- **Conflict Resolution**: Handles simultaneous edits gracefully

### Conflict Resolution
When conflicts occur:
1. **Version Check**: Compare configuration versions
2. **Timestamp Comparison**: Use modification times
3. **User Choice**: Present options for resolution:
   - Keep Local
   - Use Remote
   - Merge (where possible)

### Sync Data Structure
```typescript
interface CloudSyncData {
  configs: Setting[];              // Configuration groups
  cloudEnvironments: CloudEnvironment[];  // Cloud environments
  defaultColors: string[];         // Color palette
  lastModified: number;            // Timestamp
  version: string;                 // Schema version
}
```

---

## Advanced Configuration

### URL Parameters
The Options page supports URL parameters for quick actions:
```
chrome-extension://[id]/options.html?action=addSite&domain=example.com&pattern=domain
```

### Configuration Migration
- **Automatic**: Detects old configuration formats
- **Backup**: Creates backup before migration
- **Validation**: Ensures data integrity during migration

### Performance Optimization
- **Rule Ordering**: First match wins, order rules by frequency
- **Group Organization**: Disable unused groups for better performance
- **Pattern Efficiency**: Use specific patterns over broad regex when possible

---

## Best Practices

### Rule Organization
1. **Group by Purpose**: Separate work, personal, and testing environments
2. **Specific to General**: Order rules from most specific to most general
3. **Color Coding**: Use consistent colors for similar environments
4. **Descriptive Names**: Use clear environment names (DEV, STAGING, PROD)

### Cloud Configuration
1. **Use Templates**: Start with built-in templates for quick setup
2. **Account Patterns**: Use account IDs for precise matching
3. **Role Keywords**: Use specific keywords (e.g., "Administrator" not "Admin")
4. **Color Safety**: Use red/orange for production accounts as warning
5. **Test First**: Verify highlighting on account selection pages

### Pattern Selection
1. **Domain**: Best for entire sites and subdomains
2. **URL Prefix**: Ideal for specific sections or API endpoints
3. **Exact URL**: Use for single-page applications
4. **Regex**: Reserve for complex scenarios
5. **Everything**: Good for catch-all rules with intelligent detection

### Performance Tips
1. **Disable Unused**: Turn off rules and groups you don't need
2. **Order Matters**: Put frequently matched rules first
3. **Avoid Complex Regex**: Use simpler patterns when possible
4. **Group Efficiently**: Organize related rules together
