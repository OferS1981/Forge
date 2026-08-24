import { expect, test, type Page } from '@playwright/test';

/**
 * The first run and Learn. The phase is done by the first test in this file: a new visitor with
 * localStorage cleared completes the walkthrough by keyboard alone.
 */

/** Arrive as a first-time visitor, with nothing remembered. */
async function arriveFresh(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
}

test('a new visitor can complete the walkthrough by keyboard alone', async ({ page }) => {
  await arriveFresh(page);

  const mark = page.getByRole('dialog');
  await expect(mark).toContainText('Step 1 of 5');
  await expect(mark).toContainText('This is the rack');

  // Focus lands inside the mark when it opens, so Next is reachable without the mouse.
  for (const [step, title] of [
    [2, 'This is the brief'],
    [3, 'Strike'],
    [4, 'This is your prompt'],
    [5, 'These are the settings to match it'],
  ] as const) {
    await page.getByRole('button', { name: /^(Next|See the prompt|Start forging)$/ }).focus();
    await page.keyboard.press('Enter');
    await expect(mark).toContainText(`Step ${String(step)} of 5`);
    await expect(mark).toContainText(title);
  }

  await page.getByRole('button', { name: 'Start forging' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('the walkthrough fills a real brief and strikes it, so it points at something real', async ({
  page,
}) => {
  await arriveFresh(page);

  // Step two fills the example.
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('#field-subject textarea')).toHaveValue(
    'A retired boxer taping his hands',
  );

  // Step three strikes it, so step four has a prompt to point at.
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'See the prompt' }).click();
  await expect(page.getByRole('meter', { name: 'Prompt score' })).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('This is your prompt');
});

test('the walkthrough can be left at any point, and is not shown again', async ({ page }) => {
  await arriveFresh(page);
  await page.getByRole('button', { name: 'Skip the walkthrough' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Show me around' })).toBeVisible();
});

test('Escape leaves the walkthrough too', async ({ page }) => {
  await arriveFresh(page);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('the walkthrough resumes where it stopped', async ({ page }) => {
  await arriveFresh(page);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('dialog')).toContainText('Step 2 of 5');

  await page.reload();
  await expect(page.getByRole('dialog')).toContainText('Step 2 of 5');
});

test('it can be started again after it has been left', async ({ page }) => {
  await arriveFresh(page);
  await page.getByRole('button', { name: 'Skip the walkthrough' }).click();
  await page.getByRole('button', { name: 'Show me around' }).click();
  await expect(page.getByRole('dialog')).toContainText('Step 1 of 5');
});

test('the landing route invites a visitor to paste a prompt they already use', async ({ page }) => {
  await arriveFresh(page);
  await page.keyboard.press('Escape');

  const invite = page.getByRole('complementary', { name: 'A faster way to start' });
  await expect(invite).toContainText('Already have a prompt?');
  await invite.getByRole('link', { name: 'Paste it into the Doctor' }).click();
  await expect(page).toHaveURL(/\/doctor$/);
  await expect(page.getByRole('region', { name: 'The diagnosis' })).toContainText('No patient');
});

test('the invitation can be dismissed and stays dismissed', async ({ page }) => {
  await arriveFresh(page);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Dismiss this suggestion' }).click();
  await expect(page.getByRole('complementary', { name: 'A faster way to start' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('complementary', { name: 'A faster way to start' })).toHaveCount(0);
});

test('Learn lists eight lessons, and each one opens', async ({ page }) => {
  await page.goto('/learn');
  await expect(page.getByRole('heading', { name: 'Learn', level: 1 })).toBeVisible();
  const cards = page.locator('.lesson-card');
  await expect(cards).toHaveCount(8);

  for (let i = 0; i < 8; i++) {
    await page.goto('/learn');
    await cards.nth(i).getByRole('link').click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Load this into Build' })).toBeVisible();
  }
});

test('a lesson renders its markdown as real elements', async ({ page }) => {
  await page.goto('/learn/lens');
  const body = page.locator('.prose');
  await expect(body.locator('h2').first()).toBeVisible();
  await expect(body.locator('li').first()).toBeVisible();
  await expect(body.locator('blockquote')).toContainText('One focal length and one aperture');
  await expect(body.locator('code').first()).toBeVisible();
});

test('try it loads the lesson brief into Build, in Advanced mode', async ({ page }) => {
  await page.goto('/learn/lens');
  await page.getByRole('button', { name: 'Load this into Build' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('radio', { name: 'Advanced' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.locator('#field-subject textarea')).toHaveValue(
    'A retired boxer taping his hands',
  );
  await expect(page.getByRole('button', { name: '85mm portrait' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('a video lesson loads a video model and its motion brief', async ({ page }) => {
  await page.goto('/learn/motion');
  await page.getByRole('button', { name: 'Load this into Build' }).click();
  // "Model" also matches the Model settings disclosure, so this asks for the picker itself.
  await expect(page.locator('.fg-combo__trigger').first()).toContainText('Veo');
  await expect(page.locator('#field-action textarea')).toHaveValue(
    'He finishes taping, flexes the fist, then looks up at the camera',
  );
});

test('Learn is reachable from the top bar, and a lesson links to the next', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Learn', exact: true }).click();
  await expect(page).toHaveURL(/\/learn$/);

  await page.goto('/learn/lens');
  await page.getByRole('link', { name: /highest-yield/ }).click();
  await expect(page).toHaveURL(/\/learn\/lighting$/);
});
