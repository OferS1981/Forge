import { expect, test, type Page } from '@playwright/test';

/**
 * The good-to-great preparation sweep: the questions panel, the policy toggle, and a walk across
 * every tab and mode with the new behaviour on, so nothing ships half-wired.
 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('forge.walkthrough', '"done"');
    localStorage.setItem('forge.invite-dismissed', 'true');
  });
});

async function pickModel(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: /^Model/ }).click();
  await page.getByRole('combobox').fill(name);
  await page.getByRole('option').first().click();
}

test('a coding brief gets the questions a senior asks, and answering one retires it', async ({
  page,
}) => {
  await page.goto('/');
  await pickModel(page, 'Claude Code');
  await page
    .locator('#field-cTask textarea, #field-cTask input')
    .first()
    .fill('Fix the flaky checkout test');

  const asks = page.getByRole('region', { name: 'Forge would ask' });
  await expect(asks).toContainText('How will we know it worked?');
  await expect(asks).toContainText('generous to itself');

  // Clicking the question opens its field; answering it retires the question.
  await asks.getByRole('button', { name: 'How will we know it worked?' }).click();
  await page
    .locator('#field-cCheck textarea, #field-cCheck input')
    .first()
    .fill('The suite passes 20 runs');
  await expect(asks).not.toContainText('How will we know it worked?');
  await expect(asks).toContainText('leave alone');
});

test('an empty brief gets the form, not an interview', async ({ page }) => {
  await page.goto('/');
  await pickModel(page, 'Claude Code');
  await expect(page.getByRole('region', { name: 'Forge would ask' })).toHaveCount(0);
});

test('the questions land in the prompt: an unchecked task makes the agent ask first', async ({
  page,
}) => {
  await page.goto('/');
  await pickModel(page, 'Claude Code');
  await page.locator('#field-cTask textarea, #field-cTask input').first().fill('Add CSV export');
  await page.getByRole('button', { name: 'Strike' }).click();
  const out = page.getByRole('region', { name: 'The forged prompt' });
  await expect(out).toContainText('Propose the check you will run');
});

test('policy notes are off by default, and no scan of anything ever happens', async ({ page }) => {
  await page.goto('/');
  await pickModel(page, 'Midjourney');
  await page.locator('#field-subject textarea').fill('a quiet harbour at dawn');
  await page.getByRole('button', { name: 'Strike' }).click();
  await expect(page.getByRole('region', { name: 'The forged prompt' })).not.toContainText(
    'content rules',
  );
});

test('turning policy notes on shows the vendor rules, in the vendor words, with the link', async ({
  page,
}) => {
  await page.goto('/');
  await pickModel(page, 'Midjourney');
  await page.getByRole('switch', { name: 'Policy notes' }).check({ force: true });
  await page.locator('#field-subject textarea').fill('a quiet harbour at dawn');
  await page.getByRole('button', { name: 'Strike' }).click();
  const out = page.getByRole('region', { name: 'The forged prompt' });
  await expect(out).toContainText("The vendor's content rules");
  await expect(out).toContainText('PG-13');
  await expect(out.getByRole('link', { name: 'Community Guidelines' })).toHaveAttribute(
    'href',
    /docs\.midjourney\.com/,
  );
});

test('a model whose policy page has not been read shows nothing rather than a guess', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('forge.policy-notes', 'true');
  });
  await page.goto('/');
  await pickModel(page, 'Runway');
  await page.locator('#field-subject textarea').fill('a quiet harbour');
  await page.getByRole('button', { name: 'Strike' }).click();
  await expect(page.getByRole('region', { name: 'The forged prompt' })).not.toContainText(
    'content rules',
  );
});

test('the toggle survives a reload, like every other setting', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('switch', { name: 'Policy notes' }).check({ force: true });
  await page.reload();
  await expect(page.getByRole('switch', { name: 'Policy notes' })).toBeChecked();
});

test('the whole bench still works with everything on: every tab, both modes', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('forge.policy-notes', 'true');
  });
  for (const route of [
    '/',
    '/doctor',
    '/reverse',
    '/match',
    '/cross-forge',
    '/batch',
    '/compare',
    '/recipes',
    '/library',
    '/changes',
    '/assistant',
  ]) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    expect(await page.locator('select').count(), `${route} has a native select`).toBe(0);
  }
  await page.goto('/');
  await page.getByRole('radio', { name: 'Advanced' }).click();
  await page.locator('#field-subject textarea').fill('a lighthouse keeper');
  await page.getByRole('button', { name: 'Strike' }).click();
  await expect(page.getByRole('meter', { name: 'Prompt score' })).toBeVisible();
});
