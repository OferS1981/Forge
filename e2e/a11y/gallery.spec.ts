import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** The component gallery has its own server, separate from the site. */
const GALLERY = 'http://localhost:4321/';

/**
 * Section 16 is enforced here rather than aspired to. Every control on the gallery, in both
 * themes, at the three viewports the product supports. A violation fails the build.
 */

const VIEWPORTS = [
  { name: 'desktop', width: 1500, height: 900 },
  { name: 'tablet', width: 820, height: 900 },
  { name: 'phone', width: 375, height: 720 },
];

const THEMES = ['light', 'dark'] as const;

async function setTheme(page: Page, theme: string): Promise<void> {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
  }, theme);
  // Controls transition their background, so measure the settled palette, not a frame of the
  // change. The product itself suppresses this transition: see applyTheme.
  await page.waitForTimeout(200);
}

/** Everything that only exists once a layer is open, opened so axe can see it. */
async function openEveryLayer(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^Model/ }).click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'What is the model?' }).click();
  await expect(page.getByRole('dialog', { name: 'Model' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Raise a message' }).click();
  await expect(page.locator('.fg-toasts')).toContainText('This is a message');
}

for (const theme of THEMES) {
  for (const vp of VIEWPORTS) {
    test(`gallery has no axe violations: ${theme}, ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(GALLERY);
      await setTheme(page, theme);
      await expect(page.getByRole('heading', { name: 'Forge components' })).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }

  test(`open layers have no axe violations: ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1500, height: 900 });
    await page.goto(GALLERY);
    await setTheme(page, theme);
    await openEveryLayer(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test(`the modal dialog has no axe violations: ${theme}`, async ({ page }) => {
    await page.goto(GALLERY);
    await setTheme(page, theme);
    await page.getByRole('button', { name: 'Open a dialog' }).click();
    await expect(page.getByRole('dialog', { name: 'Delete this prompt' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test(`the command palette has no axe violations: ${theme}`, async ({ page }) => {
    await page.goto(GALLERY);
    await setTheme(page, theme);
    await page.getByRole('button', { name: 'Open the palette' }).click();
    await expect(page.getByRole('dialog', { name: 'Search Forge' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}
