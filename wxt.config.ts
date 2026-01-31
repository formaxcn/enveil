import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

function generateVersion(): string {
  const main_version = 2.1;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${main_version}.${year}${month}${day}.${hours}${minutes}${seconds}`;
}

export default defineConfig({
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: "Enveil",
    version: generateVersion(),
    description:
      "A extension for Devops to help you identify your differences between your environments.",
    icons: {
      "16": "icon/16.png",
      "32": "icon/32.png",
      "48": "icon/48.png",
      "96": "icon/96.png",
      "128": "icon/128.png",
    },
    action: {
      default_icon: {
        "16": "icon/16-gray.png",
        "32": "icon/32-gray.png",
        "48": "icon/48-gray.png",
        "96": "icon/96-gray.png",
        "128": "icon/128-gray.png",
      },
    },
    options_ui: {
      page: "entrypoints/options/index.html",
      open_in_tab: true,
    },
    permissions: ["storage", "tabs"],
  },
});
