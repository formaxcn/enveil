import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: "Enveil",
    version: "1.0.0",
    description:
      "A extension for Devops to help you identify your differences between your environments.",
    icons: {
      "16": "icon/16.png",
      "32": "icon/32.png",
      "48": "icon/48.png",
      "96": "icon/96.png",
      "128": "icon/128.png",
    },
    options_ui: {
      page: "entrypoints/options/index.html",
      open_in_tab: true,
    },
    permissions: ["storage", "tabs"],
  },
});
