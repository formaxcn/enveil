import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: "Enveil",
    version: "1.0.0",
    description: "A basic extension with popup and options pages",
    icons: {
      "16": "icon/16.png",
      "32": "icon/32.png",
      "48": "icon/48.png",
      "96": "icon/96.png",
      "128": "icon/128.png"
    },
  }
});