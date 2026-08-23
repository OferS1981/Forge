import { defineConfig, devices } from '@playwright/test';

/**
 * Two servers: the component gallery from phase 2, and the site itself from phase 3. Both are
 * built fresh on every run, because a stale build would let a broken page pass, which is the one
 * failure these suites exist to prevent.
 *
 * The viewports come from section 17 of the spec: 1500px, 820px and 375px.
 */
const GALLERY = 'http://localhost:4321';
const WEB = 'http://localhost:4322';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: WEB },
  webServer: [
    {
      command:
        'pnpm --filter @forge/ui run gallery:build && pnpm --filter @forge/ui run gallery:preview',
      url: GALLERY,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'pnpm --filter @forge/web run build && pnpm --filter @forge/web run serve',
      url: WEB,
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
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
