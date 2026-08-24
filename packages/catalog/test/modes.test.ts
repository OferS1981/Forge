import { describe, expect, it } from 'vitest';
import { applyAutoFill, forge } from '../src/engine';
import { MODELS } from '../src/models/registry';
import { briefsFor } from './fixtures/briefs';
import type { Brief } from '../src/types';

/**
 * Simple mode is fewer decisions, never worse output. A Simple forge and an Advanced forge given
 * the same values must produce the identical prompt.
 */
describe('Simple and Advanced agree', () => {
  for (const m of MODELS) {
    for (const { name, brief } of briefsFor(m.category)) {
      it(`${m.id}: the ${name} brief forges the same either way once the values are explicit`, () => {
        const simple = forge(brief, m, 'simple');
        const { brief: filled } = applyAutoFill(brief, m, 'simple');
        const advanced = forge(filled, m, 'advanced');
        expect(simple.flat).toBe(advanced.flat);
        expect(simple.blocks).toEqual(advanced.blocks);
        expect(simple.negative).toBe(advanced.negative);
        expect(simple.score).toBe(advanced.score);
      });
    }
  }

  it('shows fewer settings rows in Simple mode', () => {
    for (const m of MODELS) {
      const simple = forge({}, m, 'simple');
      const advanced = forge({}, m, 'advanced');
      expect(simple.settings.length).toBeLessThanOrEqual(advanced.settings.length);
      expect(simple.settings.length).toBeLessThanOrEqual(3);
      for (const row of simple.settings) expect(row.tier).toBe('simple');
    }
  });

  it('never scores a Simple forge below the same brief in Advanced mode', () => {
    for (const m of MODELS) {
      for (const { brief } of briefsFor(m.category)) {
        const simple = forge(brief, m, 'simple');
        const advanced = forge(brief, m, 'advanced');
        expect(simple.score, `${m.id} scored worse in Simple mode`).toBeGreaterThanOrEqual(
          advanced.score,
        );
      }
    }
  });

  it('reports what it chose and why', () => {
    const image = MODELS.find((m) => m.id === 'midjourney');
    expect(image).toBeDefined();
    if (!image) return;
    const brief: Brief = { subject: 'A portrait of a founder', purpose: 'Documentary series' };
    const res = forge(brief, image, 'simple');
    expect(res.autoFilled.length).toBeGreaterThan(0);
    const lens = res.autoFilled.find((a) => a.field === 'lens');
    expect(lens?.value).toBe('85mm portrait');
    expect(lens?.why).toContain('faces');
    for (const a of res.autoFilled) {
      expect(a.value.length).toBeGreaterThan(0);
      expect(a.why.length).toBeGreaterThan(0);
    }
  });

  it('never overwrites something the user chose', () => {
    const image = MODELS.find((m) => m.id === 'midjourney');
    expect(image).toBeDefined();
    if (!image) return;
    const res = forge({ subject: 'A portrait', lens: '14mm ultra-wide' }, image, 'simple');
    expect(res.flat).toContain('14mm ultra-wide');
    expect(res.autoFilled.find((a) => a.field === 'lens')).toBeUndefined();
  });

  it('leaves the brief alone in Advanced mode', () => {
    for (const m of MODELS) {
      const res = forge({}, m, 'advanced');
      expect(res.autoFilled).toEqual([]);
    }
  });
});

/**
 * Pro is Advanced plus the exclusion fields and nothing else at the engine: the same brief
 * composes to the same prompt, no auto-fill, and every settings row Advanced shows, Pro shows.
 */
describe('Pro and Advanced agree at the engine', () => {
  it('composes identically and fills nothing in', () => {
    for (const m of MODELS) {
      for (const { brief } of briefsFor(m.category)) {
        const pro = forge(brief, m, 'pro');
        const advanced = forge(brief, m, 'advanced');
        expect(pro.flat).toBe(advanced.flat);
        expect(pro.blocks).toEqual(advanced.blocks);
        expect(pro.settings).toEqual(advanced.settings);
        expect(pro.autoFilled).toEqual([]);
      }
    }
  });
});
