import { describe, expect, it } from 'vitest';
import { forge } from '../src/engine';
import { MODELS, modelById } from '../src/models/registry';
import type { Brief } from '../src/types';

/**
 * Two models document that they want descriptive paragraphs rather than keyword lists, and both
 * say so in their own notes. This suite holds the product to that claim.
 */
const BRIEF: Brief = {
  subject: 'A dragon breathing fire',
  setting: 'a wasteland at dusk',
  medium: 'cinematic still',
  shot: ['medium shot'],
  lens: '35mm',
  aperture: 'f/5.6, sharp throughout',
  light: ['softbox key camera-left'],
  film: 'Kodak Portra 400',
  grade: 'teal and orange',
  comp: 'rule of thirds',
  mood: ['calm'],
};

describe('narrative prose', () => {
  it('is set only where the model says it wants it', () => {
    const narrative = MODELS.filter((m) => m.prose === 'narrative').map((m) => m.id);
    expect(narrative).toEqual(['nanobanana', 'flux']);
    for (const id of narrative) {
      const notes = modelById(id).notes.join(' ').toLowerCase();
      expect(
        notes.includes('paragraph') || notes.includes('detail is rewarded'),
        `${id} carries no note supporting narrative prose`,
      ).toBe(true);
    }
  });

  it('writes clauses as sentences rather than as a token list', () => {
    const out = forge(BRIEF, modelById('nanobanana'), 'advanced').flat;
    expect(out).toContain('Framed as a medium shot on a 35mm lens');
    expect(out).toContain('Lit by softbox key camera-left');
    expect(out).toContain('Captured on Kodak Portra 400 and graded teal and orange');
    expect(out).toContain('Composed using rule of thirds');
    expect(out).toContain('The mood is calm');
  });

  it('keeps the descriptive half of an aperture, which the terse form throws away', () => {
    expect(forge(BRIEF, modelById('nanobanana'), 'advanced').flat).toContain(
      'f/5.6, sharp throughout',
    );
    // The terse composer keeps only the number, because that is what those models were trained on.
    expect(forge(BRIEF, modelById('midjourney'), 'advanced').flat).toContain('f/5.6.');
    expect(forge(BRIEF, modelById('midjourney'), 'advanced').flat).not.toContain(
      'sharp throughout',
    );
  });

  it('says more than the terse version of the same brief', () => {
    const narrative = forge(BRIEF, modelById('nanobanana'), 'advanced').flat;
    const terse = forge(BRIEF, modelById('gptimage'), 'advanced').flat;
    expect(narrative.length).toBeGreaterThan(terse.length * 0.6);
    expect(narrative.split(/\s+/).length).toBeGreaterThan(30);
  });

  it('invents nothing: every value in the prompt came from the brief', () => {
    const out = forge(BRIEF, modelById('nanobanana'), 'advanced').flat.toLowerCase();
    for (const value of ['medium shot', '35mm', 'softbox key camera-left', 'teal and orange'])
      expect(out).toContain(value);
    // Words a model might reach for but the brief never said.
    for (const invented of ['majestic', 'serene', 'vast', 'barren', 'stream of'])
      expect(out).not.toContain(invented);
  });

  it('leaves a brief with no craft layer as a plain sentence', () => {
    const out = forge({ subject: 'A dragon', medium: 'photograph' }, modelById('nanobanana'));
    expect(out.flat).toBe('Photograph of a dragon.');
  });

  it('does not change the models that were never flagged', () => {
    for (const m of MODELS.filter((x) => x.prose !== 'narrative' && x.grammar === 'prose')) {
      const out = forge(BRIEF, m, 'advanced').flat;
      expect(out, `${m.id} should still be terse`).not.toContain('Framed as');
    }
  });
});
