---
layout: default
title: Basic Configuration
parent: User Guide
nav_order: 1
---

# Basic Configuration

This guide covers the fundamental concepts and setup procedures for Enveil's environment identification system.

## Configuration Hierarchy

Enveil uses a two-level hierarchy to organize your environment rules:

```
Configuration Groups
├── Group 1: "Development Environments"
│   ├── Site Rule: localhost → DEV (Blue)
│   ├── Site Rule: *.dev → DEV (Blue)
│   └── Site Rule: dev.company.com → DEV (Blue)
├── Group 2: "Production Environments"
│   ├── Site Rule: company.com → PROD (Red + Background)
│   └── Site Rule: app.company.com → PROD (Red + Background)
└── Group 3: "Testing Environments"
    ├── Site Rule: test.company.com → TEST (Yellow)
    └── Site Rule: uat.company.com → UAT (Orange)
```

## Configuration Groups

### Creating Groups

1. **Click "Add Group"** in the main interface
2. **Configure Group Settings**:
   - **Name**: Descriptive identifier (e.g., "Production Sites")
   - **Enable**: Toggle to activate/deactivate entire group
   - **Default Settings**: Applied to new sites in this group

### Group Default Settings

Group defaults streamline adding multiple similar sites:

```typescript
{
  envName: "PROD",           // Default environment name
  backgroundEnable: true,    // Enable background overlay
  flagEnable: true,          // Enable corner banner
  color: "#f44336"          // Default red for production
}
```

**Benefits**:
- **Consistency**: All sites in group share common settings
- **Efficiency**: Faster configuration for multiple similar sites
- **Maintenance**: Change defaults to update multiple sites

### Group Management

| Action | Description | Use Case |
|--------|-------------|----------|
| **Enable/Disable** | Toggle entire group | Temporarily disable project environments |
| **Edit** | Modify group name and defaults | Update team standards |
| **Delete** | Remove group and all sites | Clean up obsolete projects |
| **Export** | Save group as JSON file | Share project configurations |

## Site Rules

### Basic Site Configuration

Each site rule defines how to identify and display an environment:

| Field | Description | Example |
|-------|-------------|---------|
| **Enable** | Toggle this specific rule | ✓ |
| **Match Pattern** | How to match URLs | `domain` |
| **Match Value** | What to match against | `localhost` |
| **Environment Name** | Display text | `DEV` |
| **Color** | Visual theme color | `#4a9eff` |
| **Position** | Banner corner | `rightTop` |
| **Banner Enable** | Show corner ribbon | ✓ |
| **Background Enable** | Show page overlay | ✗ |

### Match Patterns Explained

#### 1. Domain Matching (`domain`)
**Best for**: Entire websites and their subdomains

```
Pattern: domain
Value: example.com

Matches:
✓ example.com
✓ www.example.com
✓ app.example.com
✓ api.example.com
✗ example.org
✗ notexample.com
```

**Use Cases**:
- Company websites: `company.com`
- Development domains: `localhost`
- Staging environments: `staging.company.com`

#### 2. URL Prefix Matching (`urlPrefix`)
**Best for**: Specific paths or API endpoints

```
Pattern: urlPrefix
Value: https://api.example.com/v1

Matches:
✓ https://api.example.com/v1
✓ https://api.example.com/v1/users
✓ https://api.example.com/v1/data/reports
✗ https://api.example.com/v2
✗ http://api.example.com/v1 (different protocol)
```

**Use Cases**:
- API versions: `https://api.company.com/v1`
- Admin sections: `https://app.company.com/admin`
- Specific applications: `https://company.com/dashboard`

#### 3. Exact URL Matching (`url`)
**Best for**: Single specific pages

```
Pattern: url
Value: http://localhost:8080/admin

Matches:
✓ http://localhost:8080/admin
✗ http://localhost:8080/admin/users
✗ https://localhost:8080/admin
✗ http://localhost:3000/admin
```

**Use Cases**:
- Login pages: `https://company.com/login`
- Specific admin panels: `http://localhost:8080/admin`
- Landing pages: `https://company.com/welcome`

#### 4. Regular Expression (`regex`)
**Best for**: Complex pattern matching

```
Pattern: regex
Value: ^https?:\/\/.*\.test\.com

Matches:
✓ https://app.test.com
✓ http://api.test.com
✓ https://staging.test.com
✗ https://test.com (no subdomain)
✗ https://app.test.org (different TLD)
```

**Common Regex Patterns**:
- Any subdomain: `^https?:\/\/.*\.example\.com`
- Localhost with any port: `^http:\/\/localhost:\d+`
- Multiple domains: `^https?:\/\/(app|api|admin)\.example\.com`

#### 5. Everything (Auto-Detection) (`everything`)
**Best for**: Intelligent pattern recognition

The system automatically detects the best matching approach:

```
Value: *                    → Matches all URLs
Value: localhost            → Domain matching
Value: https://api.com      → URL prefix matching
Value: /^https?:\/\/.*\.dev$/ → Regex matching
```

## Visual Indicators

### Corner Banners

Corner banners are rotated ribbons that appear in page corners:

#### Positions
- **`leftTop`**: Top-left corner (45° rotation)
- **`rightTop`**: Top-right corner (-45° rotation)
- **`leftBottom`**: Bottom-left corner (-45° rotation)
- **`rightBottom`**: Bottom-right corner (45° rotation)

#### Styling
- **Size**: 150x150px container with 220px ribbon
- **Typography**: Bold, uppercase, 13px font
- **Shadow**: Drop shadow for visibility
- **Colors**: Configurable background with white text

### Background Overlays

Background overlays provide subtle full-page color tinting:

- **Opacity**: 5% (0.05) for non-intrusive effect
- **Coverage**: Full viewport (100vw × 100vh)
- **Z-index**: Below banners but above page content
- **Use Case**: Production environment warnings

## Color Management

### Default Color Palette

Enveil includes 10 predefined colors optimized for different environments:

| Color | Hex Code | Typical Use |
|-------|----------|-------------|
| Blue | `#4a9eff` | Development |
| Green | `#4CAF50` | Staging |
| Orange | `#ff9800` | Testing |
| Red | `#f44336` | Production |
| Purple | `#9c27b0` | Special environments |
| Cyan | `#00bcd4` | Integration |
| Yellow | `#ffeb3b` | Warning environments |
| Brown | `#795548` | Legacy systems |
| Blue Grey | `#607d8b` | Neutral environments |
| Pink | `#e91e63` | Experimental |

### Custom Colors

1. **Click any color circle** in the left sidebar
2. **Use color picker** to select custom color
3. **Enter hex codes** directly
4. **Add new colors** with the `+` button

### Color Best Practices

1. **Consistent Meaning**: Use same colors for similar environments across projects
2. **High Contrast**: Ensure banners are visible on all backgrounds
3. **Team Standards**: Establish color conventions with your team
4. **Accessibility**: Consider color-blind users when choosing colors

## Configuration Examples

### Simple Development Setup

```json
{
  "name": "Local Development",
  "sites": [
    {
      "matchPattern": "domain",
      "matchValue": "localhost",
      "envName": "DEV",
      "color": "#4a9eff",
      "Position": "rightTop",
      "flagEnable": true,
      "backgroudEnable": false
    }
  ]
}
```

### Multi-Environment Project

```json
{
  "name": "Company Project",
  "sites": [
    {
      "matchPattern": "domain",
      "matchValue": "dev.company.com",
      "envName": "DEV",
      "color": "#4a9eff"
    },
    {
      "matchPattern": "domain", 
      "matchValue": "staging.company.com",
      "envName": "STAGING",
      "color": "#ff9800"
    },
    {
      "matchPattern": "domain",
      "matchValue": "company.com",
      "envName": "PROD",
      "color": "#f44336",
      "backgroudEnable": true
    }
  ]
}
```

### API Environment Distinction

```json
{
  "name": "API Environments",
  "sites": [
    {
      "matchPattern": "urlPrefix",
      "matchValue": "https://api.company.com/v1",
      "envName": "API-V1",
      "color": "#4a9eff"
    },
    {
      "matchPattern": "urlPrefix",
      "matchValue": "https://api.company.com/v2",
      "envName": "API-V2", 
      "color": "#4CAF50"
    }
  ]
}
```

## Testing Your Configuration

### Verification Steps

1. **Save Configuration**: Ensure all changes are saved
2. **Open Test URLs**: Visit configured domains in new tabs
3. **Check Visual Indicators**: Verify banners and overlays appear
4. **Test Edge Cases**: Try subdomains, different paths
5. **Verify Exclusions**: Confirm non-matching URLs show no indicators

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| No banner appears | Pattern doesn't match URL | Check match pattern and value |
| Wrong color shows | Multiple rules match | Check rule order and specificity |
| Banner in wrong position | Incorrect position setting | Verify position configuration |
| Background too strong | High opacity | Background uses fixed 5% opacity |

## Next Steps

Once you've mastered basic configuration:

- Explore [Advanced Features](./advanced-features.html) for regex patterns and bulk operations
- Set up [Cloud Environments](./cloud-environments.html) for AWS, Azure, GCP
- Review [Troubleshooting](./troubleshooting.html) for common issues

---

**Ready for more?** Continue to [Advanced Features](./advanced-features.html) to unlock Enveil's full potential.