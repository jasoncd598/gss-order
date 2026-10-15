import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests for the key flows, run against the app in demo mode (sample
 * data, no sign-in, no writes to Supabase or Stripe):  npm run test:e2e
 * Locally this starts `next dev`; in CI it tests the production build.
 */
const PORT = 3100;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'tablet', use: { ...devices['iPad (gen 7)'], defaultBrowserType: 'chromium' } },
    { name: 'tablet-landscape', use: { ...devices['iPad (gen 7) landscape'], defaultBrowserType: 'chromium' } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: process.env.CI ? `npm run start -- -p ${PORT}` : `npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}/welcome`,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    env: { DEMO_MODE: 'true' },
  },
});
