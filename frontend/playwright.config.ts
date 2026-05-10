import { defineConfig, devices } from '@playwright/test';

/**
 * Medisys HMS – Playwright E2E Test Configuration
 * Frontend: http://localhost:3000  (Next.js dev server)
 * Backend:  http://localhost:5000  (Express API – must be running separately)
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,           // run sequentially so auth state is stable
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Automatically start the Next.js dev server before running tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,   // reuse if already running
    timeout: 60_000,
  },
});
