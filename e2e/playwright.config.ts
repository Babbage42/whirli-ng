import { defineConfig, devices } from '@playwright/test';

const STORYBOOK_PORT = process.env['STORYBOOK_PORT'] ?? '6006';
const STORYBOOK_URL = `http://localhost:${STORYBOOK_PORT}`;

export default defineConfig({
  testDir: './tests',
  testIgnore: /playground-ssr-cls\.spec\.ts/,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  workers: process.env['CI'] ? 4 : 6,
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `${STORYBOOK_URL}/iframe.html`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `node serve-storybook-static.mjs ${STORYBOOK_PORT}`,
    url: `${STORYBOOK_URL}/iframe.html`,
    reuseExistingServer: !process.env['CI'],
    timeout: 15_000,
  },
});
