import { defineConfig, devices } from '@playwright/test';

/**
 * Phase 2 adds the component gallery, which both projects run against. It is served from a static
 * build so CI does not depend on a dev server staying up. The viewports come from section 17 of
 * the spec: 1500px, 820px and 375px.
 */
const PORT = 4321;
const BASE_URL = `http://localhost:${String(PORT)}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: BASE_URL },
  webServer: {
    /*
     * Built every run rather than reused. A stale gallery would let a broken component pass, which
     * is the one failure mode this suite exists to prevent.
     */
    command:
      'pnpm --filter @forge/ui run gallery:build && pnpm --filter @forge/ui run gallery:preview',
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'a11y',
      testDir: './e2e/a11y',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'smoke',
      testDir: './e2e/smoke',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
