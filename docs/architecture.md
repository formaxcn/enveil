# Architecture Documentation

## Overview
Enveil is a Chrome Extension built using the [WXT](https://wxt.dev/) framework. It is designed to help users identify different environments (e.g., dev, staging, prod) by injecting visual cues such as banners or overlays into web pages based on configurable rules.

## Tech Stack
- **Framework**: WXT (Web Extension Tools)
- **Runtime/Package Manager**: Bun
- **Language**: TypeScript
- **UI**: Vanilla HTML/CSS/JS (with potential for framework integration like React/Vue if needed later, currently keeping it lightweight).

## Core Components

### 1. Options Page (`entrypoints/options/`)
- **Purpose**: Main configuration interface for the user.
- **Functionality**:
    - Manage sites/domains.
    - Configure visual indicators (banners, ribbons, watermarks).
    - Import/Export settings.
- **Storage**: Persists data to `chrome.storage.local`.

### 2. Content Script (`entrypoints/content.ts`)
- **Purpose**: Injects UI elements into the visited web pages.
- **Functionality**:
    - Reads settings from storage.
    - Matches current URL against configured patterns.
    - Injects DOM elements (Shadow DOM recommended to avoid style conflicts) to display banners/overlays.
    - Listens for storage changes to update UI dynamically.

### 3. Background/Service Worker (`entrypoints/background.ts`)
- **Purpose**: Handles browser events and long-running tasks.
- **Functionality**:
    - (Currently minimal, expandable)
    - Validating rules.
    - Handling migration of settings.

### 4. Popup (`entrypoints/popup/`)
- **Purpose**: Quick access / Status indicator.
- **Functionality**:
    - Quickly toggle extension on/off for current site.
    - Link to Options page.

## Data Flow
1. **Configuration**: User saves settings in Options UI -> `chrome.storage.local`.
2. **Injection**: User visits a page -> Content script loads -> Reads `chrome.storage.local` -> Checks for matches -> Injects UI.
3. **Updates**: User updates settings -> `chrome.storage.onChanged` fires in Content script -> UI updates immediately.

## Directory Structure
- `entrypoints/`: WXT entry points (background, content, popup, options).
- `components/`: Shared logic or UI helper classes.
- `assets/`: Static assets (icons, images).
- `.output/`: Build artifacts (managed by WXT).
