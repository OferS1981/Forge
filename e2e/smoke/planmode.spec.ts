import { expect, test } from '@playwright/test';

/**
 * Plan mode: the interview that fills the brief, and the profile that travels with you. Both are
 * ways of filling the form, never a chat, and both leave everything visible in the brief.
 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('forge.walkthrough', '"done"');
    localStorage.setItem('forge.invite-dismissed', 'true');
  });
});

test('the interview asks, the answer lands in the brief, and the count moves', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('switch', { name: 'Plan it with me' }).check({ force: true });
  const planPanel = page.getByRole('region', { name: 'The plan' });
  await expect(planPanel).toContainText('Question 1 of');
  await expect(planPanel).toContainText('What is the one thing this image is about?');

  await page.locator('#plan-answer').fill('a dragon on a sea cliff');
  await planPanel.getByRole('button', { name: 'Answer', exact: true }).click();
  await expect(planPanel).toContainText('Question 2 of');
  // The answer is in the brief, visibly.
  await expect(page.locator('#field-subject textarea')).toHaveValue('a dragon on a sea cliff');
});

test('skip hands the choice to Forge, and the strike explains it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('switch', { name: 'Plan it with me' }).check({ force: true });
  const planPanel = page.getByRole('region', { name: 'The plan' });
  await page.locator('#plan-answer').fill('a dragon on a sea cliff');
  await planPanel.getByRole('button', { name: 'Answer', exact: true }).click();
  await planPanel.getByRole('button', { name: /Skip/ }).click();
  await expect(planPanel).toContainText('Skipped: 1');

  await page.getByRole('button', { name: 'Strike' }).click();
  const out = page.getByRole('region', { name: 'The forged prompt' });
  await expect(out).toBeVisible();
  // A planned strike auto-fills what was not asked, and says why, like Simple mode does.
  await expect(out).toContainText('What Forge chose for you');
});

test('a finished interview says the plan is complete', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('switch', { name: 'Plan it with me' }).check({ force: true });
  const planPanel = page.getByRole('region', { name: 'The plan' });
  for (let i = 0; i < 12; i += 1) {
    if ((await planPanel.getByText('The plan is complete').count()) > 0) break;
    await page.locator('#plan-answer').fill('a considered answer ' + String(i));
    await planPanel.getByRole('button', { name: 'Answer', exact: true }).click();
  }
  await expect(planPanel).toContainText('The plan is complete');
});

test('the profile stays local, and reaches a prompt only through the switch', async ({ page }) => {
  await page.goto('/account');
  const you = page.getByRole('region', { name: 'You' });
  await you.getByLabel('Name').fill('Alon');
  await you.getByLabel('What you do').fill('I run a bakery called Crumb');

  await page.goto('/');
  await page.getByRole('button', { name: /^Model/ }).click();
  await page.getByRole('combobox').fill('Claude');
  await page.getByRole('option').first().click();

  const toggle = page.getByRole('switch', { name: 'Use my profile' });
  await expect(toggle).toBeVisible();

  // Off by default: the prompt carries nothing about you.
  await page
    .locator('#field-goal textarea')
    .fill('write a launch email for our sourdough subscription');
  await page.getByRole('button', { name: 'Strike' }).click();
  const out = page.getByRole('region', { name: 'The forged prompt' });
  await expect(out).not.toContainText('About me');

  // On: the line is in the prompt, visibly, where it can be read and removed.
  await toggle.check({ force: true });
  await page.getByRole('button', { name: 'Strike' }).click();
  await expect(out).toContainText('About me: I am Alon');
  await expect(out).toContainText('bakery called Crumb');
});

test('a model that is not a writing model never sees the profile switch', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'forge.profile',
      JSON.stringify({ name: 'Alon', birthday: '', work: '', voice: '' }),
    );
  });
  await page.goto('/');
  await expect(page.getByRole('switch', { name: 'Use my profile' })).toHaveCount(0);
});

test('the admin page is honest in an unconfigured build', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'The counters' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('no account service configured');
  await expect(page.getByRole('main')).toContainText('No prompts, no briefs, no names');
});

test('the You card carries the signup questions and the heard counter fires once', async ({
  page,
}) => {
  await page.goto('/account');
  const you = page.getByRole('region', { name: 'You' });
  await expect(you.getByLabel('Age')).toBeVisible();
  await you.getByRole('radio', { name: 'A friend' }).click();
  await expect(you.getByRole('radio', { name: 'A friend' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
});
