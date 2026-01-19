---
layout: default
title: Configuration
nav_order: 3
---

# Configuration Guide

Enveil allows you to define rules to identify environments. A configuration consists of **Settings** (groups) which contain multiple **Site Rules**.

## Site Configuration Fields

| Field | Description | Type |
|-------|-------------|------|
| **Enable** | Toggle this specific rule on/off. | Boolean |
| **Match Pattern** | How to match the current page. | Enum (see below) |
| **Match Value** | The string/regex to match against. | String |
| **Env Name** | Text to display in the banner (e.g., "PROD"). | String |
| **Color** | Background color of the indicator (Hex/RGB). | String |
| **Position** | Where to place the banner. | Enum (see below) |
| **Banner Enable** | Show the corner ribbon/banner. | Boolean |
| **Background Enable** | Show a full-page colored overlay (low opacity). | Boolean |

## Match Patterns

Enveil supports four matching strategies:

### 1. Domain (`domain`)
Matches the distinct hostname.
- **Logic**: `host === value` OR `host.endsWith('.' + value)`
- **Example**: `example.com` matches `example.com` and `app.example.com`.

### 2. URL Prefix (`urlPrefix`)
Matches if the URL starts with the value.
- **Logic**: `url.startsWith(value)`
- **Example**: `https://github.com/enveil` matches specific repository paths.

### 3. Exact URL (`url`)
Strict equality match.
- **Logic**: `url === value`
- **Example**: `http://localhost:8080/admin` matches only that exact page.

### 4. Regex (`regex`)
Advanced matching using JavaScript RegExp.
- **Logic**: `new RegExp(value).test(url)`
- **Example**: `^https?:\/\/.*\.test\.com` matches http/https subdomains of test.com.

## UI Options

### Banner Positions
- `leftTop`: Top Left Corner
- `rightTop`: Top Right Corner
- `leftBottom`: Bottom Left Corner
- `rightBottom`: Bottom Right Corner

### Overlay
If `Background Enable` is checked, a full-page overlay with `opacity: 0.05` (5%) using the configured **Color** will be added. This is useful for dangerous environments (e.g., Production) to give a subtle tint to the whole page.
