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

/**
 * Policy moves faster than model versions do, so the policy block gets a shorter window: 90 days
 * against the catalogue's 120. The other three blocks age at the catalogue rate.
 */
const POLICY_MAX_AGE_DAYS = 90;

describe('compliance staleness', () => {
  const now = Date.now();
  const age = (iso: string): number => Math.floor((now - Date.parse(iso)) / 86_400_000);

  for (const m of MODELS) {
    it(`${m.id}'s policy block was verified within ${String(POLICY_MAX_AGE_DAYS)} days`, () => {
      expect(Number.isNaN(Date.parse(m.policy.verifiedOn))).toBe(false);
      expect(
        age(m.policy.verifiedOn),
        `${m.id}'s policy block was last checked on ${m.policy.verifiedOn}. Policy moves monthly: re-check the vendor pages and bump verifiedOn.`,
      ).toBeLessThanOrEqual(POLICY_MAX_AGE_DAYS);
    });

    it(`${m.id}'s rights, provenance and refusal blocks were verified within ${MAX_AGE_LABEL} days`, () => {
      for (const block of [m.rights, m.provenance, m.refusal]) {
        expect(Number.isNaN(Date.parse(block.verifiedOn))).toBe(false);
        expect(age(block.verifiedOn), `${m.id}: a compliance block is stale.`).toBeLessThanOrEqual(
          MAX_AGE_DAYS,
        );
      }
    });
  }
});
