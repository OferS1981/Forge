import { describe, expect, it } from 'vitest';
import { forge } from '../../src/engine';
import { MODELS } from '../../src/models/registry';
import { FULL } from '../fixtures/briefs';
import type { Mode } from '../../src/types';

/**
 * One committed snapshot per model per mode. A composer change that touches forty models becomes
 * forty reviewable diffs instead of one unreadable one.
 */
const MODES: Mode[] = ['simple', 'advanced'];

describe('golden files', () => {
  for (const m of MODELS) {
    for (const mode of MODES) {
      it(`${m.id} in ${mode} mode`, async () => {
        const result = forge(FULL[m.category], m, mode);
        await expect(JSON.stringify(result, null, 2) + '\n').toMatchFileSnapshot(
          `./__golden__/${m.id}.${mode}.json`,
        );
      });
    }
  }
});
