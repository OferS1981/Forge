import { describe, expect, it } from 'vitest';
import { FIELD_LIST } from '../src/fields';
import { GLOSSARY, TERM_LIST, explain, hasTerm } from '../src/glossary';
import { MODELS, modelById } from '../src/models/registry';

/**
 * There is no such thing as an unexplained control in Forge. Phase 1 lays a stub entry per term so
 * the coverage above is real. Phase 4 writes the copy: as each term is written its `stub` flag goes
 * and the assertion below tightens on its own, until no stub is left.
 */

describe('glossary coverage', () => {
  it('explains every field', () => {
    for (const f of FIELD_LIST) expect(hasTerm(f.term), `${f.id} has no glossary term`).toBe(true);
  });

  it('explains every option', () => {
    for (const f of FIELD_LIST)
      for (const o of f.options ?? [])
        expect(o.term !== undefined && hasTerm(o.term), `${f.id}/${o.value} has no term`).toBe(
          true,
        );
  });

  it('explains every settings row on every model', () => {
    for (const m of MODELS)
      for (const row of m.settings({}, 'advanced'))
        expect(row.term !== undefined && hasTerm(row.term), `${m.id}/${row.name} has no term`).toBe(
          true,
        );
  });

  it('explains every aspect and duration option', () => {
    for (const m of MODELS)
      for (const o of [...(m.aspects ?? []), ...(m.durations ?? [])])
        expect(o.term !== undefined && hasTerm(o.term)).toBe(true);
  });

  it('returns an explanation for a known term and nothing for an unknown one', () => {
    const first = TERM_LIST[0];
    expect(first).toBeDefined();
    if (!first) return;
    const e = explain(first.id);
    expect(e?.label).toBe(first.label);
    expect(e?.stub).toBe(true);
    expect(explain('field.subject', { model: modelById('midjourney') })?.id).toBe('field.subject');
    expect(explain('setting.does-not-exist')).toBeUndefined();
  });

  it('marks an entry as a stub exactly while its copy is unwritten', () => {
    const all = [...GLOSSARY.values()];
    const stubs = all.filter((t) => t.stub);
    const written = all.filter((t) => t.stub !== true);
    expect(stubs.length + written.length).toBe(GLOSSARY.size);
    for (const t of stubs) {
      expect(t.short, `${t.id} is marked a stub but has copy`).toBe('Not written yet.');
      expect(t.label.length).toBeGreaterThan(0);
    }
    for (const t of written) {
      expect(t.short, `${t.id} is not marked a stub but has no copy`).not.toBe('Not written yet.');
      expect(t.what.length).toBeGreaterThan(0);
      expect(t.changes.length).toBeGreaterThan(0);
      expect(t.when.length).toBeGreaterThan(0);
    }
  });
});
