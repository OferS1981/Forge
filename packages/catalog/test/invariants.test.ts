import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../src/categories';
import { FIELDS, SIMPLE_FIELDS, tierOf } from '../src/fields';
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

  it('marks every core field simple and every craft field advanced', () => {
    const core = new Set<FieldId>();
    for (const m of MODELS) for (const id of m.core) core.add(id);
    for (const id of core) expect(tierOf(id)).toBe('simple');
    expect(SIMPLE_FIELDS.has('aspect')).toBe(true);
    expect(SIMPLE_FIELDS.has('duration')).toBe(true);
    for (const m of MODELS)
      for (const id of m.craft) if (!core.has(id)) expect(tierOf(id)).toBe('advanced');
  });

  it('keeps a default model per category, and never a wildcard', () => {
    for (const c of CATEGORIES) {
      const m = modelById(c.defaultModel);
      expect(m.category).toBe(c.id);
      expect(m.wildcard).toBeUndefined();
    }
  });
});
