import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** The glossary is a route, so it meets the same bar as every other route. */

const VIEWPORTS = [
  { name: 'desktop', width: 1500, height: 900 },
  { name: 'tablet', width: 820, height: 900 },
  { name: 'phone', width: 375, height: 720 },
];

async function setTheme(page: Page, theme: string): Promise<void> {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
  }, theme);
}

async function violations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return results.violations.map((v) => `${v.id}: ${v.help}`);
}

for (const theme of ['light', 'dark']) {
  for (const vp of VIEWPORTS) {
    test(`/glossary has no axe violations: ${theme}, ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/glossary');
      await setTheme(page, theme);
      await expect(page.getByRole('heading', { name: 'Glossary', level: 1 })).toBeVisible();
      expect(await violations(page)).toEqual([]);
    });
  }

  test(`an open explanation has no axe violations: ${theme}`, async ({ page }) => {
    await page.goto('/');
    await setTheme(page, theme);
    await page.getByRole('button', { name: 'What is subject?' }).click();
    await expect(page.getByRole('dialog', { name: 'Subject' })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });
}
