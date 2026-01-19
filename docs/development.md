---
layout: default
title: Development
nav_order: 4
---

# Development Guide

## Prerequisites

- **Node.js** (v18+)
- **Bun** (Latest)
- **Chrome** (for testing)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/enveil.git
   cd enveil
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

## Workflow

Enveil uses [WXT (Web Extension Tools)](https://wxt.dev/) for the build system.

### Development Server
Start the dev server with hot-reload:
```bash
bun run dev
```
This will:
- Build the extension in `.output/chrome-mv3`.
- Watch for file changes.
- (Optional) Open a browser instance if configured.

### Building for Production
Create an optimized build:
```bash
bun run build
```
Artifacts will be in `.output/`.

## Architecture Reference

See [Architecture](./architecture.md) for details on the internal component structure.
