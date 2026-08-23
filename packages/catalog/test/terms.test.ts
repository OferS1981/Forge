import { describe, expect, it } from 'vitest';
import { FIELD_LIST } from '../src/fields';
import { GLOSSARY, TERM_LIST, explain, hasTerm } from '../src/glossary';
import { MODELS, modelById } from '../src/models/registry';

/**
 * There is no such thing as an unexplained control in Forge. Phase 1 laid a stub entry per term so
 * the coverage below was real from the start. Phase 4 wrote the copy, and this suite now refuses a
 * stub outright: adding a field, an option or a settings row without an explanation fails the
 * build, which is what stops the explain layer rotting.
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
    expect(e?.stub).toBe(false);
    expect(explain('field.subject', { model: modelById('midjourney') })?.id).toBe('field.subject');
    expect(explain('setting.does-not-exist')).toBeUndefined();
  });

  it('has no stubs left anywhere', () => {
    const stubs = [...GLOSSARY.values()].filter((t) => t.stub === true);
    expect(stubs.map((t) => t.id)).toEqual([]);
  });

  it('says what every term is, what it changes and when to use it', () => {
    const written = [...GLOSSARY.values()];
    expect(written.length).toBe(GLOSSARY.size);
    for (const t of written) {
      expect(t.short, `${t.id} has no copy`).not.toBe('Not written yet.');
      expect(t.label.length, `${t.id} has no label`).toBeGreaterThan(0);
      expect(t.what.length, `${t.id} does not say what it is`).toBeGreaterThan(0);
      expect(t.changes.length, `${t.id} does not say what it changes`).toBeGreaterThan(0);
      expect(t.when.length, `${t.id} does not say when to use it`).toBeGreaterThan(0);
      // The house voice: no em dashes anywhere a user can read.
      for (const line of [t.short, t.what, t.changes, t.when])
        expect(line, `${t.id} uses an em dash`).not.toMatch(/\u2014/);
    }
  });
});
