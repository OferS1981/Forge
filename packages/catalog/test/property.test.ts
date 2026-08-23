import { describe, expect, it } from 'vitest';
import { forge } from '../src/engine';
import { MODELS } from '../src/models/registry';
import { BANNED } from '../src/vocab';
import { briefsFor } from './fixtures/briefs';
import type { Brief, ForgeResult, Mode } from '../src/types';

/** Nothing Forge produces may contain a leak, a doubled separator or a dead-weight word. */

const LEAKS = ['undefined', 'null', '[object Object]', 'NaN'];
const DOUBLES = [', ,', ' ,', '..', '  ', ',,'];

/**
 * Everything the engine composes from user input. Notes, warnings and variations are static ported
 * copy, checked by the parity test, and they are allowed to use words like "null" in a sentence.
 */
function composedStrings(res: ForgeResult): string[] {
  return [
    res.flat,
    res.negative ?? '',
    ...res.blocks.flatMap((b) => [b.label, b.body]),
    ...res.settings.flatMap((s) => [s.name, s.value, s.why]),
    ...res.autoFilled.flatMap((a) => [a.value, a.why]),
  ];
}

const CASES: { model: (typeof MODELS)[number]; mode: Mode; name: string; brief: Brief }[] = [];
for (const m of MODELS)
  for (const mode of ['simple', 'advanced'] as Mode[])
    for (const { name, brief } of briefsFor(m.category))
      CASES.push({ model: m, mode, name, brief });

describe('every result is clean', () => {
  it('never leaks a placeholder value', () => {
    for (const c of CASES) {
      const res = forge(c.brief, c.model, c.mode);
      for (const s of composedStrings(res))
        for (const leak of LEAKS)
          expect(s, `${c.model.id}/${c.mode}/${c.name} contains ${leak}: ${s}`).not.toContain(leak);
    }
  });

  it('never doubles a separator in the prompt', () => {
    for (const c of CASES) {
      const res = forge(c.brief, c.model, c.mode);
      const flat = res.mono ? res.flat.replace(/\n\s+/g, '\n') : res.flat;
      for (const d of DOUBLES)
        expect(flat, `${c.model.id}/${c.mode}/${c.name} contains "${d}"`).not.toContain(d);
    }
  });

  it('never emits a dead-weight word', () => {
    for (const c of CASES) {
      const res = forge(c.brief, c.model, c.mode);
      const flat = res.flat.toLowerCase();
      for (const w of BANNED)
        expect(flat, `${c.model.id}/${c.mode}/${c.name} contains "${w}"`).not.toMatch(
          new RegExp('(^|[,;.\\s])' + w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '($|[,;.\\s])'),
        );
    }
  });

  it('strips dead weight the user typed, and says what it removed', () => {
    const model = MODELS[0];
    expect(model).toBeDefined();
    if (!model) return;
    const res = forge(
      { subject: 'A masterpiece portrait, 8k, ultra detailed, of a boxer' },
      model,
      'advanced',
    );
    expect(res.stripped).toContain('masterpiece');
    expect(res.stripped).toContain('8k');
    expect(res.flat.toLowerCase()).not.toContain('masterpiece');
    expect(res.warnings[0]).toContain('Removed from your text');
  });

  it('always returns a score, axes and three variations', () => {
    for (const c of CASES) {
      const res = forge(c.brief, c.model, c.mode);
      expect(res.score).toBeGreaterThanOrEqual(0);
      expect(res.score).toBeLessThanOrEqual(100);
      expect(res.variations).toHaveLength(3);
      for (const v of Object.values(res.axes)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });

  it('is deterministic', () => {
    for (const c of CASES.slice(0, 40)) {
      const a = forge(c.brief, c.model, c.mode);
      const b = forge(c.brief, c.model, c.mode);
      expect(a).toEqual(b);
    }
  });

  it('never leaks a vendor-specific technique into another vendor', () => {
    for (const c of CASES) {
      const res = forge(c.brief, c.model, c.mode);
      if (!c.model.inlineCameraTokens)
        expect(res.flat, `${c.model.id} leaked a Hailuo bracket token`).not.toMatch(
          /\[(pan|zoom|static)\]/,
        );
      if (c.model.audioTags === undefined || c.model.audioTags === 'never')
        expect(res.flat, `${c.model.id} leaked an ElevenLabs audio tag`).not.toMatch(
          /\[(whispers|softly|urgent|sarcastic|warmly|tired|deadpan|shouts|dramatically|exhales)\]/,
        );
      if (c.model.promptSuffix === undefined)
        expect(res.flat, `${c.model.id} leaked a Midjourney flag`).not.toMatch(
          /--(ar|v|stylize|motion)\b/,
        );
    }
  });

  it('only emits boilerplate negatives on the tag grammar', () => {
    for (const c of CASES) {
      const res = forge(c.brief, c.model, c.mode);
      if (c.model.grammar === 'tags') continue;
      expect(res.negative ?? '', `${c.model.id} emitted SDXL boilerplate`).not.toContain(
        'jpeg artifacts',
      );
    }
  });
});
