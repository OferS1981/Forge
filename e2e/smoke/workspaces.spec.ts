import { expect, test, type Page } from '@playwright/test';

/**
 * One test per workspace, which is what phase 5 is done by. Each drives the workspace the way a
 * person would and asserts the thing that workspace exists to do.
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

/** Write a brief in the Build workspace, which four of these tools work from. */
async function writeBrief(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('#field-subject textarea').fill('A retired boxer taping his hands');
  await page.locator('#field-setting input').fill('Basement gym at 6am');
}

test('Doctor: scores a bad prompt, names what is missing, and re-smiths it', async ({ page }) => {
  await page.goto('/doctor');
  await page
    .locator('#doctor-in')
    .fill('a cool picture of a robot in a city, 8k, masterpiece, very detailed');
  await page.getByRole('button', { name: 'Diagnose' }).click();

  const out = page.getByRole('region', { name: 'The diagnosis', exact: true });
  await expect(out).toContainText('Before');
  await expect(out).toContainText('After');

  // The eight axes are all reported.
  await expect(out.getByRole('meter', { name: 'Specificity' })).toBeVisible();
  await expect(out.getByRole('meter', { name: 'Signal purity' })).toBeVisible();

  // The dead-weight vocabulary is named, and the finding links into the glossary.
  await expect(out).toContainText('Dead weight');
  await expect(out.getByRole('link', { name: 'What this means' }).first()).toHaveAttribute(
    'href',
    /\/glossary#/,
  );

  // The improved prompt is the point, so it comes before the diagnosis, not after it.
  await expect(out).toContainText('re-smithed for');
  await expect(out).toContainText('The prompt');
  const promptTop = await out.getByRole('region', { name: 'The prompt' }).boundingBox();
  const diagnosisTop = await out.getByRole('region', { name: 'Diagnosis' }).boundingBox();
  expect(promptTop?.y ?? 0).toBeLessThan(diagnosisTop?.y ?? 0);
});

test('Doctor: the re-smithed prompt scores higher than the one that was pasted', async ({
  page,
}) => {
  await page.goto('/doctor');
  await page.locator('#doctor-in').fill('a robot, 8k, masterpiece, trending on artstation');
  await page.getByRole('button', { name: 'Diagnose' }).click();

  const scores = await page.locator('.beforeafter__n').allTextContents();
  const [before, after] = scores.map((s) => Number(s));
  expect(before).toBeLessThan(after ?? 0);
});

test('Reverse: measures a dropped image and says what it cannot see', async ({ page }) => {
  await page.goto('/reverse');

  // A 2 by 1 red PNG, so the measurements are predictable.
  await page.locator('input[type="file"]').setInputFiles({
    name: 'reference.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAFUlEQVR4nGP8z8Dwn4GKgImaho0aOGogAF3lAgFtQ0MRAAAAAElFTkSuQmCC',
      'base64',
    ),
  });

  await expect(page.locator('.ref__meta')).toContainText('2 by 1 px');
  await page.locator('#reverse-subject').fill('A retired boxer taping his hands');
  await page.getByRole('button', { name: 'Reverse the prompt' }).click();

  const out = page.getByRole('region', { name: 'The reversed prompt', exact: true });
  await expect(out).toContainText('What Forge could measure');
  await expect(out).toContainText('Exposure key');
  await expect(out).toContainText('Detail density');
  // The honesty line: it says what it cannot see rather than guessing.
  await expect(out).toContainText('is not something this page can see');
  await expect(out).toContainText('retired boxer taping his hands');
});

test('Reverse: reads a text file as a reference too', async ({ page }) => {
  await page.goto('/reverse');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('A lighthouse in a storm\nsecond line'),
  });
  await expect(page.locator('.reftexts')).toContainText('notes.txt');
  await page.getByRole('button', { name: 'Reverse the prompt' }).click();
  await expect(
    page.getByRole('region', { name: 'The reversed prompt', exact: true }),
  ).toContainText('lighthouse in a storm');
});

test('Match: splits a job that needs three kinds of model into three answers', async ({ page }) => {
  await page.goto('/match');
  await page
    .locator('#match-in')
    .fill('A 15-second vertical ad for a running shoe, with a voiceover and a music bed');
  await page.getByRole('button', { name: 'Find the tool' }).click();

  const out = page.getByRole('region', { name: 'The models for that job', exact: true });
  await expect(out).toContainText('This brief needs more than one tool');
  await expect(out).toContainText('For the video');
  await expect(out).toContainText('For the voice');
  await expect(out).toContainText('For the music');
  await expect(out.getByText('First choice').first()).toBeVisible();
});

test('Match: a single-medium job gets one list, and choosing opens it in Build', async ({
  page,
}) => {
  await page.goto('/match');
  await page.locator('#match-in').fill('A poster with the words NORTHBOUND SUPPLY CO on it');
  await page.getByRole('button', { name: 'Find the tool' }).click();

  const out = page.getByRole('region', { name: 'The models for that job', exact: true });
  await expect(out).not.toContainText('This brief needs more than one tool');
  await out.locator('.rec').first().click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('Cross-forge: the same brief in two grammars, with what was lost', async ({ page }) => {
  await writeBrief(page);
  await page.goto('/cross-forge');
  await expect(page.locator('.ws-note')).toContainText('Midjourney');

  await page.getByRole('button', { name: /^Cross-forge it to/ }).click();
  await page.getByRole('combobox').fill('Stable Diffusion');
  await page.getByRole('option').first().click();
  await page.getByRole('button', { name: 'Cross-forge', exact: true }).click();

  const out = page.getByRole('region', { name: 'The two prompts', exact: true });
  // Prose on one side, comma tags with a real negative field on the other.
  await expect(out).toContainText('Subject');
  await expect(out).toContainText('Positive prompt');
  await expect(out).toContainText('Negative prompt');
});

test('Cross-forge: says so when there is no brief to carry across', async ({ page }) => {
  await page.goto('/cross-forge');
  await expect(page.getByRole('region', { name: 'The two prompts', exact: true })).toContainText(
    'Write a brief in the Build workspace first',
  );
});

test('Batch: one brief, several models, scored side by side', async ({ page }) => {
  await writeBrief(page);
  await page.goto('/batch');

  await page.getByRole('button', { name: 'Ideogram', exact: true }).click();
  await page.getByRole('button', { name: 'Stable Diffusion', exact: true }).click();
  await page.getByRole('button', { name: 'Strike all' }).click();

  const out = page.getByRole('region', { name: 'The batch', exact: true });
  await expect(out).toContainText('Scores across the batch');
  await expect(out.locator('.batchscores li')).toHaveCount(2);
  await expect(out.locator('.batch__one')).toHaveCount(2);
});

test('Compare: marks what changed between two prompts and scores both', async ({ page }) => {
  await page.goto('/compare');
  await page.locator('#compare-a').fill('a photo of a boxer in a gym');
  await page
    .locator('#compare-b')
    .fill('a photo of a boxer in a gym, 85mm at f/2.8, softbox key camera-left');
  await page.getByRole('button', { name: 'Compare', exact: true }).click();

  const out = page.getByRole('region', { name: 'What changed', exact: true });
  await expect(out).toContainText('The difference');
  await expect(out.locator('.diff__added')).toContainText('85mm');
  await expect(out).toContainText('words added');

  const scores = await out.locator('.beforeafter__n').allTextContents();
  const [first, second] = scores.map((s) => Number(s));
  expect(second).toBeGreaterThan(first ?? 0);
});

test('Recipes: saves a brief as a template and loads it back', async ({ page }) => {
  await writeBrief(page);
  await page.goto('/recipes');

  await page.locator('#recipe-name').fill('Basement documentary');
  await page.getByRole('button', { name: 'Setting', exact: true }).click();
  await page.getByRole('button', { name: 'Save the recipe' }).click();

  const out = page.getByRole('region', { name: 'Saved recipes', exact: true });
  await expect(out).toContainText('Basement documentary');
  await expect(out).toContainText('1 field locked: Setting');

  await out.getByRole('button', { name: 'Use this recipe' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#field-setting input')).toHaveValue('Basement gym at 6am');
});

test('Recipes: deleting asks first, and is not a browser dialog', async ({ page }) => {
  await writeBrief(page);
  await page.goto('/recipes');
  await page.locator('#recipe-name').fill('Basement documentary');
  await page.getByRole('button', { name: 'Setting', exact: true }).click();
  await page.getByRole('button', { name: 'Save the recipe' }).click();

  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete this recipe' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Delete it' }).click();

  await expect(page.getByRole('region', { name: 'Saved recipes', exact: true })).toContainText(
    'No recipes yet',
  );
});

test('every workspace is reachable from the top bar or the tools row', async ({ page }) => {
  await page.goto('/');
  for (const [name, url] of [
    ['Doctor', /\/doctor$/],
    ['Reverse', /\/reverse$/],
    ['Match', /\/match$/],
  ] as const) {
    await page.getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(url);
  }
  for (const [name, url] of [
    ['Cross-forge', /\/cross-forge$/],
    ['Batch', /\/batch$/],
    ['Compare', /\/compare$/],
    ['Recipes', /\/recipes$/],
  ] as const) {
    await page.getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(url);
  }
});

test('the command palette reaches a workspace as well as a model', async ({ page }) => {
  await page.goto('/');
  await page.locator('body').click();
  await page.keyboard.press('ControlOrMeta+k');
  await page.keyboard.type('Reverse');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/reverse$/);
});

test('no workspace has a native select, and none scrolls sideways on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 720 });
  for (const route of [
    '/doctor',
    '/reverse',
    '/match',
    '/cross-forge',
    '/batch',
    '/compare',
    '/recipes',
  ]) {
    await page.goto(route);
    expect(await page.locator('select').count(), `${route} has a native select`).toBe(0);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${route} scrolls sideways`).toBeLessThanOrEqual(0);
  }
});
