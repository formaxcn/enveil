# Enveil - Chrome Extension

A Chrome extension to distinguish different environments by adding banners and overlays.

## Directory Structure

```
.
├── components
│   ├── SwitchComponent.ts
│   └── counter.ts
├── entrypoints
│   ├── options
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── style.css
│   ├── popup
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── style.css
│   ├── background.ts
│   └── content.ts
├── README.md
├── package.json
├── tsconfig.json
└── wxt.config.ts
```

## Features

1. Add customizable banner to website corners to differentiate environments
2. Add overall overlay mask with customizable color and opacity
3. Configuration page for setting domain patterns, colors, positions, and toggle switches
4. Import/export configuration as JSON files

**Note: These features are planned but not yet implemented.**

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Open Chrome and go to `chrome://extensions`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `dist` directory

## Development

To run the extension in development mode:

```bash
npm run dev
```

This will start the development server and build the extension in watch mode.

## Usage

After installing the extension:

1. Click the extension icon in the toolbar to open the popup
2. Click "Options" to configure the extension settings
3. Configure domain patterns, banner colors, and other settings
4. The extension will automatically apply styles to matching domains

**Note: The full functionality is not yet implemented.**