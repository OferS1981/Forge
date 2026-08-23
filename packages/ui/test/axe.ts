import axeCore, { type Result } from 'axe-core';

/**
 * jsdom cannot compute colour or layout, so the rules that need them are turned off here and
 * checked for real by Playwright against the gallery, in both themes and at three viewports.
 */
const OFF = new Set(['color-contrast', 'target-size']);

export async function axe(element: HTMLElement): Promise<Result[]> {
  const results = await axeCore.run(element, {
    rules: Object.fromEntries([...OFF].map((id) => [id, { enabled: false }])),
    resultTypes: ['violations'],
  });
  return results.violations;
}
