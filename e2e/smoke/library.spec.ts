import { expect, test, type Page } from '@playwright/test';

/**
 * Phase 7 is done when a signed-out visitor still has the whole app. There is no account service
 * in this build, which is exactly the state these tests want: everything below is done by someone
 * who has never signed in and never will.
 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('forge.walkthrough', '"done"');
    localStorage.setItem('forge.invite-dismissed', 'true');
  });
  // Sharing copies a link, and a headless browser has to be told that is allowed.
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
});

async function forgeOne(page: Page, subject = 'A retired boxer taping his hands'): Promise<void> {
  await page.goto('/');
  await page.locator('#field-subject textarea').fill(subject);
  await page.locator('#field-setting input').fill('Basement gym at 6am');
  await page.getByRole('button', { name: 'Strike' }).click();
  await expect(page.getByRole('meter', { name: 'Prompt score' })).toBeVisible();
}

async function keep(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Keep this prompt' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name').fill(name);
  await dialog.getByRole('button', { name: 'Keep it' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

test('a signed-out visitor can keep a prompt and find it in the library', async ({ page }) => {
  await forgeOne(page);
  await keep(page, 'The boxer');

  await page.goto('/library');
  const out = page.getByRole('region', { name: 'Saved prompts' });
  await expect(out).toContainText('The boxer');
  await expect(out).toContainText('Kept in this browser');
  // No account service in this build, so nothing invites them to sign in.
  await expect(out.getByRole('link', { name: 'Sign in to sync it' })).toHaveCount(0);
});

test('what is saved is the brief, so opening it again puts the brief back', async ({ page }) => {
  await forgeOne(page, 'A lighthouse keeper counting ships');
  await keep(page, 'The lighthouse');

  // Change the brief, so that reopening has something to actually put back.
  await page.locator('#field-subject textarea').fill('Something else entirely');

  await page.goto('/library');
  await page.getByRole('button', { name: 'Open in Build' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#field-subject textarea')).toHaveValue(
    'A lighthouse keeper counting ships',
  );
});

test('a prompt can be filed, moved and unfiled, and deleting a folder keeps the work', async ({
  page,
}) => {
  await forgeOne(page);
  await keep(page, 'The boxer');

  await page.goto('/library');
  await page.getByLabel('New folder').fill('Campaign');
  await page.getByRole('button', { name: 'Add the folder' }).click();

  const item = page.locator('.lib-item').first();
  await item.getByRole('button', { name: /^Folder for/ }).click();
  await page.getByRole('option', { name: 'Campaign' }).click();
  await expect(item.getByRole('button', { name: /^Folder for/ })).toContainText('Campaign');

  // The folder now holds it, and filtering by the folder finds it.
  await page
    .getByRole('button', { name: /^Folder/ })
    .first()
    .click();
  await page.getByRole('option', { name: /^Campaign \(1\)/ }).click();
  await expect(page.locator('.lib-item')).toHaveCount(1);

  // Deleting the folder keeps the prompt.
  await page
    .locator('.lib-side')
    .filter({ hasText: 'Folders' })
    .getByRole('button', { name: 'Delete' })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete it' }).click();
  await expect(page.locator('.lib-item')).toHaveCount(1);
  await expect(page.locator('.lib-item')).toContainText('The boxer');
});

test('renaming and deleting a saved prompt', async ({ page }) => {
  await forgeOne(page);
  await keep(page, 'First name');

  await page.goto('/library');
  await page.getByRole('button', { name: 'Rename' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Second name');
  await page.getByRole('dialog').getByRole('button', { name: 'Rename it' }).click();
  await expect(page.locator('.lib-item')).toContainText('Second name');

  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete it' }).click();
  await expect(page.getByRole('heading', { name: 'Nothing saved yet' })).toBeVisible();
});

test('a share link works with nobody signed in, and opens the prompt for the reader', async ({
  page,
}) => {
  await forgeOne(page, 'A dragon breathing fire');
  await page.getByRole('button', { name: 'Share a link' }).click();
  await expect(page.locator('.fg-toasts')).toContainText('link is copied');

  const url = await page.evaluate(() => navigator.clipboard.readText());
  expect(url).toContain('/p#');

  // A share carries the brief in the fragment, which no host ever receives.
  expect(new URL(url).pathname).toBe('/p');
  expect(new URL(url).search).toBe('');

  await page.goto(url);
  const shared = page.getByRole('region', { name: 'A shared prompt' });
  await expect(shared).toContainText('Shared with you');
  await expect(shared).toContainText('A dragon breathing fire');
  await expect(shared.getByRole('heading', { level: 1 })).toContainText('A dragon');

  // The prompt is forged for the reader rather than shipped as text.
  await expect(shared.getByRole('meter', { name: 'Prompt score' })).toBeVisible();
  await expect(shared).toContainText('Paste this into');

  /*
   * What Forge chose is shown, but not as controls. A read-only page must not draw something that
   * looks like it opens a field, because there is no brief here to open.
   */
  await expect(shared).toContainText('Forge chose the rest');
  await expect(shared.locator('.autofilled__open')).toHaveCount(0);
  await expect(shared.locator('.autofilled__value').first()).toBeVisible();
});

test('a reader can take a shared prompt into their own Build workspace', async ({ page }) => {
  await forgeOne(page, 'A cartographer who has lost the coast');
  await page.getByRole('button', { name: 'Share a link' }).click();
  const url = await page.evaluate(() => navigator.clipboard.readText());

  // A different browser entirely: nothing of the first one is carried over.
  await page.context().clearCookies();
  await page.goto(url);
  await page.getByRole('button', { name: 'Open this in Forge' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#field-subject textarea')).toHaveValue(
    'A cartographer who has lost the coast',
  );
});

test('a link with nothing in it says so rather than showing an empty page', async ({ page }) => {
  await page.goto('/p');
  await expect(page.getByRole('heading', { name: 'Nothing in this link' })).toBeVisible();

  await page.goto('/p#not-a-real-share');
  await expect(page.getByRole('heading', { name: 'Nothing in this link' })).toBeVisible();
});

test('a short link cannot be resolved by a build with no account service, and says so', async ({
  page,
}) => {
  await page.goto('/p#s=abcdefghij0123456789kl');
  await expect(
    page.getByRole('heading', { name: 'This link no longer opens anything' }),
  ).toBeVisible();
});

test('the account page is honest about there being no account service', async ({ page }) => {
  await page.goto('/account');
  await expect(
    page.getByRole('heading', { name: 'This build has no account service' }),
  ).toBeVisible();
  await expect(page.getByRole('main')).toContainText('kept in this browser');
  // Section 2 and CLAUDE.md: no billing, no plans, no pricing, no upsell, anywhere.
  const text = (await page.getByRole('main').textContent()) ?? '';
  for (const word of [
    'pricing',
    'plan',
    'plans',
    'upgrade',
    'subscription',
    'premium',
    'pro',
    'paid',
    'billing',
    'trial',
  ]) {
    expect(text, `the account page says "${word}"`).not.toMatch(new RegExp(`\\b${word}\\b`, 'i'));
  }
});

test('pins moved into the library, and the library can unpin', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Pin to the top of the list' }).click();
  await expect(page.getByRole('button', { name: 'Pinned to the top of the list' })).toBeVisible();

  await page.goto('/library');
  const pinned = page.locator('.lib-side').filter({ hasText: 'Pinned models' });
  await expect(pinned).not.toContainText('Nothing pinned');
  await pinned.getByRole('button', { name: 'Unpin' }).click();
  await expect(pinned).toContainText('Nothing pinned');
});

test('a recipe saved in the Recipes workspace appears in the library', async ({ page }) => {
  await page.goto('/');
  await page.locator('#field-subject textarea').fill('A retired boxer taping his hands');
  await page.goto('/recipes');
  await page.getByLabel('Name this recipe').fill('Basement documentary');
  await page.getByRole('button', { name: 'Subject' }).click();
  await page.getByRole('button', { name: 'Save the recipe' }).click();
  await expect(page.getByRole('region', { name: 'Saved recipes' })).toContainText(
    'Basement documentary',
  );

  await page.goto('/library');
  await expect(page.locator('.lib-side').filter({ hasText: 'Recipes' })).toContainText(
    'Basement documentary',
  );
});

test('the recipes phase 5 left in this browser are adopted, not lost', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'forge.recipes',
      JSON.stringify([
        {
          id: 'old',
          name: 'From before',
          model: 'midjourney',
          brief: { lens: '35mm' },
          locked: ['lens'],
        },
      ]),
    );
    localStorage.setItem('forge.pins', JSON.stringify(['veo']));
  });
  await page.goto('/library');
  await expect(page.locator('.lib-side').filter({ hasText: 'Recipes' })).toContainText(
    'From before',
  );
  await expect(page.locator('.lib-side').filter({ hasText: 'Pinned models' })).toContainText('Veo');
});

test('the new routes have no native select and do not scroll sideways on a phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 720 });
  for (const route of ['/library', '/account', '/p']) {
    await page.goto(route);
    expect(await page.locator('select').count(), `${route} has a native select`).toBe(0);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${route} scrolls sideways`).toBeLessThanOrEqual(0);
  }
});

test('the library is reachable by keyboard from the command palette', async ({ page }) => {
  await page.goto('/');
  await page.locator('body').click();
  await page.keyboard.press('ControlOrMeta+k');
  await page.keyboard.type('Library');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/library$/);
});
