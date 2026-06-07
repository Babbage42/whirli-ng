import { defineConfig, devices } from '@playwright/test';

const SSR_PORT = process.env['SSR_PORT'] ?? '4010';
const SSR_URL = `http://127.0.0.1:${SSR_PORT}`;
const reuseExistingServerOnly = process.env['SSR_REUSE_EXISTING'] === '1';

export default defineConfig({
  testDir: './tests',
  testMatch: /playground-ssr-cls\.spec\.ts/,
  timeout: 45_000,
  expect: {
    timeout: 7_500,
  },
  fullyParallel: true,
  workers: process.env['CI'] ? 2 : 4,
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: SSR_URL,
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  webServer: reuseExistingServerOnly
    ? undefined
    : {
        command: `npm run build:playground:pages && PORT=${SSR_PORT} npm run serve:ssr:playground`,
        url: SSR_URL,
        reuseExistingServer: false,
        timeout: 180_000,
      },
});
