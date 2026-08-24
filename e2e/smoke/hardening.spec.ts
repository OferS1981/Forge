import { expect, test } from '@playwright/test';

/**
 * Part C failure injection: the network dies mid-forge, storage is garbage, inputs are hostile.
 * Each one should degrade, not explode. These are permanent tests, not a one-off report, so a
 * regression in graceful degradation turns the build red like any other regression.
 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('forge.walkthrough', '"done"');
    localStorage.setItem('forge.invite-dismissed', 'true');
  });
});

test('the network dying mid-forge changes nothing: the whole engine is local', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.locator('#field-subject textarea').fill('a lighthouse in fog');
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Strike' }).click();
  const out = page.getByRole('region', { name: 'The forged prompt' });
  await expect(out).toBeVisible();
  await expect(out).toContainText('lighthouse');
  await context.setOffline(false);
});

test('corrupt localStorage in every forge key still boots the app', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('forge.model', '{{{{not json');
    localStorage.setItem('forge.mode', '[broken');
    localStorage.setItem('forge.briefs', 'null}');
    localStorage.setItem('forge.pins', '"a string where an array goes"');
    localStorage.setItem('forge.policy-notes', 'undefined');
    localStorage.setItem('forge.compliance-dismissed', '}{');
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Strike' })).toBeVisible();
  await page.locator('#field-subject textarea').fill('a lighthouse in fog');
  await page.getByRole('button', { name: 'Strike' }).click();
  await expect(page.getByRole('region', { name: 'The forged prompt' })).toBeVisible();
  expect(errors, 'uncaught exceptions with corrupt storage').toEqual([]);
});

test('corrupt session dismissals do not break the compliance pass', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('forge.compliance-dismissed', 'not-even-json');
  });
  await page.goto('/');
  await page.getByRole('button', { name: /^Model/ }).click();
  await page.getByRole('combobox').fill('Recraft');
  await page.getByRole('option').first().click();
  await page.locator('#field-subject textarea').fill('a ceramic mug');
  await expect(page.getByRole('region', { name: 'The compliance pass' })).toContainText(
    'worth knowing',
  );
});

test('fifty thousand characters in the Doctor diagnose without hanging', async ({ page }) => {
  await page.goto('/doctor');
  const junk = 'a cool picture of a robot, 8k, masterpiece, trending on artstation, '.repeat(750);
  expect(junk.length).toBeGreaterThan(50_000);
  await page.locator('#doctor-in').fill(junk);
  const started = Date.now();
  await page.getByRole('button', { name: 'Diagnose' }).click();
  await expect(page.getByRole('region', { name: 'The diagnosis' })).toContainText('Dead weight', {
    timeout: 15_000,
  });
  expect(Date.now() - started, 'diagnosis took too long').toBeLessThan(15_000);
});

test('a 40MB file that claims to be an image degrades to a warning, not a crash', async ({
  page,
}) => {
  await page.goto('/reverse');
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setInputFiles('input[type="file"]', {
    name: 'huge.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(40 * 1024 * 1024, 7),
  });
  // The failure is spoken, in the toast region, and the page stays alive.
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: /could not|not.*image|failed/i })
      .first(),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'Reverse', level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});

test('a text file wearing a .png name is refused politely', async ({ page }) => {
  await page.goto('/reverse');
  await page.setInputFiles('input[type="file"]', {
    name: 'liar.png',
    mimeType: 'image/png',
    buffer: Buffer.from('this is not an image at all, whatever the name says'),
  });
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: /could not|not.*image|failed/i })
      .first(),
  ).toBeVisible({ timeout: 10_000 });
});

test('the library page holds up with the account service absent', async ({ page }) => {
  // This build has no Supabase configured, which is exactly the degraded state: the local
  // library must be the whole product, with no error box and no dead buttons.
  await page.goto('/library');
  await expect(page.getByRole('heading', { name: 'Library', level: 1 })).toBeVisible();
  await expect(page.getByRole('main')).not.toContainText(/something went wrong|error/i);
});

test('a visited page answers offline, from the service worker', async ({ page, context }) => {
  // The worker's contract: what you used while online answers when you are not. Visit two pages,
  // cut the cord, and both still open, engine included.
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null || true);
  await page.goto('/doctor');
  await page.waitForLoadState('networkidle');
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await context.setOffline(true);
  await page.goto('/doctor');
  await expect(page.getByRole('tab', { name: 'Prompt Doctor' })).toBeVisible();
  await page.locator('#doctor-in').fill('a cool picture of a robot, 8k');
  await page.getByRole('button', { name: 'Diagnose' }).click();
  await expect(page.getByRole('region', { name: 'The diagnosis' })).toContainText('Dead weight');
  await context.setOffline(false);
});
