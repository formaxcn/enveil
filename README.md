# Enveil - Environment Veil

> **Status**: Beta / Active Development

A Chrome extension for Developers and DevOps to visually distinguish different environments (Local, Staging, Production) by adding configurable banners and overlays.

## Documentation

Full documentation is available in the [`docs/`](./docs/) directory or [View on GitHub Pages](#).

- [Getting Started](./docs/getting-started.md)
- [Configuration Guide](./docs/configuration.md)
- [Development](./docs/development.md)
- [Architecture](./docs/architecture.md)

## Features

- **Visual Indicators**: Customizable corner ribbons and full-page overlays.
- **Flexible Matching**: Match by Domain, URL Prefix, Exact URL, or Regex.
- **Privacy Focused**: 100% local configuration, no external tracking.
- **Lightweight**: Built with WXT + Vanilla JS for minimal footprint.

## Directory Structure

```
.
├── components/      # Shared UI logic
├── entrypoints/     # Extension entry points (background, content, options, popup)
├── docs/            # Project documentation
└── wxt.config.ts    # Build configuration
```

## Quick Build

```bash
# Install dependencies
bun install

# Development mode
bun run dev

# Build for production
bun run build
```

## TODO / Roadmap

- [ ] **Shadow DOM**: Implement Shadow DOM for UI injection to prevent style conflicts with host pages.
- [ ] **Tests**: Add unit and E2E tests for matching logic.
- [ ] **UI Polish**: Improve the Options page UX.
- [ ] **Storage Migration**: Robust handling of configuration schema updates.
- [ ] **Export/Import**: Verify JSON config export/import functionality.

## License

MIT