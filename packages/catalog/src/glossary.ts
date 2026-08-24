import { FIELD_LIST } from './fields';
import { CONCEPT_COPY } from './glossary/concepts';
import { FIELD_COPY } from './glossary/fields';
import { SETTING_COPY } from './glossary/settings';
import { VOCAB_COPY } from './glossary/vocab';
import { VOCAB_BANKS } from './ids';
import { MODELS } from './models';
import { settingTerm } from './models/shared';
import type { Explanation, Model, Term, TermId, VocabBank } from './types';

/**
 * Every control in Forge can say what it is, what it changes and when to reach for it. Phase 1 laid
 * a stub per term id so the coverage test was real from the start; phase 4 wrote the copy. A stub
 * that survives now fails the build, which is what stops the explain layer rotting.
 */
const PLACEHOLDER = 'Not written yet.';

const BANK_LABELS: Record<VocabBank, string> = {
  shot: 'Shot and angle',
  lens: 'Lens',
  aperture: 'Aperture',
  light: 'Lighting',
  film: 'Film stock',
  grade: 'Colour grade',
  medium: 'Medium',
  comp: 'Composition',
  mood: 'Mood',
  camMove: 'Camera move',
  pacing: 'Pacing',
  motion: 'Motion in frame',
  vocalTone: 'Vocal tone',
  vocalTexture: 'Vocal texture',
  vocalArch: 'Voice archetype',
  sfxKind: 'Sound effect kind',
  room: 'Space',
  mic: 'Capture',
  genre: 'Genre',
  instruments: 'Instrumentation',
  production: 'Production',
  llmFormat: 'Output format',
  llmRole: 'Role',
  banned: 'Dead-weight vocabulary',
};

function stub(id: TermId, label: string): Term {
  return {
    id,
    label,
    short: PLACEHOLDER,
    what: PLACEHOLDER,
    changes: PLACEHOLDER,
    when: PLACEHOLDER,
    stub: true,
  };
}

interface Copy {
  short: string;
  what: string;
  changes: string;
  when: string;
  range?: string;
  example?: { low: string; high: string };
}

function term(id: TermId, label: string, copy: Copy | undefined): Term {
  if (!copy) return stub(id, label);
  const t: Term = {
    id,
    label,
    short: copy.short,
    what: copy.what,
    changes: copy.changes,
    when: copy.when,
  };
  if (copy.range !== undefined) t.range = copy.range;
  if (copy.example !== undefined) t.example = copy.example;
  return t;
}

function build(): Map<TermId, Term> {
  const terms = new Map<TermId, Term>();
  for (const f of FIELD_LIST) terms.set(f.term, term(f.term, f.label, FIELD_COPY[f.id]));
  for (const bank of VOCAB_BANKS) {
    const id: TermId = `vocab.${bank}`;
    terms.set(id, term(id, BANK_LABELS[bank], VOCAB_COPY[bank]));
  }
  for (const m of MODELS) {
    for (const row of m.settings({}, 'advanced')) {
      const id = row.term ?? settingTerm(row.name);
      if (terms.has(id)) continue;
      terms.set(id, term(id, row.name, SETTING_COPY[id.replace('setting.', '')]));
    }
  }
  for (const [slug, copy] of Object.entries(CONCEPT_COPY)) {
    const id: TermId = `concept.${slug}`;
    terms.set(id, term(id, copy.label, copy));
  }
  return terms;
}

export const GLOSSARY: ReadonlyMap<TermId, Term> = build();

export const TERM_LIST: readonly Term[] = [...GLOSSARY.values()];

export function hasTerm(id: TermId): boolean {
  return GLOSSARY.has(id);
}

/** What a term means, with the model-specific override when there is one. */
export function explain(id: TermId, context?: { model?: Model }): Explanation | undefined {
  const term = GLOSSARY.get(id);
  if (!term) return undefined;
  const model = context?.model;
  const scoped = model && term.models?.includes(model.id) ? { ...term, when: term.when } : term;
  return { ...scoped, stub: term.stub === true };
}
