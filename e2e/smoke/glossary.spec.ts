import { expect, test } from '@playwright/test';

/**
 * The explain layer. Section 9 has one rule above all the others: explaining must never be the
 * same gesture as choosing. These tests hold that line.
 */

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

test('every field carries an info dot that explains it without selecting anything', async ({
  page,
}) => {
  await page.goto('/');

  const dot = page.getByRole('button', { name: 'What is subject?' });
  await expect(dot).toBeVisible();
  await dot.click();

  const popover = page.getByRole('dialog', { name: 'Subject' });
  await expect(popover).toContainText('What it is');
  await expect(popover).toContainText('What changes');
  await expect(popover).toContainText('When to use it');

  // The field it explains was not touched.
  await expect(page.locator('#field-subject textarea')).toHaveValue('');
  await page.keyboard.press('Escape');
  await expect(dot).toBeFocused();
});

test('pressing a chip selects it, and the dot beside it explains it', async ({ page }) => {
  await page.goto('/');
  const chip = page.getByRole('button', { name: 'photograph', exact: true });
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'What is medium?' }).click();
  await expect(page.getByRole('dialog', { name: 'Medium' })).toBeVisible();
  // Choosing and explaining stayed separate: the chip is still the one that is pressed.
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
});

test('i on a focused chip opens the glossary at that vocabulary', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'photograph', exact: true }).focus();
  await page.keyboard.press('i');
  await expect(page).toHaveURL(/\/glossary#vocab-medium$/);
  await expect(page.locator('#vocab-medium')).toContainText('What kind of picture this is at all');
});

test('the glossary lists every term and can be searched', async ({ page }) => {
  await page.goto('/glossary');
  await expect(page.getByRole('heading', { name: 'Glossary', level: 1 })).toBeVisible();
  // The page has a count and the app has a toast region; both are status roles.
  const count = page.locator('.glossary__count');
  await expect(count).toContainText('269 terms');

  await page.getByRole('searchbox', { name: 'Search the glossary' }).fill('aperture');
  await expect(count).toContainText('match');
  await expect(page.locator('.term')).toHaveCount(2);
  await expect(page.locator('.term').first()).toContainText('f/1.4');
});

test('the glossary says so when nothing matches', async ({ page }) => {
  await page.goto('/glossary');
  await page.getByRole('searchbox', { name: 'Search the glossary' }).fill('zzzzz');
  await expect(page.locator('.glossary__empty')).toContainText('Nothing matches that');
});

test('a term is deep-linkable', async ({ page }) => {
  await page.goto('/glossary#setting-stylize');
  const term = page.locator('#setting-stylize');
  await expect(term).toContainText('How much artistic licence the model takes');
  await expect(term).toContainText('0 to 1000, default 100');
});

test('the command palette finds a term as readily as a model', async ({ page }) => {
  await page.goto('/');
  await page.locator('body').click();
  await page.keyboard.press('ControlOrMeta+k');
  await page.keyboard.type('stylize');
  await expect(page.getByRole('option').first()).toContainText('stylize');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/glossary#setting-stylize$/);
});

test('the glossary is reachable from the top bar of every page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Glossary' }).click();
  await expect(page.getByRole('heading', { name: 'Glossary', level: 1 })).toBeVisible();
});

test('a settings row on the output explains the real parameter', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'Advanced' }).click();
  await page.locator('#field-subject textarea').fill('A retired boxer taping his hands');
  await page.getByRole('button', { name: 'Strike' }).click();

  const settings = page.getByRole('group', { name: /^Settings for/ });
  await expect(settings).toContainText('--stylize');
  await expect(settings.getByRole('link', { name: '--stylize' })).toHaveAttribute(
    'href',
    '/glossary#setting-stylize',
  );
});
