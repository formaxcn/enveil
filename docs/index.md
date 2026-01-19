---
layout: default
title: Home
nav_order: 1
---

# Enveil

**Enveil** is a Chrome Extension designed to help developers and DevOps engineers distinguish between different environments (e.g., Development, Staging, Production) by injecting configurable visual indicators into web pages.

## Key Features

- **Visual Indicators**: Add corner ribbons/banners or full-page overlays to specific sites.
- **Flexible Matching**:
  - **Domain**: Match specific hostnames (e.g., `localhost`, `staging.example.com`).
  - **URL Prefix**: Match URL paths (e.g., `https://api.example.com/v1`).
  - **Regex**: Advanced matching using regular expressions.
  - **Exact URL**: Precise targeting.
- **Customizable**: Choose colors, positions (Top-Left, Top-Right, etc.), and labels.
- **Privacy First**: All configuration is stored locally/synced via Chrome Storage. No external tracking.

## Quick Start

1. Install the extension (Load Unpacked).
2. Open the **Enveil Options** page.
3. specific a **Setting Group** (e.g., "Work Projects").
4. Add a **Site Rule**:
   - **Pattern**: `domain`
   - **Value**: `localhost`
   - **Environment Name**: `LOCAL`
   - **Color**: `#28a745` (Green)
5. Visit `http://localhost:3000` and see the banner!

[Get Started](./getting-started.md){: .btn .btn-primary }
[View Configuration Guide](./configuration.md){: .btn }
