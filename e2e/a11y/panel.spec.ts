import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * The side panel meets the same bar as every route on the website: both themes, and the state
 * after it has forged something, because most of it only exists then. The width is the one Chrome
 * opens a side panel at, which is narrower than the phone breakpoint the site is tested at.
 */

const PANEL = 'http://localhost:4323/panel.html?host=midjourney.com';

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
  for (const width of [400, 320]) {
    test(`the panel has no axe violations: ${theme}, ${String(width)}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(PANEL);
      await setTheme(page, theme);
      await expect(page.getByRole('button', { name: /^Model/ })).toBeVisible();
      expect(await violations(page)).toEqual([]);
    });
  }

  test(`the forged panel has no axe violations: ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 900 });
    await page.goto(PANEL);
    await setTheme(page, theme);
    await page.locator('.brief__field').first().locator('textarea, input').first().fill('A dragon');
    await page.getByRole('button', { name: 'Strike' }).click();
    await expect(page.getByRole('region', { name: 'The forged prompt' })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test(`the open model picker has no axe violations: ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 900 });
    await page.goto(PANEL);
    await setTheme(page, theme);
    await page.getByRole('button', { name: /^Model/ }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });
}
