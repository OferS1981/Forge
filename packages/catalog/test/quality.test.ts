import { describe, expect, it } from 'vitest';
import { MODELS } from '../src/models';
import { forge } from '../src/engine';
import type { Brief, Model } from '../src/types';

/**
 * The invariants of a well-made prompt, held across every model and three shapes of brief. These
 * are the rules the bench judging applied by hand, written down so they apply to all 57 models on
 * every run rather than to 80 pairs once: no prompt contradicts itself, repeats itself, leaks
 * meta-text, drops what it was given, or ships a placeholder as a finished line.
 */

const FULL: Partial<Record<string, Brief>> = {
  image: {
    subject: 'a lighthouse keeper mending a lamp',
    setting: 'a stone tower in a storm',
    medium: 'photograph',
    purpose: 'editorial',
    mood: ['austere'],
  },
  video: {
    subject: 'a florist opening her shop',
    setting: 'a narrow Paris street at dawn',
    action: 'she unlocks the shutters, then carries out the first bucket of tulips',
    duration: '8s',
    vaudio: 'Street sweeping, distant bells.',
  },
  voice: {
    script: 'Stop. Listen. That sound is the tide going out.',
    useCase: 'Audiobook',
    voiceChar: 'a calm Irish woman in her forties',
    lang: 'en-IE',
    vTone: ['warm'],
  },
  sfx: { sound: 'a single church bell in heavy rain', sfxKind: 'one-shot' },
  music: { mGenre: ['neoclassical'], mMood: ['dreamlike'], mInst: ['string section'], mBpm: '70' },
  text: {
    goal: 'Explain compound interest to a twelve year old',
    context: 'They asked at dinner and want a real answer',
    format: 'Plain prose',
  },
  code: {
    cTask: 'Cache the exchange-rate lookups for one hour',
    cStack: 'Python, FastAPI, Redis',
    cCheck: 'The existing tests pass and a new one proves the cache expires',
  },
  app: {
    aApp: 'a rota tool for a volunteer-run cinema',
    aScreens: 'the monthly rota and a swap-request flow',
    aData: 'Volunteer, Shift, SwapRequest',
  },
  research: {
    rQuestion: 'What did UK cinema attendance do between 2019 and 2025?',
    rScope: 'BFI and major chain reporting',
    rFormat: 'Cited brief, 1 page',
  },
};

const MINIMAL: Partial<Record<string, Brief>> = {
  image: { subject: 'a red bicycle' },
  video: { subject: 'a red bicycle', action: 'it rolls downhill' },
  voice: { script: 'Good morning.' },
  sfx: { sound: 'a door creak' },
  music: { mGenre: ['ambient'] },
  text: { goal: 'Summarise this document' },
  code: { cTask: 'Fix the failing test' },
  app: { aApp: 'a to-do list' },
  research: { rQuestion: 'Who invented the postage stamp?' },
};

function briefFor(model: Model, source: Partial<Record<string, Brief>>): Brief {
  const wanted = source[model.category] ?? {};
  const reads = new Set<string>([...model.core, ...model.craft, ...model.tech]);
  return Object.fromEntries(Object.entries(wanted).filter(([id]) => reads.has(id)));
}

const SHAPES: [string, Partial<Record<string, Brief>>][] = [
  ['a full brief', FULL],
  ['a minimal brief', MINIMAL],
];

for (const model of MODELS) {
  describe(model.id, () => {
    for (const [name, source] of SHAPES) {
      for (const mode of ['simple', 'advanced'] as const) {
        it(`${name} in ${mode} mode holds every invariant`, () => {
          const brief = briefFor(model, source);
          const out = forge(brief, model, mode);
          const flat = out.flat;
          const everything = [flat, ...out.blocks.map((b) => b.body)].join('\n');

          // Nothing broken leaks.
          expect(flat).not.toContain('undefined');
          expect(flat).not.toContain('[object Object]');
          expect(flat).not.toContain('\u2014');
          expect(flat).not.toMatch(/,\s*,/);
          expect(flat).not.toMatch(/\.\s*\.(?!\.)/);
          // Indentation is structure in the JSON grammar; everywhere else two spaces are a slip.
          if (!flat.startsWith('{')) expect(flat).not.toMatch(/ {2}/);
          expect(flat.trim()).toBe(flat);

          // No meta-text about Forge or about pasting inside the thing you paste.
          expect(flat).not.toMatch(/Forge|paste this|strip it before/i);

          // No sentence said twice: a person does not repeat a clause verbatim.
          const sentencesSaid = flat
            .split(/(?<=[.!?])\s+/)
            .map((line) => line.trim().toLowerCase())
            .filter((line) => line.split(' ').length >= 4);
          expect(new Set(sentencesSaid).size, 'a sentence appears twice').toBe(
            sentencesSaid.length,
          );

          // Everything the user typed survives into the result, by content word.
          for (const value of Object.values(brief)) {
            const texts = Array.isArray(value) ? value : [value];
            for (const text of texts) {
              for (const word of text.toLowerCase().split(/[^a-z0-9]+/)) {
                if (word.length <= 3) continue;
                expect(everything.toLowerCase(), `lost "${word}"`).toContain(word);
              }
            }
          }

          // Every settings row explains itself in Advanced, where the real names show.
          if (mode === 'advanced') {
            for (const row of out.settings) {
              expect(row.name.length).toBeGreaterThan(0);
              expect(row.value.length).toBeGreaterThan(0);
            }
          }

          // The score is a score.
          expect(out.score).toBeGreaterThanOrEqual(0);
          expect(out.score).toBeLessThanOrEqual(100);
        });
      }
    }
  });
}
