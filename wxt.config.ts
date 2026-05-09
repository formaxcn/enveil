import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

function generateVersion(): string {
  const mainVersion1 = 2;
  const mainVersion2 = 2;
  const now = new Date();
  const year = now.getFullYear() % 100; // 0-99
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate(); // 1-31
  const hour = now.getHours(); // 0-23
  const minute = now.getMinutes(); // 0-59
  const second = now.getSeconds(); // 0-59

  // part3: 年月日编码 (最大 37231)
  const part3 = year * 372 + month * 31 + day;

  // part4: 当天时间片 (0-65535)，每个时间片约 1.318 秒
  const daySeconds = hour * 3600 + minute * 60 + second;
  const part4 = Math.floor(daySeconds * 65536 / 86400);

  return `${mainVersion1}.${mainVersion2}.${part3}.${part4}`;
}

const profileDir = path.resolve('.chrome-profile');

export default defineConfig({
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  webExt: {
    startUrls: ['chrome://extensions/'],
    chromiumArgs: [
      '--remote-debugging-port=9222',
      `--user-data-dir=${profileDir}`,
      '--profile-directory=enveil-debug',
      '--no-first-run',
      '--no-default-browser-check',
    ],
  },
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
    web_accessible_resources: [
      {
        resources: ['icon/*'],
        matches: ['<all_urls>'],
      },
    ],
  },
});
