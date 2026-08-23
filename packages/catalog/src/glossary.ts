import { FIELD_LIST } from './fields';
import { VOCAB_BANKS } from './ids';
import { MODELS } from './models';
import { settingTerm } from './models/shared';
import type { Explanation, Model, Term, TermId, VocabBank } from './types';

/**
 * Phase 1 lays the skeleton: one entry per term id the product can reach, so the coverage test has
 * something to enforce and no control can exist without an explanation slot. Phase 4 writes the
 * real copy and removes `stub`, at which point the coverage test stops accepting stubs.
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

function build(): Map<TermId, Term> {
  const terms = new Map<TermId, Term>();
  for (const f of FIELD_LIST) terms.set(f.term, stub(f.term, f.label));
  for (const bank of VOCAB_BANKS) {
    const id: TermId = `vocab.${bank}`;
    terms.set(id, stub(id, BANK_LABELS[bank]));
  }
  for (const m of MODELS) {
    for (const row of m.settings({}, 'advanced')) {
      const id = row.term ?? settingTerm(row.name);
      if (!terms.has(id)) terms.set(id, stub(id, row.name));
    }
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
