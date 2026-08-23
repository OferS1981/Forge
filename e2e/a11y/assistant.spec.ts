import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** The route phase 9 added, both themes, three viewports, in both of its two states. */

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
    test(`/assistant has no axe violations: ${theme}, ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/assistant');
      await setTheme(page, theme);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await violations(page)).toEqual([]);
    });
  }

  test(`the stored-key state has no axe violations: ${theme}`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('forge.assistant-key', 'sk-ant-this-is-not-a-real-key-wxyz');
    });
    await page.setViewportSize({ width: 1500, height: 900 });
    await page.goto('/assistant');
    await setTheme(page, theme);
    await expect(page.getByRole('heading', { name: /Using the key/ })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });
}
