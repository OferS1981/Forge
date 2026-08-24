import { expect, test, type Page } from '@playwright/test';

/**
 * The Compliance and Rights layer: the pass that advises and never gates, the scaffold that turns
 * a name into dials, the rights card, and the Refusal Doctor. The one rule above all: nothing
 * here blocks a Strike, and nothing here helps anyone evade a filter.
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

/** The ref field lives in the craft layer, so the tests that type a name into it go Advanced. */
async function goAdvanced(page: Page): Promise<void> {
  await page.getByRole('radio', { name: 'Advanced' }).click();
}

test('a named artist raises the pass, and the Strike still works', async ({ page }) => {
  await page.goto('/');
  await pickModel(page, 'GPT Image');
  await goAdvanced(page);
  await page.locator('#field-subject textarea').fill('a fox in a forest');
  await page
    .locator('#field-ref input, #field-ref textarea')
    .first()
    .fill('in the style of Hayao Miyazaki');

  const pass = page.getByRole('region', { name: 'The compliance pass' });
  await expect(pass).toContainText('1 thing worth knowing before you paste');
  await pass.getByRole('button', { name: /1 thing worth knowing/ }).click();
  await expect(pass).toContainText('Advice, not a gate');
  await expect(pass).toContainText('one dial you cannot turn');

  // The pass never blocks: Strike forges regardless.
  await page.getByRole('button', { name: 'Strike' }).click();
  await expect(page.getByRole('region', { name: 'The forged prompt' })).toBeVisible();
});

test('the scaffold replaces the name with chosen attributes, and the finding clears', async ({
  page,
}) => {
  await page.goto('/');
  await pickModel(page, 'GPT Image');
  await goAdvanced(page);
  await page.locator('#field-subject textarea').fill('a fox in a forest');
  await page
    .locator('#field-ref input, #field-ref textarea')
    .first()
    .fill('in the style of Hayao Miyazaki');

  const pass = page.getByRole('region', { name: 'The compliance pass' });
  await pass.getByRole('button', { name: /worth knowing/ }).click();
  await pass.getByRole('button', { name: 'Describe it instead' }).click();
  await expect(pass).toContainText('Medium and substrate');
  await pass.getByLabel(/Medium and substrate/).fill('gouache on cold-press paper');
  await pass.getByLabel(/Palette/).fill('burnt sienna, sage and bone');
  await pass.getByRole('button', { name: /Use these 2 dials/ }).click();

  // The field now holds the attributes, and the finding is gone.
  await expect(page.locator('#field-ref input, #field-ref textarea').first()).toHaveValue(
    'gouache on cold-press paper, burnt sienna, sage and bone',
  );
  await expect(page.getByRole('region', { name: 'The compliance pass' })).toHaveCount(0);
});

test('a dismissal is remembered for the session', async ({ page }) => {
  await page.goto('/');
  await pickModel(page, 'Recraft');
  await page.locator('#field-subject textarea').fill('a ceramic mug on linen');

  const pass = page.getByRole('region', { name: 'The compliance pass' });
  await expect(pass).toContainText('worth knowing');
  await pass.getByRole('button', { name: /worth knowing/ }).click();
  await expect(pass).toContainText('depends on your tier');
  await pass.getByRole('button', { name: 'Dismiss' }).click();
  await expect(page.getByRole('region', { name: 'The compliance pass' })).toHaveCount(0);

  await page.reload();
  await page.locator('#field-subject textarea').fill('a ceramic mug on linen');
  await expect(page.getByRole('region', { name: 'The compliance pass' })).toHaveCount(0);
});

test('the rights card tells the recraft free-tier truth', async ({ page }) => {
  await page.goto('/');
  await pickModel(page, 'Recraft');
  await page.locator('#field-subject textarea').fill('a ceramic mug on linen');
  await page.getByRole('button', { name: 'Strike' }).click();

  const card = page.getByRole('region', { name: 'Who owns this' }).first();
  await card.getByRole('button', { name: 'Who owns this, and what you can do with it' }).click();
  await expect(card).toContainText('Ownership depends on your tier');
  await expect(card).toContainText('no commercial rights');
});

test('the refusal doctor reads a Vertex code and names the layer', async ({ page }) => {
  await page.goto('/doctor');
  await page.getByRole('tab', { name: 'Refusal Doctor' }).click();
  await page
    .locator('#refusal-error')
    .fill('The prompt could not be submitted. Support code: 58061214.');
  // A prompt is supplied, so the bisect WOULD show; the hard-line gate is what keeps it away.
  await page.locator('#refusal-prompt').fill('A child in a park. Golden light.');
  await page.getByRole('button', { name: 'Diagnose the refusal' }).click();

  const out = page.getByRole('region', { name: 'The refusal, diagnosed' });
  await expect(out).toContainText('58061214');
  await expect(out).toContainText('Child, blocked on the prompt');
  await expect(out).toContainText('hard line, not a phrasing problem');
  await expect(out).toContainText('Do not rephrase around this one');
  // And the bisect never offers itself against a hard-line category.
  await expect(out.getByRole('button', { name: 'Start the bisect' })).toHaveCount(0);
});

test('the refusal doctor is honest where there is no appeal path', async ({ page }) => {
  await page.goto('/doctor#refusal');
  await expect(page.getByRole('tab', { name: 'Refusal Doctor' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.getByRole('button', { name: /The model that refused/ }).click();
  await page.getByRole('combobox').fill('Runway');
  await page.getByRole('option').first().click();
  await page.locator('#refusal-error').fill('Your generation was flagged.');
  await page.getByRole('button', { name: 'Diagnose the refusal' }).click();

  const out = page.getByRole('region', { name: 'The refusal, diagnosed' });
  await expect(out).toContainText('unable to allowlist specific accounts or subject matters');
  await expect(out).toContainText('there is no exception path');
});

test('the bisect narrows to the trigger with no model access at all', async ({ page }) => {
  await page.goto('/doctor');
  await page.getByRole('tab', { name: 'Refusal Doctor' }).click();
  await page.locator('#refusal-error').fill('Blocked by safety system.');
  await page
    .locator('#refusal-prompt')
    .fill('A rubber duck on a white background. Soft studio light. Shot on a macro lens.');
  await page.getByRole('button', { name: 'Diagnose the refusal' }).click();

  const out = page.getByRole('region', { name: 'The refusal, diagnosed' });
  await out.getByRole('button', { name: 'Start the bisect' }).click();
  await expect(out).toContainText('Which one was refused?');
  // Keep reporting that the first half fails: three narrowings isolate the trigger words.
  for (let i = 0; i < 4; i += 1) {
    const fail = out.getByRole('button', { name: 'This half failed' }).first();
    if ((await out.getByTestId('bisect-done').count()) > 0) break;
    await fail.click();
  }
  await expect(out.getByTestId('bisect-done')).toContainText('A rubber');
  await expect(out.getByTestId('bisect-done')).toContainText('precise synonym');
});

test('the two new lessons load, and the blocked lesson links the refusal doctor', async ({
  page,
}) => {
  await page.goto('/learn/blocked');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('seven layers');
  await expect(page.getByRole('link', { name: 'Refusal Doctor' })).toHaveAttribute(
    'href',
    '/doctor#refusal',
  );
  await page.goto('/learn/style-without-naming');
  await expect(page.getByRole('main')).toContainText('nine independent controls');
});
