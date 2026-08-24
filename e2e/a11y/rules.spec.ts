import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** The three new surfaces of the compliance layer, in both themes. */

async function setTheme(page: Page, t: string): Promise<void> {
  await page.evaluate((theme) => {
    document.documentElement.setAttribute('data-theme', theme);
  }, t);
}

async function violations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return results.violations.map((v) => `${v.id}: ${v.help}`);
}

test.beforeEach(async ({ page }) => {
  // Theme is stamped directly here, without applyTheme's transition freeze, so scan with
  // reduced motion on: otherwise axe samples mid-transition and reports blended colours.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('forge.walkthrough', '"done"');
    localStorage.setItem('forge.invite-dismissed', 'true');
  });
});

for (const theme of ['light', 'dark']) {
  test(`the compliance pass and scaffold have no axe violations: ${theme}`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /^Model/ }).click();
    await page.getByRole('combobox').fill('GPT Image');
    await page.getByRole('option').first().click();
    await page.getByRole('radio', { name: 'Advanced' }).click();
    await page.locator('#field-subject textarea').fill('a fox in a forest');
    await page
      .locator('#field-ref input, #field-ref textarea')
      .first()
      .fill('in the style of Hayao Miyazaki');
    const pass = page.getByRole('region', { name: 'The compliance pass' });
    await pass.getByRole('button', { name: /worth knowing/ }).click();
    await pass.getByRole('button', { name: 'Describe it instead' }).click();
    await expect(pass).toContainText('Medium and substrate');
    await setTheme(page, theme);
    expect(await violations(page)).toEqual([]);
  });

  test(`the rights card has no axe violations: ${theme}`, async ({ page }) => {
    await page.goto('/');
    await page.locator('#field-subject textarea').fill('a quiet harbour at dawn');
    await page.getByRole('button', { name: 'Strike' }).click();
    const card = page.getByRole('region', { name: 'Who owns this' });
    await card.getByRole('button', { name: 'Who owns this, and what you can do with it' }).click();
    await setTheme(page, theme);
    expect(await violations(page)).toEqual([]);
  });

  test(`the refusal doctor has no axe violations: ${theme}`, async ({ page }) => {
    await page.goto('/doctor');
    await page.getByRole('tab', { name: 'Refusal Doctor' }).click();
    await page.locator('#refusal-error').fill('Support code: 61493863.');
    await page
      .locator('#refusal-prompt')
      .fill('A rubber duck on a white background. Soft studio light.');
    await page.getByRole('button', { name: 'Diagnose the refusal' }).click();
    const out = page.getByRole('region', { name: 'The refusal, diagnosed' });
    await out.getByRole('button', { name: 'Start the bisect' }).click();
    await setTheme(page, theme);
    expect(await violations(page)).toEqual([]);
  });
}
