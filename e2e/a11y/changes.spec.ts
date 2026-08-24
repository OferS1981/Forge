import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** The route phase 12 added, both themes, three viewports, plus the marked library. */

const VIEWPORTS = [
  { name: 'desktop', width: 1500, height: 900 },
  { name: 'tablet', width: 820, height: 900 },
  { name: 'phone', width: 375, height: 720 },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('forge.walkthrough', '"done"');
    localStorage.setItem('forge.invite-dismissed', 'true');
  });
});

async function setTheme(page: Page, theme: string): Promise<void> {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
  }, theme);
  await page.waitForTimeout(200);
}

async function violations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return results.violations.map((v) => `${v.id}: ${v.help}`);
}

for (const theme of ['light', 'dark']) {
  for (const vp of VIEWPORTS) {
    test(`/changes has no axe violations: ${theme}, ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/changes');
      await setTheme(page, theme);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await violations(page)).toEqual([]);
    });
  }

  test(`a library with a marked prompt has no axe violations: ${theme}`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'forge.library.v1',
        JSON.stringify({
          folders: [],
          prompts: [
            {
              id: 'old',
              folderId: null,
              modelId: 'claude',
              brief: { subject: 'a boxer' },
              title: 'Written before the change',
              score: 60,
              mode: 'simple',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          recipes: [],
          pins: [],
          shares: [],
        }),
      );
    });
    await page.setViewportSize({ width: 1500, height: 900 });
    await page.goto('/library');
    await setTheme(page, theme);
    await expect(page.locator('.lib-item__stale')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });
}
