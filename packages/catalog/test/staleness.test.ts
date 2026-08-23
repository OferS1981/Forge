import { describe, expect, it } from 'vitest';
import { MODELS } from '../src/models/registry';

/**
 * The catalogue is the product, and this industry moves monthly. A model file that has not been
 * checked against its sources in 120 days turns the build red rather than lying quietly.
 */
const MAX_AGE_DAYS = 120;
const MAX_AGE_LABEL = String(MAX_AGE_DAYS);

describe('staleness', () => {
  const now = Date.now();

  for (const m of MODELS) {
    it(`${m.id} was verified within ${MAX_AGE_LABEL} days`, () => {
      const verified = Date.parse(m.verifiedOn);
      expect(Number.isNaN(verified)).toBe(false);
      const days = Math.floor((now - verified) / 86_400_000);
      expect(
        days,
        `${m.id} was last verified on ${m.verifiedOn}, ${String(days)} days ago. Re-check its sources and bump verifiedOn.`,
      ).toBeLessThanOrEqual(MAX_AGE_DAYS);
    });
  }
});
