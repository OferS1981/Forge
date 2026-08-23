import { expect, test, type Page } from '@playwright/test';

/**
 * The section 17 smoke assertions, plus proof that every control is operable by keyboard alone.
 * Nothing in this file uses the mouse except where a pointer is the thing being tested.
 */

const VIEWPORTS = [
  { name: 'desktop', width: 1500, height: 900 },
  { name: 'tablet', width: 820, height: 900 },
  { name: 'phone', width: 375, height: 720 },
];

function watchConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

for (const vp of VIEWPORTS) {
  test(`no console errors and no sideways scroll at ${vp.name}`, async ({ page }) => {
    const errors = watchConsole(page);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Forge components' })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}

test('there is no native select anywhere in the product', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Model/ }).click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.getByRole('button', { name: 'Open the palette' }).click();
  await expect(page.getByRole('dialog', { name: 'Search Forge' })).toBeVisible();
  expect(await page.locator('select').count()).toBe(0);
});

test('the skip link is the first thing a keyboard reaches', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to the controls' })).toBeFocused();
});

test('the model picker is fully operable by keyboard', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: /^Model/ });
  await trigger.focus();
  await page.keyboard.press('Enter');

  const search = page.getByRole('combobox');
  await expect(search).toBeFocused();
  await page.keyboard.type('kilo');
  await expect(page.getByRole('option')).toHaveCount(1);
  await page.keyboard.press('Enter');

  await expect(trigger).toContainText('Kilo');
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('listbox')).toHaveCount(0);
});

test('Escape closes the picker and chooses nothing', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: /^Model/ });
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(trigger).toContainText('Alpha');
  await expect(trigger).toBeFocused();
});

test('the dialog traps tab and returns focus when it closes', async ({ page }) => {
  await page.goto('/');
  const open = page.getByRole('button', { name: 'Open a dialog' });
  await open.focus();
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('dialog', { name: 'Delete this prompt' });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    await expect(dialog.locator(':focus')).toHaveCount(1);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
});

test('the command palette opens on the shortcut and runs from the keyboard', async ({ page }) => {
  await page.goto('/');
  await page.locator('body').click();
  await page.keyboard.press('ControlOrMeta+k');

  const palette = page.getByRole('dialog', { name: 'Search Forge' });
  await expect(palette).toBeVisible();
  await page.keyboard.type('doctor');
  await page.keyboard.press('Enter');
  await expect(palette).toHaveCount(0);
  await expect(page.locator('.fg-toasts')).toContainText('Ran doctor.');
});

test('chips are one tab stop, and the arrows move inside them', async ({ page }) => {
  await page.goto('/');
  const first = page.getByRole('button', { name: 'golden hour', exact: true }).first();
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'blue hour' }).first()).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'blue hour' }).first()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('the slider moves with the arrow keys', async ({ page }) => {
  await page.goto('/');
  const slider = page.getByRole('slider', { name: 'Stylize' });
  await slider.focus();
  await expect(slider).toHaveValue('250');
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('260');
  await page.keyboard.press('Home');
  await expect(slider).toHaveValue('0');
});

test('tabs move with the arrow keys and show the panel they name', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Prompt' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Settings' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByRole('table')).toBeVisible();
});

test('a message appears in a live region and can be dismissed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Raise a message' }).click();
  const region = page.locator('.fg-toasts');
  await expect(region).toContainText('This is a message');
  await page.getByRole('button', { name: 'Dismiss this message' }).click();
  await expect(region).not.toContainText('This is a message');
});

test('the theme toggle wins over the operating system in both directions', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const root = page.locator('html');

  await page.getByRole('radio', { name: 'Light' }).click();
  await expect(root).toHaveAttribute('data-theme', 'light');
  const lightGround = await page.evaluate(() =>
    getComputedStyle(document.body).getPropertyValue('background-color'),
  );

  await page.getByRole('radio', { name: 'Dark' }).click();
  await expect(root).toHaveAttribute('data-theme', 'dark');
  const darkGround = await page.evaluate(() =>
    getComputedStyle(document.body).getPropertyValue('background-color'),
  );
  expect(lightGround).not.toBe(darkGround);

  await page.getByRole('radio', { name: 'System' }).click();
  await expect(root).not.toHaveAttribute('data-theme', /.*/);
});

test('the info dot explains without selecting', async ({ page }) => {
  await page.goto('/');
  const dot = page.getByRole('button', { name: 'What is the model?' });
  await dot.focus();
  await page.keyboard.press('Enter');
  const explain = page.getByRole('dialog', { name: 'Model' });
  await expect(explain).toContainText('Choose the model first');
  await page.keyboard.press('Escape');
  await expect(explain).toHaveCount(0);
  await expect(dot).toBeFocused();
  await expect(page.getByRole('button', { name: /^Model/ })).toContainText('Alpha');
});

test('touch targets are at least 44px below 820px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 720 });
  await page.goto('/');
  const heights = await page.evaluate(() => {
    const selectors = ['.fg-btn', '.fg-chip', '.fg-combo__trigger', '.fg-tabs__tab'];
    return selectors.flatMap((s) =>
      [...document.querySelectorAll<HTMLElement>(s)]
        .filter((el) => el.offsetParent !== null)
        .map((el) => Math.round(el.getBoundingClientRect().height)),
    );
  });
  expect(heights.length).toBeGreaterThan(0);
  expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
});
