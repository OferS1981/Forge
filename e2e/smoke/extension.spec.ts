import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/**
 * The side panel, driven as a page, which is what it is. Section 14's bar is that it loads
 * unpacked, opens the right anvil for the site you are on, and pastes into the three sites it has
 * an adapter for.
 *
 * The adapters themselves are unit tested against markup in `packages/extension`, because the real
 * sites need an account and change without warning. What is tested here is everything around them:
 * the panel opening on the right model, forging, and the clipboard path that every site gets.
 */

const PANEL = 'http://localhost:4323/panel.html';

async function openPanel(page: Page, host?: string): Promise<void> {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(host === undefined ? PANEL : `${PANEL}?host=${host}`);
  await expect(page.getByText('Forge', { exact: true })).toBeVisible();
}

async function forgeOne(page: Page, subject: string): Promise<void> {
  await page.locator('.brief__field').first().locator('textarea, input').first().fill(subject);
  await page.getByRole('button', { name: 'Strike' }).click();
  await expect(page.getByRole('region', { name: 'The forged prompt' })).toBeVisible();
}

test('the panel opens the model for the site you are on', async ({ page }) => {
  await openPanel(page, 'midjourney.com');
  await expect(page.getByTestId('where')).toContainText('On midjourney.com');
  await expect(page.getByTestId('where')).toContainText('Midjourney');
  await expect(page.getByRole('button', { name: /^Model/ })).toContainText('Midjourney');
});

test('a different site opens a different anvil, without anyone choosing', async ({ page }) => {
  await openPanel(page, 'suno.com');
  await expect(page.getByRole('button', { name: /^Model/ })).toContainText('Suno');
  // The brief follows the model, so a music model asks music questions.
  await expect(page.locator('.brief__field')).not.toHaveCount(0);
  await expect(page.getByRole('region', { name: 'The forged prompt' })).toHaveCount(0);
});

test('a site Forge has no model for says so, and still works', async ({ page }) => {
  await openPanel(page, 'example.com');
  await expect(page.getByTestId('where')).toContainText('no model for this site');
  await forgeOne(page, 'A retired boxer taping his hands');
  await expect(page.getByRole('region', { name: 'The forged prompt' })).toContainText('Score');
});

test('opened beside nothing at all, it is a working panel rather than an error', async ({
  page,
}) => {
  await openPanel(page);
  await expect(page.getByTestId('where')).toContainText('Not beside a site Forge knows');
  await forgeOne(page, 'A lighthouse keeper counting ships');
});

test('the panel forges in the grammar of the site it opened on', async ({ page }) => {
  await openPanel(page, 'midjourney.com');
  await forgeOne(page, 'A retired boxer taping his hands');
  const out = page.getByRole('region', { name: 'The forged prompt' });
  // Midjourney's grammar carries its parameters on the end of the prompt itself.
  await expect(out.locator('.panel__prompt')).toContainText('--ar');
  await expect(out.locator('.panel__prompt')).toContainText('boxer');
});

test('outside the extension the action is the clipboard, and it says so', async ({ page }) => {
  await openPanel(page, 'midjourney.com');
  await forgeOne(page, 'A dragon breathing fire');
  await page.getByRole('button', { name: 'Copy the prompt' }).click();
  await expect(page.locator('.fg-toasts')).toContainText('clipboard');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('dragon');
});

test('Simple mode asks fewer questions here too', async ({ page }) => {
  await openPanel(page, 'midjourney.com');
  const simple = await page.locator('.brief__field').count();
  await page.getByRole('radio', { name: 'Advanced' }).click();
  expect(await page.locator('.brief__field').count()).toBeGreaterThan(simple);
});

test('striking an empty brief says what to do rather than failing quietly', async ({ page }) => {
  await openPanel(page, 'midjourney.com');
  await page.getByRole('button', { name: 'Strike' }).click();
  await expect(page.locator('.fg-toasts')).toContainText('Fill in at least the first field');
  await expect(page.getByRole('region', { name: 'The forged prompt' })).toHaveCount(0);
});

test('the panel has no native select and does not scroll sideways in a side panel', async ({
  page,
}) => {
  // The width Chrome opens a side panel at.
  await page.setViewportSize({ width: 400, height: 800 });
  await openPanel(page, 'midjourney.com');
  await forgeOne(page, 'A retired boxer taping his hands');
  expect(await page.locator('select').count()).toBe(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'the panel scrolls sideways').toBeLessThanOrEqual(0);
});

test('the built extension is a loadable manifest v3 package', () => {
  const dist = 'apps/extension/dist';
  const manifest: unknown = JSON.parse(readFileSync(`${dist}/manifest.json`, 'utf8'));
  const m = manifest as Record<string, unknown>;
  expect(m.manifest_version).toBe(3);

  // Every file the manifest names has to actually be in the package, or it will not load.
  const named = [
    (m.background as { service_worker: string }).service_worker,
    (m.side_panel as { default_path: string }).default_path,
    ...(m.content_scripts as { js: string[] }[]).flatMap((c) => c.js),
  ];
  for (const file of named) {
    expect(() => readFileSync(`${dist}/${file}`), `${file} is named but not built`).not.toThrow();
  }

  /*
   * The content script is injected into every matched page, so its size is somebody else's page
   * weight. It must never quietly start carrying the catalogue.
   */
  const content = readFileSync(`${dist}/content.js`, 'utf8');
  expect(content.length, 'the content script has grown a dependency').toBeLessThan(20_000);
});
