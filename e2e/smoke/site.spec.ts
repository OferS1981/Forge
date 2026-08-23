import { expect, test, type Page } from '@playwright/test';

/**
 * The site, driven the way a person drives it. The section 17 assertions at three viewports, then
 * the path that matters: choose a model, write a brief, strike, read the prompt.
 */

const VIEWPORTS = [
  { name: 'desktop', width: 1500, height: 900 },
  { name: 'tablet', width: 820, height: 900 },
  { name: 'phone', width: 375, height: 720 },
];

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

function watchConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

async function fillBrief(page: Page): Promise<void> {
  await page.locator('#field-subject textarea').fill('A retired boxer taping his hands');
  await page.locator('#field-setting input').fill('Basement gym at 6am');
}

for (const vp of VIEWPORTS) {
  test(`no console errors and no sideways scroll at ${vp.name}`, async ({ page }) => {
    const errors = watchConsole(page);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');
    await fillBrief(page);
    await page.getByRole('button', { name: 'Strike' }).click();
    await expect(page.getByRole('meter', { name: 'Prompt score' })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}

test('the site has no native select anywhere', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'Advanced' }).click();
  await page.getByRole('button', { name: /^Model/ }).click();
  await expect(page.getByRole('listbox')).toBeVisible();
  expect(await page.locator('select').count()).toBe(0);
});

test('the skip link is the first thing a keyboard reaches', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to the brief' })).toBeFocused();
});

test('a brief can be forged with the keyboard alone', async ({ page }) => {
  await page.goto('/');
  await page.locator('#field-subject textarea').focus();
  await page.keyboard.type('A retired boxer taping his hands');
  await page.keyboard.press('Tab');
  await page.keyboard.type('Basement gym at 6am');

  await page.getByRole('button', { name: 'Strike' }).focus();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('meter', { name: 'Prompt score' })).toBeVisible();
  // The composer lower-cases the subject where it lands mid-sentence, so match without the case.
  await expect(page.getByLabel('The forged prompt')).toContainText(
    /retired boxer taping his hands/i,
  );
});

test('the prompt is written in the grammar of the model that is chosen', async ({ page }) => {
  await page.goto('/');
  await fillBrief(page);
  await page.getByRole('button', { name: 'Strike' }).click();
  const output = page.getByLabel('The forged prompt');
  // Midjourney is prose in named sections. The label is upper-cased by the stylesheet, not the DOM.
  await expect(output).toContainText('Subject');

  // A tag-grammar model writes the same brief as comma-separated tags with a real negative field.
  // Each model keeps its own brief, so the new one starts empty and is filled again here.
  await page.getByRole('button', { name: /^Model/ }).click();
  await page.getByRole('combobox').fill('Stable Diffusion');
  await page.getByRole('option').first().click();
  await fillBrief(page);
  await page.getByRole('button', { name: 'Strike' }).click();
  await expect(output).toContainText('Positive prompt');
  await expect(output).toContainText('Negative prompt');
});

test('Simple mode says what it chose, and each choice opens its field in Advanced', async ({
  page,
}) => {
  await page.goto('/');
  await fillBrief(page);
  await page.getByRole('button', { name: 'Strike' }).click();

  const chosen = page.getByRole('button', { name: '85mm portrait' });
  await expect(chosen).toBeVisible();
  await expect(page.getByLabel('The forged prompt')).toContainText(
    'it flatters faces and separates them from the background',
  );

  await chosen.click();
  await expect(page.getByRole('radio', { name: 'Advanced' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.locator('#field-lens')).toBeVisible();
});

test('the panel leads with the prompt you paste, not with a description of it', async ({
  page,
}) => {
  await page.goto('/');
  await fillBrief(page);
  await page.getByRole('button', { name: 'Strike' }).click();

  // The pasteable version is on the page, not hidden behind a button.
  const flat = page.locator('.prompt__flat');
  await expect(flat).toBeVisible();
  await expect(flat).toContainText(/retired boxer/i);
  await expect(page.getByText('Paste this into')).toBeVisible();

  // The named sections are the explanation, and start folded away.
  const sections = page.getByRole('button', { name: 'How it is put together' });
  await expect(sections).toHaveAttribute('aria-expanded', 'false');

  // And the record says plainly that it is not the thing to paste.
  await expect(page.getByRole('button', { name: 'Copy the whole record' })).toBeVisible();
  await expect(page.locator('.output__footnote')).toContainText('not the thing to paste');
});

test('Simple mode genuinely gives fewer decisions than Advanced', async ({ page }) => {
  await page.goto('/');
  await fillBrief(page);

  // Simple asks only what the person knows.
  const simpleFields = await page.locator('#brief .brief__field').count();
  await page.getByRole('button', { name: 'Strike' }).click();
  const simpleSettings = await page.locator('.fg-table tbody tr').count();
  const simpleVariations = await page.getByText('Three other directions').count();
  const simplePrompt = await page.locator('.prompt__flat').textContent();

  await page.getByRole('radio', { name: 'Advanced' }).click();
  const advancedFields = await page.locator('#brief .brief__field').count();
  await page.getByRole('button', { name: 'Strike' }).click();
  const advancedSettings = await page.locator('.fg-table tbody tr').count();

  expect(simpleFields, 'Simple asks fewer questions').toBeLessThan(advancedFields);
  expect(simpleSettings, 'Simple shows fewer settings').toBeLessThan(advancedSettings);
  expect(simpleVariations, 'Simple leaves out the other directions').toBe(0);
  await expect(page.getByText('Three other directions')).toBeVisible();

  // Fewer decisions, not a worse prompt: the rule from section 8. Simple fills the craft layer
  // itself, so its prompt is at least as long as the one Advanced produces from a bare brief.
  const advancedPrompt = await page.locator('.prompt__flat').textContent();
  expect((simplePrompt ?? '').length).toBeGreaterThan((advancedPrompt ?? '').length);
});

test('Advanced mode shows the whole settings table and the other directions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'Advanced' }).click();
  await fillBrief(page);
  await page.getByRole('button', { name: 'Strike' }).click();

  const output = page.getByLabel('The forged prompt');
  await expect(output).toContainText('Three other directions');
  await expect(output.getByRole('group', { name: /^Settings for/ })).toContainText('--stylize');
});

test('the brief is remembered per model and can be emptied', async ({ page }) => {
  await page.goto('/');
  await page.locator('#field-subject textarea').fill('A retired boxer taping his hands');

  await page.getByRole('button', { name: /^Model/ }).click();
  await page.getByRole('combobox').fill('Veo');
  await page.getByRole('option').first().click();
  await expect(page.locator('#field-subject textarea')).toHaveValue('');

  await page.getByRole('button', { name: /^Model/ }).click();
  await page.getByRole('combobox').fill('Midjourney');
  await page.getByRole('option').first().click();
  await expect(page.locator('#field-subject textarea')).toHaveValue(
    'A retired boxer taping his hands',
  );

  await page.getByRole('button', { name: 'Clear the brief' }).click();
  await expect(page.locator('#field-subject textarea')).toHaveValue('');
});

test('the brief changes shape with the model', async ({ page }) => {
  await page.goto('/');
  // An image model asks about the frame.
  await expect(page.locator('#field-medium')).toBeVisible();

  await page.getByRole('button', { name: /^Model/ }).click();
  await page.getByRole('combobox').fill('ElevenLabs');
  await page.getByRole('option').first().click();

  // A speech model asks for a script and a voice instead.
  await expect(page.locator('#field-script')).toBeVisible();
  await expect(page.locator('#field-medium')).toHaveCount(0);
});

test('the theme survives a reload without a flash of the wrong one', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.reload();
  // Set by the inline script before the first paint, not by React after it.
  const beforeHydration = await page.evaluate(() =>
    document.documentElement.getAttribute('data-theme'),
  );
  expect(beforeHydration).toBe('dark');
});

test('the command palette opens on the shortcut and switches model', async ({ page }) => {
  await page.goto('/');
  await page.locator('body').click();
  await page.keyboard.press('ControlOrMeta+k');
  await expect(page.getByRole('dialog', { name: 'Search Forge' })).toBeVisible();
  await page.keyboard.type('Ideogram');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: /^Model/ })).toContainText('Ideogram');
});

test('a model can be pinned and stays at the top of the rail', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Model/ }).click();
  await page.getByRole('combobox').fill('Veo');
  await page.getByRole('option').first().click();

  await page.getByRole('button', { name: 'Pin to the top of the list' }).click();
  await expect(page.getByRole('button', { name: 'Pinned to the top of the list' })).toBeVisible();

  await page.getByRole('button', { name: /^Model/ }).click();
  await expect(page.getByRole('group', { name: 'Pinned' })).toContainText('Veo');
});

test('striking an empty brief says what to do rather than failing quietly', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Strike' }).click();
  await expect(page.locator('.fg-toasts')).toContainText('Fill in at least the first field');
});

test('touch targets are at least 44px below 820px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 720 });
  await page.goto('/');
  const heights = await page.evaluate(() => {
    const selectors = ['.fg-btn', '.fg-chip', '.fg-combo__trigger', '.tab', '.fg-seg__opt'];
    return selectors.flatMap((s) =>
      [...document.querySelectorAll<HTMLElement>(s)]
        .filter((el) => el.offsetParent !== null)
        .map((el) => Math.round(el.getBoundingClientRect().height)),
    );
  });
  expect(heights.length).toBeGreaterThan(0);
  expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
});
