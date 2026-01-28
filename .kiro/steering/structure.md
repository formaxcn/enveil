# Project Structure

## Root Directory Organization

```
.
├── components/          # Shared UI components and logic
├── entrypoints/         # Browser extension entry points
│   ├── background.ts    # Service worker for extension lifecycle
│   ├── content.ts       # Content script injected into web pages
│   ├── options/         # Extension options/settings page
│   └── popup/           # Extension popup interface
├── docs/                # Project documentation
├── public/              # Static assets (icons, manifest resources)
├── utils/               # Shared utility functions
├── tests/               # Test files (currently empty)
└── wxt.config.ts        # WXT framework configuration
```

## Key Directories

### `/entrypoints/`
Contains all browser extension entry points following WXT conventions:
- **background.ts**: Service worker handling extension lifecycle events
- **content.ts**: Script injected into web pages for DOM manipulation
- **options/**: Complete options page with managers for different features
- **popup/**: Extension popup accessible from browser toolbar

### `/entrypoints/options/`
Options page is organized with a manager pattern:
- **main.ts**: Entry point and initialization
- **managers/**: Feature-specific controllers (AppController, BrowserSyncManager, etc.)
- **test/**: Testing files for options page functionality
- **types.ts**: TypeScript type definitions

### `/components/`
Reusable UI components:
- Modal components (AddSiteModal, AddGroupModal)
- Interactive components (SwitchComponent, PreviewComponent)
- Shared component logic

### `/utils/`
Utility functions used across the extension:
- **matcher.ts**: URL/domain matching logic

## File Naming Conventions
- **TypeScript files**: PascalCase for classes, camelCase for utilities
- **CSS files**: kebab-case matching their HTML/TS counterparts
- **HTML files**: kebab-case, typically paired with TS/CSS files
- **Configuration files**: Standard names (tsconfig.json, wxt.config.ts)

## Import Path Aliases
All aliases point to project root for consistent imports:
- `@/` or `~/` - Project root
- `@@/` or `~~/` - Alternative project root aliases

## Asset Organization
- **Icons**: Multiple sizes in `/public/icon/` (16, 32, 48, 96, 128px)
- **Gray icons**: Disabled state versions for each size
- **Static assets**: SVG and other resources in `/public/`

## Configuration Files
- **wxt.config.ts**: Extension manifest and build configuration
- **tsconfig.json**: Extends WXT's generated TypeScript config
- **package.json**: Uses bun as package manager, includes WXT scripts