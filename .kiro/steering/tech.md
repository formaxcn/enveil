# Technology Stack

## Build System & Framework
- **WXT**: Modern web extension framework for Chrome/Firefox
- **Bun**: Package manager and runtime (preferred over npm/yarn)
- **TypeScript**: Strict mode enabled for type safety
- **Vanilla JavaScript**: No heavy frontend frameworks, keeping it lightweight

## Browser Extension Architecture
- **Manifest V3**: Modern Chrome extension format
- **Entry Points**: Background scripts, content scripts, options page, popup
- **Permissions**: `storage` (local config), `tabs` (environment detection)

## Development Tools
- **TypeScript**: ESNext target with bundler module resolution
- **Sharp**: Image processing for icon generation
- **Path Aliases**: `@`, `~`, `@@`, `~~` all point to project root

## Common Commands

### Development
```bash
# Start development server (Chrome)
bun run dev

# Start development server (Firefox)
bun run dev:firefox

# Type checking
bun run compile
```

### Building
```bash
# Production build (Chrome)
bun run build

# Production build (Firefox) 
bun run build:firefox

# Create distribution zip
bun run zip
bun run zip:firefox
```

### Setup
```bash
# Install dependencies
bun install

# Prepare WXT environment (auto-runs after install)
bun run postinstall
```

## Code Style Guidelines
- Use TypeScript strict mode
- Prefer async/await over promises
- Use descriptive variable names
- Include error handling with user-friendly messages
- Comment complex logic, especially regex patterns
- Use consistent file naming (kebab-case for files, PascalCase for classes)