import { has } from '../compose/text';
import { JOB_NAMES } from '../categories';
import { CATEGORY_IDS } from '../ids';
import { MODELS } from '../models';
import type { Brief, CategoryId, MatchGroup, MatchResult, Model, StrengthTag } from '../types';

/** Words that say which job a brief belongs to. Ported verbatim. */
export const MATCH_KEYWORDS: Record<CategoryId, readonly string[]> = {
  image: [
    'image',
    'picture',
    'photo',
    'poster',
    'logo',
    'illustration',
    'thumbnail',
    'artwork',
    'render',
    'icon',
    'mockup',
    'banner',
  ],
  video: [
    'video',
    'clip',
    'film',
    'footage',
    'ad',
    'animation',
    'reel',
    'short',
    'b-roll',
    'trailer',
    'commercial',
  ],
  voice: [
    'voice',
    'voiceover',
    'narration',
    'speech',
    'read',
    'dub',
    'tts',
    'audiobook',
    'talking',
  ],
  sfx: ['sound effect', 'sfx', 'foley', 'whoosh', 'impact', 'ambience', 'ui sound'],
  music: [
    'music',
    'song',
    'track',
    'beat',
    'score',
    'soundtrack',
    'jingle',
    'underscore',
    'instrumental',
  ],
  code: [
    'code',
    'refactor',
    'bug',
    'test',
    'repo',
    'migration',
    'api',
    'function',
    'typescript',
    'python',
  ],
  app: ['app', 'website', 'landing page', 'dashboard', 'prototype', 'web app', 'saas'],
  research: ['research', 'report', 'compare', 'sources', 'market', 'brief', 'fact'],
  text: [
    'write',
    'summarise',
    'summarize',
    'analyse',
    'analyze',
    'explain',
    'draft',
    'email',
    'essay',
    'plan',
  ],
};

/** The plain-language names for the priority chips, in the order the UI shows them. */
export const PRIORITIES: readonly { tag: StrengthTag; label: string }[] = [
  { tag: 'photoreal', label: 'Photoreal quality' },
  { tag: 'in-image-text', label: 'Words inside the image' },
  { tag: 'long-clip', label: 'Long clips' },
  { tag: 'native-audio', label: 'Native audio' },
  { tag: 'character-consistency', label: 'Character consistency' },
  { tag: 'editable-vectors', label: 'Editable vectors' },
  { tag: 'speed-cost', label: 'Speed and cost' },
  { tag: 'open-weights', label: 'Open weights' },
  { tag: 'commercial-safety', label: 'Commercial safety' },
  { tag: 'non-english-text', label: 'Non-English text' },
];

const VERTICAL = /vertical|9:16|tiktok|reel|short/;

function escapeRegExp(s: string): string {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function weightOf(m: Model, tag: StrengthTag): number {
  return m.strengthTags.find((s) => s.tag === tag)?.weight ?? 0;
}

/** Rank the catalogue against a plain description of the job plus optional priorities. */
export function match(query: string, priorities: readonly StrengthTag[] = []): MatchResult {
  const q = query.toLowerCase();
  const hit = (k: string): boolean =>
    new RegExp('(^|[^a-z])' + escapeRegExp(k) + '([^a-z]|$)', 'i').test(q);

  const catScore = {} as Record<CategoryId, number>;
  for (const c of CATEGORY_IDS)
    catScore[c] = MATCH_KEYWORDS[c].reduce((s, k) => s + (hit(k) ? 1 : 0), 0);

  const wanted = CATEGORY_IDS.filter((c) => catScore[c] > 0).sort(
    (a, b) => catScore[b] - catScore[a],
  );
  const cats: CategoryId[] = wanted.length ? wanted.slice(0, 3) : ['image', 'video', 'text'];

  const scored = MODELS.filter((m) => cats.includes(m.category) && !m.wildcard)
    .map((m) => {
      let s = 20 + catScore[m.category] * 6;
      for (const p of priorities) s += weightOf(m, p) * 11;
      for (const t of m.tags)
        if (q.includes((t.toLowerCase().split(' ')[0] ?? '').toLowerCase())) s += 5;
      if (q.includes(m.name.toLowerCase())) s += 25;
      if (VERTICAL.test(q) && m.vertical === 'weak') s -= 12;
      if (VERTICAL.test(q) && m.vertical === 'strong') s += 8;
      return { model: m, score: s };
    })
    .sort((a, b) => b.score - a.score);

  const per = cats.length > 1 ? 2 : 5;
  const groups: MatchGroup[] = cats
    .map((c) => ({
      category: c,
      job: JOB_NAMES[c],
      models: scored.filter((x) => x.model.category === c).slice(0, per),
    }))
    .filter((g) => g.models.length > 0);

  return { groups, multi: groups.length > 1 };
}

/** Put the query into the field that model's brief starts from. */
export function seedBrief(brief: Brief, model: Model, seed: string): Brief {
  const b: Brief = { ...brief };
  const put = (id: keyof Brief, value: string): void => {
    if (!has(b[id])) Object.assign(b, { [id]: value });
  };
  if (model.category === 'image' || model.category === 'video') put('subject', seed);
  else if (model.category === 'voice') put('script', seed);
  else if (model.category === 'music') put('mStruct', seed);
  else if (model.category === 'sfx') put('sound', seed);
  else if (model.category === 'code') put('cTask', seed);
  else if (model.category === 'app') put('aApp', seed);
  else if (model.category === 'research') put('rQuestion', seed);
  else put('goal', seed);
  return b;
}
