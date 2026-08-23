import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * The routes phase 7 added, held to the same bar as everything before them: both themes, three
 * viewports, and the state after there is something on the page, because an empty library and a
 * full one are different pages.
 */

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

/** A library with something in it, put there the way the product puts it there. */
async function seed(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('#field-subject textarea').fill('A retired boxer taping his hands');
  await page.locator('#field-setting input').fill('Basement gym at 6am');
  await page.getByRole('button', { name: 'Strike' }).click();
  await page.getByRole('button', { name: 'Keep this prompt' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Keep it' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

for (const theme of ['light', 'dark']) {
  for (const route of ['/library', '/account']) {
    for (const vp of VIEWPORTS) {
      test(`${route} has no axe violations: ${theme}, ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(route);
        await setTheme(page, theme);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        expect(await violations(page)).toEqual([]);
      });
    }
  }

  test(`a library with something in it has no axe violations: ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1500, height: 900 });
    await seed(page);
    await page.goto('/library');
    await setTheme(page, theme);
    await expect(page.locator('.lib-item')).toHaveCount(1);
    expect(await violations(page)).toEqual([]);
  });

  test(`the keep dialog has no axe violations: ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1500, height: 900 });
    await page.goto('/');
    await setTheme(page, theme);
    await page.locator('#field-subject textarea').fill('A retired boxer taping his hands');
    await page.getByRole('button', { name: 'Strike' }).click();
    await page.getByRole('button', { name: 'Keep this prompt' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test(`a shared prompt has no axe violations: ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1500, height: 900 });
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await page.locator('#field-subject textarea').fill('A dragon breathing fire');
    await page.getByRole('button', { name: 'Strike' }).click();
    await page.getByRole('button', { name: 'Share a link' }).click();
    const url = await page.evaluate(() => navigator.clipboard.readText());
    await page.goto(url);
    await setTheme(page, theme);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test(`an empty share page has no axe violations: ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await page.goto('/p');
    await setTheme(page, theme);
    await expect(page.getByRole('heading', { name: 'Nothing in this link' })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });
}
