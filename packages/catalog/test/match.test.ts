import { describe, expect, it } from 'vitest';
import { match, recommend, translate } from '../src/engine';
import { seedBrief } from '../src/engine/match';
import { MODELS, modelById } from '../src/models/registry';
import { PRIORITIES } from '../src/engine/match';
import { FULL } from './fixtures/briefs';

describe('match', () => {
  it('routes a plain description to the right category', () => {
    const r = match('I need a poster with the words SUMMER FETE on it');
    expect(r.groups[0]?.category).toBe('image');
    expect(r.multi).toBe(false);
    expect(r.groups[0]?.models.length).toBe(5);
  });

  it('splits a brief that needs more than one tool', () => {
    const r = match('a video ad with a voiceover and a music track');
    expect(r.multi).toBe(true);
    expect(r.groups.map((g) => g.category).sort()).toEqual(['music', 'video', 'voice']);
    for (const g of r.groups) expect(g.models.length).toBe(2);
  });

  it('moves a model up when its strength is a priority', () => {
    const plain = match('an image with words on it');
    const withText = match('an image with words on it', ['in-image-text']);
    const scoreOf = (r: ReturnType<typeof match>, id: string): number =>
      r.groups[0]?.models.find((x) => x.model.id === id)?.score ?? 0;
    expect(scoreOf(withText, 'ideogram')).toBeGreaterThan(scoreOf(plain, 'ideogram'));
    // Everything the priority lifts to the top actually has that strength.
    for (const x of withText.groups[0]?.models.slice(0, 3) ?? [])
      expect(x.model.strengthTags.some((s) => s.tag === 'in-image-text')).toBe(true);
  });

  it('penalises a model that cannot do vertical when the brief is vertical', () => {
    const r = match('a vertical tiktok video clip');
    const runway = r.groups[0]?.models.find((x) => x.model.id === 'runway');
    const kling = r.groups[0]?.models.find((x) => x.model.id === 'kling');
    if (runway && kling) expect(kling.score).toBeGreaterThan(runway.score);
  });

  it('falls back to the three broadest categories when nothing matches', () => {
    const r = match('zzzz');
    expect(r.groups.map((g) => g.category)).toEqual(['image', 'video', 'text']);
  });

  it('never recommends a wildcard', () => {
    for (const q of ['a poster', 'a song', 'a research report', 'refactor my api']) {
      for (const g of match(q).groups)
        for (const x of g.models) expect(x.model.wildcard).toBeUndefined();
    }
  });

  it('offers a priority chip for every strength tag used in the catalogue', () => {
    const used = new Set(MODELS.flatMap((m) => m.strengthTags.map((s) => s.tag)));
    for (const tag of used) expect(PRIORITIES.some((p) => p.tag === tag)).toBe(true);
  });

  it('seeds the right field for the model it opens', () => {
    expect(seedBrief({}, modelById('midjourney'), 'a fox').subject).toBe('a fox');
    expect(seedBrief({}, modelById('el-tts'), 'a line').script).toBe('a line');
    expect(seedBrief({}, modelById('suno'), 'a song').mStruct).toBe('a song');
    expect(seedBrief({}, modelById('claude'), 'a task').goal).toBe('a task');
    expect(seedBrief({ subject: 'kept' }, modelById('midjourney'), 'a fox').subject).toBe('kept');
  });
});

describe('recommend', () => {
  it('names a better fit when the brief asks for something the model is bad at', () => {
    const midjourney = modelById('midjourney');
    const recs = recommend({ subject: 'a poster', imgtext: 'SUMMER FETE' }, midjourney);
    const better = recs.find((r) => r.kind === 'better');
    expect(better?.model.id).toBe('ideogram');
    expect(better?.why).toContain('0.97');
  });

  it('never returns more than one better fit', () => {
    for (const m of MODELS) {
      const recs = recommend(FULL[m.category], m);
      expect(recs.filter((r) => r.kind === 'better').length).toBeLessThanOrEqual(1);
    }
  });

  it('says nothing when the model is the right one', () => {
    const recs = recommend({ subject: 'a poster' }, modelById('midjourney'));
    expect(recs.find((r) => r.kind === 'better')).toBeUndefined();
  });

  it('names what usually comes next', () => {
    const recs = recommend({}, modelById('veo'));
    expect(recs.find((r) => r.kind === 'pairs')?.model.id).toBe('el-tts');
  });
});

describe('translate', () => {
  it('re-expresses the same brief in another grammar', () => {
    const r = translate(FULL.image, modelById('midjourney'), modelById('sdxl'));
    expect(r.from.flat).not.toBe(r.to.flat);
    expect(r.to.flat).toContain('(softbox key camera-left:1.2)');
    expect(r.to.negative).toContain('jpeg artifacts');
    expect(r.lost).toEqual([]);
  });

  it('names what could not carry over, and why', () => {
    const r = translate(FULL.video, modelById('kling'), modelById('runway'));
    const lostIds = r.lost.map((l) => l.field);
    expect(lostIds).toContain('vaudio');
    expect(lostIds).toContain('shots');
    for (const l of r.lost) expect(l.reason).toContain('has no');
  });

  it('loses nothing when both models take the same fields', () => {
    const r = translate(FULL.image, modelById('midjourney'), modelById('flux'));
    expect(r.lost).toEqual([]);
  });
});
