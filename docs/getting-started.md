---
layout: default
title: Getting Started
nav_order: 2
---

# Getting Started

## Installation

Enveil is currently in active development. To install it, you need to load it as an "Unpacked Extension" in Chrome.

### 1. Build from Source
If you have the source code:
```bash
bun install
bun run build
```
The build artifacts will be generated in `.output/chrome-mv3`.

### 2. Load in Chrome
1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked**.
4. Select the `.output/chrome-mv3` folder from your project directory.

## Basic Usage

### Configuring Your First Environment
1. Click the Enveil icon in your toolbar (pin it if necessary).
2. Select **Options** to open the configuration dashboard.
3. You will see a default setting group (or create a new one).
4. Click **Add Site** inside the group.
5. Enter the details:
   - **Match Pattern**: `domain`
   - **Value**: `localhost` (or your work domain)
   - **Env Name**: `DEV`
   - **Color**: Select a color (e.g., `#3366ff` for blue).
   - **Position**: `rightTop`.
   - **Banner**: Enable.
   - **Background**: Disable (unless you want the whole page tinted).
6. Click **Save** in the bottom right (if applicable, or changes might auto-save depending on version).
7. Visit the site (e.g., `http://localhost:3000`) to verify the banner appears.

## Troubleshooting
- **Banner not showing?**
  - Check if the URL matches the pattern exactly.
  - Ensure the extension is enabled.
  - Refresh the target page (content scripts might not inject into already open tabs immediately after install).
