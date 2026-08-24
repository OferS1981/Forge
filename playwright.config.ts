import { defineConfig, devices } from '@playwright/test';

/**
 * Three servers: the component gallery from phase 2, the site itself from phase 3, and the
 * extension's side panel from phase 8. All are built fresh on every run, because a stale build
 * would let a broken page pass, which is the one failure these suites exist to prevent.
 *
 * The panel is served as an ordinary page on purpose. It is one: every browser API it needs goes
 * through `apps/extension/src/bridge.ts`, which falls back when there is no extension around it,
 * so the panel can be driven here exactly as a person drives it in the side panel.
 *
 * The viewports come from section 17 of the spec: 1500px, 820px and 375px.
 */
const GALLERY = 'http://localhost:4321';
const WEB = 'http://localhost:4322';
const PANEL = 'http://localhost:4323';

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
      /*
       * Built with no account service on purpose, whatever is in the developer's `.env.local`.
       * These suites are written for the state phase 7 is judged by, which is that a signed-out
       * visitor has the whole product, and a suite that passes in CI and fails on the machine of
       * whoever configured a project is worse than no suite. An explicit empty value wins over the
       * dotfile, so this is the one place that decides it.
       *
       * The configured path is exercised against the real project by hand, and its policies are
       * covered by packages/data/test/rls.test.ts.
       */
      env: { NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_ANON_KEY: '' },
    },
    {
      command:
        'pnpm --filter @forge/extension-app run build && pnpm --filter @forge/extension-app run serve',
      url: `${PANEL}/panel.html`,
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
