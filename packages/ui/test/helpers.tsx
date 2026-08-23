import { render, type RenderResult } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { expect } from 'vitest';
import { axe } from './axe';

/** Render, and hand back a keyboard-only user. Every interaction test drives through this. */
export function setup(ui: ReactElement): RenderResult & { user: UserEvent } {
  const user = userEvent.setup();
  return { user, ...render(ui) };
}

/**
 * Narrow away a null without an assertion, and fail with a sentence that says what was missing.
 * A bare ! would be shorter and would tell nobody anything when it breaks.
 */
export function must<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined)
    throw new Error(`Expected to find ${what}, found none.`);
  return value;
}

export async function expectNoViolations(container: HTMLElement): Promise<void> {
  const violations = await axe(container);
  const summary = violations.map((v) => `${v.id}: ${v.help}`).join('\n');
  expect(summary).toBe('');
}
