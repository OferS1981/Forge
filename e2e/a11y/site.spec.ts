import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Section 16 on the site itself: every route, both themes, three viewports. The forged output is
 * included, because most of the page only exists after a strike.
 */

const ROUTES = ['/'];

const VIEWPORTS = [
  { name: 'desktop', width: 1500, height: 900 },
  { name: 'tablet', width: 820, height: 900 },
  { name: 'phone', width: 375, height: 720 },
];

const THEMES = ['light', 'dark'] as const;

/**
 * These tests are about the product, not the first run, so they arrive as someone who has been
 * here before. The walkthrough itself is covered by e2e/smoke/tutorial.spec.ts, which arrives with
 * nothing remembered on purpose.
 */
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
  // Controls transition their background, so measure the settled palette, not a frame of the
  // change. The product itself suppresses this transition: see applyTheme.
  await page.waitForTimeout(200);
}

/** Fill the brief and strike, so the output panel is on the page when axe looks at it. */
export async function forgeOne(page: Page): Promise<void> {
  await page.locator('#field-subject textarea').fill('A retired boxer taping his hands');
  await page.locator('#field-setting input').fill('Basement gym at 6am');
  await page.getByRole('button', { name: 'Strike' }).click();
  await expect(page.getByRole('meter', { name: 'Prompt score' })).toBeVisible();
}

async function violations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return results.violations.map((v) => `${v.id}: ${v.help}`);
}

for (const theme of THEMES) {
  for (const route of ROUTES) {
    for (const vp of VIEWPORTS) {
      test(`${route} has no axe violations: ${theme}, ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(route);
        await setTheme(page, theme);
        // The page's first-level heading is the model being worked on. The wordmark is a wordmark.
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        expect(await violations(page)).toEqual([]);
      });
    }
  }

  test(`the forged output has no axe violations: ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1500, height: 900 });
    await page.goto('/');
    await setTheme(page, theme);
    await forgeOne(page);
    expect(await violations(page)).toEqual([]);
  });

  test(`Advanced mode has no axe violations: ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1500, height: 900 });
    await page.goto('/');
    await setTheme(page, theme);
    await page.getByRole('radio', { name: 'Advanced' }).click();
    await forgeOne(page);
    expect(await violations(page)).toEqual([]);
  });

  test(`the open model rail has no axe violations: ${theme}`, async ({ page }) => {
    await page.goto('/');
    await setTheme(page, theme);
    await page.getByRole('button', { name: /^Model/ }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });
}
