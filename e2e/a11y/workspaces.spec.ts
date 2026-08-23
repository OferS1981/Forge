import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Every route added in phase 5 meets the same bar as the two before it: both themes, three
 * viewports, and the state after the workspace has actually produced something, because most of
 * each page only exists then.
 */

const ROUTES = ['/doctor', '/reverse', '/match', '/cross-forge', '/batch', '/compare', '/recipes'];

const VIEWPORTS = [
  { name: 'desktop', width: 1500, height: 900 },
  { name: 'tablet', width: 820, height: 900 },
  { name: 'phone', width: 375, height: 720 },
];

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

async function violations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return results.violations.map((v) => `${v.id}: ${v.help}`);
}

for (const theme of ['light', 'dark']) {
  for (const route of ROUTES) {
    test(`${route} has no axe violations: ${theme}`, async ({ page }) => {
      await page.goto(route);
      await setTheme(page, theme);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await violations(page)).toEqual([]);
    });
  }

  test(`the Doctor's diagnosis has no axe violations: ${theme}`, async ({ page }) => {
    await page.goto('/doctor');
    await setTheme(page, theme);
    await page.locator('#doctor-in').fill('a robot, 8k, masterpiece, trending on artstation');
    await page.getByRole('button', { name: 'Diagnose' }).click();
    await expect(page.getByRole('meter', { name: 'Specificity' })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test(`the Match results have no axe violations: ${theme}`, async ({ page }) => {
    await page.goto('/match');
    await setTheme(page, theme);
    await page.locator('#match-in').fill('A 15-second vertical ad with a voiceover and music');
    await page.getByRole('button', { name: 'Find the tool' }).click();
    await expect(page.locator('.rec').first()).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test(`the Compare difference has no axe violations: ${theme}`, async ({ page }) => {
    await page.goto('/compare');
    await setTheme(page, theme);
    await page.locator('#compare-a').fill('a photo of a boxer');
    await page.locator('#compare-b').fill('a photo of a boxer, 85mm at f/2.8');
    await page.getByRole('button', { name: 'Compare', exact: true }).click();
    await expect(page.locator('.diff')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });
}

for (const vp of VIEWPORTS) {
  test(`every workspace has no axe violations at ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const route of ROUTES) {
      await page.goto(route);
      const found = await violations(page);
      expect(found, `${route} at ${vp.name}`).toEqual([]);
    }
  });
}
