import { expect, test } from '@playwright/test';

/**
 * Section 19's bar for this phase: every test still passes with the assistant forced to null. That
 * is the state of the whole rest of the suite, which never stores a key, so these tests cover the
 * part that is specific: that the off state is honest and complete, that the key never leaves the
 * browser, and that turning it on changes only what it says it changes.
 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('forge.walkthrough', '"done"');
    localStorage.setItem('forge.invite-dismissed', 'true');
  });
});

test('with no key, the Doctor still diagnoses and says the diagnosis needs no assistant', async ({
  page,
}) => {
  await page.goto('/doctor');
  await page.locator('#doctor-in').fill('a cool picture of a robot, 8k, masterpiece');
  await page.getByRole('button', { name: 'Diagnose' }).click();

  const out = page.getByRole('region', { name: 'The diagnosis' });
  await expect(out).toContainText('Dead weight');
  await expect(out).toContainText('A second opinion');
  await expect(out).toContainText('written by Forge itself and does not need one');
  // Not an error, not an advert, and no button that would fail if pressed.
  await expect(out.getByRole('button', { name: 'Ask the assistant' })).toHaveCount(0);
});

test('with no key, Reverse still measures and says what it cannot see', async ({ page }) => {
  await page.goto('/reverse');
  const out = page.getByRole('main');
  await expect(out).toContainText('What the picture is of');
  await expect(out).toContainText('a browser cannot see it');
  await expect(out.getByRole('link', { name: 'add a key' })).toBeVisible();
});

test('the key panel says where the key goes, and stores nothing until asked', async ({ page }) => {
  await page.goto('/assistant');
  await expect(page.getByRole('heading', { name: 'No key stored' })).toBeVisible();
  const main = page.getByRole('main');
  await expect(main).toContainText('never leaves this browser');
  await expect(main).toContainText('It never writes a prompt');
  await expect(main).toContainText('Nothing in Forge stops working without it');

  // Section 2 and CLAUDE.md again: nothing here is a plan or a price.
  const text = (await main.textContent()) ?? '';
  for (const word of ['pricing', 'plan', 'upgrade', 'subscription', 'premium', 'paid', 'billing']) {
    expect(text, `the assistant page says "${word}"`).not.toMatch(new RegExp(`\\b${word}\\b`, 'i'));
  }
  expect(await page.evaluate(() => localStorage.getItem('forge.assistant-key'))).toBeNull();
});

test('a key that is obviously not one is refused, and nothing is stored', async ({ page }) => {
  await page.goto('/assistant');
  await page.getByLabel('API key').fill('hunter2');
  await page.getByRole('button', { name: 'Store the key here' }).click();
  await expect(page.locator('.acct__problem')).toContainText('does not look like a key');
  expect(await page.evaluate(() => localStorage.getItem('forge.assistant-key'))).toBeNull();
});

test('a stored key is shown by its last four characters only, and one click deletes it', async ({
  page,
}) => {
  await page.goto('/assistant');
  await page.getByLabel('API key').fill('sk-ant-this-is-not-a-real-key-wxyz');
  await page.getByRole('button', { name: 'Store the key here' }).click();

  await expect(page.getByRole('heading', { name: /Using the key ending wxyz/ })).toBeVisible();
  const shown = (await page.getByRole('main').textContent()) ?? '';
  expect(shown, 'the whole key is on the screen').not.toContain('sk-ant-this-is-not-a-real-key');

  await page.getByRole('button', { name: 'Delete the key from this browser' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete it' }).click();
  await expect(page.getByRole('heading', { name: 'No key stored' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('forge.assistant-key'))).toBeNull();
});

test('the key is never put in a link, on any route', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('forge.assistant-key', 'sk-ant-this-is-not-a-real-key-wxyz');
  });
  for (const route of ['/', '/doctor', '/reverse', '/assistant', '/library']) {
    await page.goto(route);
    expect(page.url(), `${route} put the key in the address`).not.toContain('sk-ant');
    const links = await page
      .locator('a[href]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''));
    for (const href of links) expect(href).not.toContain('sk-ant');
  }
});

test('with a key stored, the two surfaces offer the assistant and nothing else changes', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('forge.assistant-key', 'sk-ant-this-is-not-a-real-key-wxyz');
  });

  await page.goto('/doctor');
  await page.locator('#doctor-in').fill('a cool picture of a robot, 8k, masterpiece');
  await page.getByRole('button', { name: 'Diagnose' }).click();
  const out = page.getByRole('region', { name: 'The diagnosis' });
  // The engine's diagnosis is identical either way. That is the point of the phase.
  await expect(out).toContainText('Dead weight');
  await expect(out.getByRole('button', { name: 'Ask the assistant' })).toBeVisible();

  await page.goto('/reverse');
  await expect(
    page.getByRole('button', { name: /Drop a picture first|describe it/ }),
  ).toBeVisible();
});

test('the assistant page is reachable and does not scroll sideways on a phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 720 });
  await page.goto('/');
  await page.getByRole('link', { name: 'Assistant', exact: true }).click();
  await expect(page).toHaveURL(/\/assistant$/);
  expect(await page.locator('select').count()).toBe(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
