import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../src/categories';
import { FIELDS, PRO_FIELDS, SIMPLE_FIELDS, tierOf } from '../src/fields';
import { CATEGORY_IDS, FIELD_IDS, MODEL_IDS } from '../src/ids';
import { MODELS, modelById, modelsIn } from '../src/models/registry';
import { COMPOSERS } from '../src/compose';
import { VOCAB } from '../src/vocab';
import type { FieldId } from '../src/types';

describe('catalogue invariants', () => {
  it('holds 57 models across 9 categories', () => {
    expect(MODELS).toHaveLength(57);
    expect(CATEGORIES).toHaveLength(9);
  });

  it('has unique, slug-shaped ids that match the id registry', () => {
    const ids = MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...MODEL_IDS].sort());
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('ends every category with exactly one wildcard', () => {
    for (const c of CATEGORY_IDS) {
      const list = modelsIn(c);
      expect(list.length).toBeGreaterThan(0);
      const wild = list.filter((m) => m.wildcard);
      expect(wild).toHaveLength(1);
      expect(list[list.length - 1]?.wildcard).toBe(true);
    }
  });

  it('gives every model a composer, a source and a verified date', () => {
    for (const m of MODELS) {
      expect(COMPOSERS[m.grammar]).toBeTypeOf('function');
      expect(m.sources.length).toBeGreaterThan(0);
      for (const s of m.sources) expect(s.url).toMatch(/^https:\/\//);
      expect(m.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(m.tags.length).toBeGreaterThanOrEqual(2);
      expect(m.tags.length).toBeLessThanOrEqual(4);
      expect(m.blurb.length).toBeGreaterThan(0);
    }
  });

  it('gives wildcards no maker and everything else one', () => {
    for (const m of MODELS) {
      if (m.wildcard) expect(m.maker).toBeUndefined();
      else expect(m.maker).toBeTruthy();
    }
  });

  it('only names fields that exist', () => {
    const known = new Set<string>(FIELD_IDS);
    for (const m of MODELS)
      for (const id of [...m.core, ...m.craft, ...m.tech]) expect(known.has(id)).toBe(true);
  });

  it('points every recommendation at a real model', () => {
    for (const m of MODELS) {
      for (const p of m.pairsWith) expect(modelById(p.model).id).toBe(p.model);
      for (const r of m.betterFor) {
        expect(modelById(r.model).id).toBe(r.model);
        expect(r.model).not.toBe(m.id);
      }
    }
  });

  it('keeps aspect and duration options unique and non-empty', () => {
    for (const m of MODELS) {
      for (const list of [m.aspects, m.durations]) {
        if (!list) continue;
        const values = list.map((o) => o.value);
        expect(new Set(values).size).toBe(values.length);
        for (const v of values) expect(v.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps every field option inside its vocabulary bank', () => {
    for (const id of FIELD_IDS) {
      const f = FIELDS[id];
      if (!f.options?.length) continue;
      const term = f.options[0]?.term ?? '';
      if (!term.startsWith('vocab.')) continue;
      const bank = term.slice('vocab.'.length) as keyof typeof VOCAB;
      expect(f.options.map((o) => o.value)).toEqual([...VOCAB[bank]]);
    }
  });

  it('marks every core field simple, craft advanced, and only the exclusions pro', () => {
    const core = new Set<FieldId>();
    for (const m of MODELS) for (const id of m.core) core.add(id);
    for (const id of core) expect(tierOf(id)).toBe('simple');
    expect(SIMPLE_FIELDS.has('aspect')).toBe(true);
    expect(SIMPLE_FIELDS.has('duration')).toBe(true);
    for (const m of MODELS)
      for (const id of m.craft)
        if (!core.has(id)) expect(tierOf(id)).toBe(PRO_FIELDS.has(id) ? 'pro' : 'advanced');
    // The pro tier is exactly the exclusion fields: nothing else may creep in.
    for (const id of PRO_FIELDS) expect(core.has(id)).toBe(false);
  });

  it('keeps a default model per category, and never a wildcard', () => {
    for (const c of CATEGORIES) {
      const m = modelById(c.defaultModel);
      expect(m.category).toBe(c.id);
      expect(m.wildcard).toBeUndefined();
    }
  });
});

/**
 * The compliance layer's own invariants. A wildcard says "it depends" and needs no sources; an
 * unverified block admits it has none; everything else cites a fetched page. And the three traps
 * the manual says will bite users are pinned here so no edit can quietly soften them.
 */
describe('compliance blocks', () => {
  const isWildcard = (id: string): boolean => id.startsWith('generic-') || id === 'deepresearch';

  it('every verified, non-wildcard block cites at least one source with a well-formed URL', () => {
    for (const m of MODELS) {
      for (const [name, block] of [
        ['policy', m.policy],
        ['rights', m.rights],
        ['provenance', m.provenance],
        ['refusal', m.refusal],
      ] as const) {
        if (isWildcard(m.id) || block.unverified === true) continue;
        expect(
          block.sources.length,
          `${m.id} ${name} has no sources yet claims verification`,
        ).toBeGreaterThan(0);
        for (const src of block.sources)
          expect(() => new URL(src.url), `${m.id} ${name}: ${src.url}`).not.toThrow();
      }
    }
  });

  it('an unverified block never pretends: empty sources go with the badge, not without it', () => {
    for (const m of MODELS) {
      if (isWildcard(m.id)) continue;
      for (const block of [m.policy, m.rights, m.provenance, m.refusal]) {
        if (block.sources.length === 0)
          expect(block.unverified, `${m.id} has a sourceless block without the badge`).toBe(true);
      }
    }
  });

  it('the recraft free-tier trap survives into the data', () => {
    const recraft = MODELS.find((m) => m.id === 'recraft');
    expect(recraft?.rights.outputOwner).toBe('tier-dependent');
    expect(recraft?.rights.ownershipNote).toContain('no commercial rights');
    expect(recraft?.rights.commercialUse).toContain('free tier');
  });

  it('the suno retroactive download caps survive into the data', () => {
    const suno = MODELS.find((m) => m.id === 'suno');
    expect(suno?.rights.exportEntitlement).toContain('retroactive');
    expect(suno?.rights.exportEntitlement).toContain('3 September 2026');
    expect(suno?.policy.artistNames).toBe('stripped');
  });

  it('the google child-generation regional wall survives into the data', () => {
    for (const id of ['veo', 'nanobanana'] as const) {
      const m = MODELS.find((x) => x.id === id);
      const wall = m?.policy.regionalLimits.find((r) => r.regions.includes('EU'));
      expect(wall, `${id} lost the EU/UK regional rule`).toBeDefined();
      expect(wall?.rule).toContain('allow_all');
      expect(m?.policy.minors).toContain('EU, UK');
    }
  });

  it("the manual's own uncertainty list wears the badge", () => {
    expect(MODELS.find((m) => m.id === 'flux')?.policy.unverified).toBe(true);
    expect(MODELS.find((m) => m.id === 'leonardo')?.rights.unverified).toBe(true);
    expect(MODELS.find((m) => m.id === 'suno')?.rights.unverified).toBe(true);
  });
});
