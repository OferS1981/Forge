import { defineConfig, devices } from '@playwright/test';

// Phase 0: no app exists yet, so both projects point at empty folders and
// run with --pass-with-no-tests. Phase 2 adds the component gallery and
// real tests. The viewports come from the spec, section 17.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
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
