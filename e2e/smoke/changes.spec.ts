import { expect, test, type Page } from '@playwright/test';

/**
 * The changelog, both halves. The public page needs nobody signed in and nothing fetched, and the
 * personal line is the reason phase 7 saved the brief rather than the finished text.
 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('forge.walkthrough', '"done"');
    localStorage.setItem('forge.invite-dismissed', 'true');
  });
});

test('the public page shows a real change, with the date it happened', async ({ page }) => {
  await page.goto('/changes');
  const record = page.getByRole('region', { name: 'The record', exact: true });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('What changed');

  // The history in this repository holds a real release: Claude's version line and its model row.
  await expect(record).toContainText('Claude');
  await expect(record).toContainText('Fable 5');
  await expect(record.locator('time').first()).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);
});

test('it says where the record starts, so an empty stretch is not a mystery', async ({ page }) => {
  await page.goto('/changes');
  const start = page.getByRole('region', { name: 'Where the record starts' });
  await expect(start).toContainText('The record starts here');
  await expect(start).toContainText('57 models');
});

test('it explains what counts as a change, and says a human merges', async ({ page }) => {
  await page.goto('/changes');
  const side = page.getByRole('main');
  await expect(side).toContainText('Nothing in the catalogue is merged by a machine');
  await expect(side).toContainText('a diff of what Forge claims, not of its files');
});

test('it needs no account, and offers none', async ({ page }) => {
  await page.goto('/changes');
  expect(await page.evaluate(() => localStorage.getItem('forge.assistant-key'))).toBeNull();
  const text = (await page.getByRole('main').textContent()) ?? '';
  for (const word of ['sign in', 'pricing', 'plan', 'upgrade', 'subscription']) {
    expect(text, `the changes page says "${word}"`).not.toMatch(new RegExp(`\\b${word}\\b`, 'i'));
  }
});

/** A prompt saved before the change, which is what the personal half is about. */
async function seedOldPrompt(page: Page, modelId: string): Promise<void> {
  await page.addInitScript(
    ({ model }) => {
      localStorage.setItem(
        'forge.library.v1',
        JSON.stringify({
          folders: [],
          prompts: [
            {
              id: 'old',
              folderId: null,
              modelId: model,
              brief: { subject: 'a retired boxer taping his hands' },
              title: 'Written before the change',
              score: 60,
              mode: 'simple',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          recipes: [],
          pins: [],
          shares: [],
        }),
      );
    },
    { model: modelId },
  );
}

test('a saved prompt whose model changed is marked, with what changed', async ({ page }) => {
  await seedOldPrompt(page, 'claude');
  await page.goto('/library');
  const item = page.locator('.lib-item').first();
  await expect(item).toContainText('Model changed');
  await expect(item).toContainText('of your saved prompts use');
  await expect(item.getByRole('link', { name: 'See what changed' })).toBeVisible();
});

test('a saved prompt for a model that did not change is left alone', async ({ page }) => {
  await seedOldPrompt(page, 'midjourney');
  await page.goto('/library');
  await expect(page.locator('.lib-item').first()).not.toContainText('Model changed');
});

test('the mark is not a nag: a prompt saved after the change is left alone', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'forge.library.v1',
      JSON.stringify({
        folders: [],
        prompts: [
          {
            id: 'recent',
            folderId: null,
            modelId: 'claude',
            brief: { subject: 'written afterwards' },
            title: 'Written after the change',
            score: 60,
            mode: 'simple',
            createdAt: '2099-01-01T00:00:00.000Z',
            updatedAt: '2099-01-01T00:00:00.000Z',
          },
        ],
        recipes: [],
        pins: [],
        shares: [],
      }),
    );
  });
  await page.goto('/library');
  await expect(page.locator('.lib-item').first()).not.toContainText('Model changed');
});

test('the changes page is reachable and does not scroll sideways on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 720 });
  await page.goto('/');
  await page.getByRole('link', { name: 'Changes', exact: true }).click();
  await expect(page).toHaveURL(/\/changes$/);
  expect(await page.locator('select').count()).toBe(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
