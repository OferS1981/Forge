import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { LESSON_SLUGS } from './lessons';

/**
 * The Learn routes and the walkthrough meet the same bar as everything else: both themes, three
 * viewports, and the states that only exist once something has been opened.
 */

const VIEWPORTS = [
  { name: 'desktop', width: 1500, height: 900 },
  { name: 'tablet', width: 820, height: 900 },
  { name: 'phone', width: 375, height: 720 },
];

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

test('the slug list beside the specs matches what /learn actually renders', async ({ page }) => {
  // LESSON_SLUGS is kept in this folder so the suites import no application code. The price of
  // that is drift: a seventh lesson added to the app would be silently unaxed. This test makes
  // the drift loud instead.
  await page.goto('/learn');
  const hrefs = await page
    .getByRole('main')
    .getByRole('link')
    .evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''));
  const rendered = hrefs
    .filter((h) => /\/learn\/[a-z-]+$/.test(h))
    .map((h) => h.split('/').pop())
    .sort();
  expect(rendered, 'update e2e/a11y/lessons.ts when a lesson is added or removed').toEqual(
    [...LESSON_SLUGS].sort(),
  );
});

for (const theme of ['light', 'dark']) {
  test(`/learn has no axe violations: ${theme}`, async ({ page }) => {
    await page.goto('/learn');
    await setTheme(page, theme);
    await expect(page.getByRole('heading', { name: 'Learn', level: 1 })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test(`every lesson has no axe violations: ${theme}`, async ({ page }) => {
    for (const slug of LESSON_SLUGS) {
      await page.goto(`/learn/${slug}`);
      await setTheme(page, theme);
      expect(await violations(page), `/learn/${slug}`).toEqual([]);
    }
  });

  test(`the walkthrough has no axe violations: ${theme}`, async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await setTheme(page, theme);
    await expect(page.getByRole('dialog')).toContainText('Step 1 of 5');
    expect(await violations(page)).toEqual([]);

    // And the step that sits over a forged result, which is a different page entirely.
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'See the prompt' }).click();
    await expect(page.getByRole('dialog')).toContainText('This is your prompt');
    expect(await violations(page)).toEqual([]);
  });

  test(`the invitation has no axe violations: ${theme}`, async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await setTheme(page, theme);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('complementary', { name: 'A faster way to start' })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });
}

for (const vp of VIEWPORTS) {
  test(`Learn has no axe violations at ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const route of ['/learn', '/learn/lens', '/learn/punctuation']) {
      await page.goto(route);
      expect(await violations(page), `${route} at ${vp.name}`).toEqual([]);
    }
  });
}
