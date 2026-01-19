---
layout: default
title: Security
nav_order: 6
---

# Security Documentation

## Permissions

### `storage`
- **Purpose**: To store user configurations (domain patterns, colors, etc.).
- **Scope**: Local to the user's browser profile. Data is not synced unless `storage.sync` is explicitly used (currently using `local`).

### Content Scripts
- **Purpose**: To inject visual indicators into pages.
- **Scope**: Matches all URLs (`<all_urls>` or specific patterns) as configured by the user.
- **Risk Mitigation**:
    - **Isolation**: Content scripts run in an isolated world, meaning they cannot directly access variables of the page's scripts (though they share the DOM).
    - **No Remote Code**: No external code is loaded at runtime. All logic is bundled within the extension.

## Data Privacy
- **Local Only**: All configuration data is stored locally within the browser (`chrome.storage.local`).
- **No Analytics**: The extension does not collect or transmit usage data, browsing history, or personal information to any external server.

## Threat Model
- **Malicious Pages**: Since content scripts operate on visited pages, a malicious page could theoretically try to interfere with the extension's UI.
    - *Mitigation*: Use Shadow DOM to encapsulate extension UI and prevent style leakage or easy DOM manipulation by the host page.
- **XSS in Options Page**: If user input is not sanitized, cross-site scripting could occur in the Options page.
    - *Mitigation*: Ensure all user inputs (domain patterns, labels) are properly escaped before rendering. CSP (Content Security Policy) prevents inline scripts.

## Best Practices
- **Minimal Permissions**: Only request what is strictly necessary.
- **Review Dependencies**: Regularly audit `package.json` and lockfile for vulnerabilities.
