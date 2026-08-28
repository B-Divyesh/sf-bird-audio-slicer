import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './site/tests',
  testMatch: '*.browser.test.mjs',
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    browserName: 'chromium',
    serviceWorkers: 'allow'
  },
  webServer: {
    command: 'npm run build:site && vite preview --config site/vite.config.mjs --host 127.0.0.1 --port 4174',
    url: 'http://127.0.0.1:4174/',
    reuseExistingServer: false
  }
});
