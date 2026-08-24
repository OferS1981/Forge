import { describe, expect, it } from 'vitest';
import { CATALOG_VERSION, filledFields, isBriefEmpty } from '../src';
import { CATEGORIES, JOB_NAMES, categoryById } from '../src/categories';
import { fieldById, optionsFrom } from '../src/fields';
import { SCORE_LABELS, scoreLabel } from '../src/score-labels';
import {
  defaultModel,
  findModel,
  isModelId,
  modelById,
  modelLabel,
  modelsIn,
} from '../src/models/registry';
import { settingTerm, wantsVertical } from '../src/models/shared';
import { arr, cap, deMeta, has, join, lc, stripDot, wordCount } from '../src/compose/text';
import type { CategoryId } from '../src/types';

describe('the package surface', () => {
  it('reports its version', () => {
    expect(CATALOG_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('looks a category up, and refuses one that does not exist', () => {
    expect(categoryById('image').name).toBe('Image');
    for (const c of CATEGORIES) expect(JOB_NAMES[c.id].length).toBeGreaterThan(0);
    expect(() => categoryById('nope' as CategoryId)).toThrow('Unknown category');
  });

  it('looks a model up, and refuses one that does not exist', () => {
    expect(modelById('veo').name).toBe('Veo');
    expect(modelLabel(modelById('el-tts'))).toBe('ElevenLabs · Speech');
    expect(modelLabel(modelById('veo'))).toBe('Veo');
    expect(modelsIn('image').length).toBeGreaterThan(1);
    expect(defaultModel('image').id).toBe('midjourney');
    // @ts-expect-error a model id that does not exist must not typecheck either
    expect(() => modelById('nope')).toThrow('Unknown model');
  });

  it('looks a field up', () => {
    expect(fieldById('subject').label).toBe('Subject');
    expect(fieldById('subject').tier).toBe('simple');
    expect(fieldById('lens').tier).toBe('advanced');
    expect(fieldById('avoid').tier).toBe('pro');
    expect(fieldById('mExclude').tier).toBe('pro');
    expect(fieldById('cScope').tier).toBe('pro');
    expect(optionsFrom(['a', 'b'], 'field.subject')).toHaveLength(2);
  });
});

describe('the score scale', () => {
  it('names every band', () => {
    expect(scoreLabel(0).name).toBe('Cold iron');
    expect(scoreLabel(29).name).toBe('Cold iron');
    expect(scoreLabel(30).name).toBe('Black heat');
    expect(scoreLabel(60).name).toBe('Cherry red');
    expect(scoreLabel(100).name).toBe('Welding heat');
    expect(SCORE_LABELS).toHaveLength(7);
  });

  it('rises with the score and never skips a band', () => {
    let last = -1;
    for (let s = 0; s <= 100; s++) {
      const i = SCORE_LABELS.indexOf(scoreLabel(s));
      expect(i).toBeGreaterThanOrEqual(last);
      last = i;
    }
  });
});

describe('text helpers', () => {
  it('knows what counts as filled in', () => {
    expect(has('a')).toBe(true);
    expect(has('   ')).toBe(false);
    expect(has(undefined)).toBe(false);
    expect(has([])).toBe(false);
    expect(arr(['a', '', 'b'])).toEqual(['a', 'b']);
    expect(arr('a')).toEqual(['a']);
    expect(arr(undefined)).toEqual([]);
    expect(join(['a', 'b'], ' / ')).toBe('a / b');
    expect(wordCount(' two words ')).toBe(2);
  });

  it('sentence-cases prose without touching a proper noun or an f-stop', () => {
    expect(cap('hello')).toBe('Hello');
    expect(cap('')).toBe('');
    expect(lc('The gym')).toBe('the gym');
    expect(lc('Roger Deakins')).toBe('Roger Deakins');
    expect(lc('I am here')).toBe('I am here');
    expect(stripDot('a sentence.  ')).toBe('a sentence');
    expect(deMeta('a cool photo of a dog')).toBe('a dog');
    expect(deMeta('a dog')).toBe('a dog');
  });
});

describe('model helpers', () => {
  it('slugs a settings row name into a term id', () => {
    expect(settingTerm('--ar')).toBe('setting.ar');
    expect(settingTerm('reasoning.effort')).toBe('setting.reasoning-effort');
    expect(settingTerm('Style exaggeration')).toBe('setting.style-exaggeration');
  });

  it('spots a vertical brief', () => {
    expect(wantsVertical({ aspect: '9:16' })).toBe(true);
    expect(wantsVertical({ purpose: 'A TikTok reel' })).toBe(true);
    expect(wantsVertical({ aspect: '16:9' })).toBe(false);
    expect(wantsVertical({})).toBe(false);
  });
});

describe('untrusted ids', () => {
  it('recognises a real model id and refuses anything else', () => {
    expect(isModelId('midjourney')).toBe(true);
    expect(isModelId('not-a-model')).toBe(false);
    expect(isModelId('')).toBe(false);
    expect(isModelId('__proto__')).toBe(false);
  });

  it('looks a model up from a plain string, or gives back nothing', () => {
    expect(findModel('veo')?.name).toBe('Veo');
    expect(findModel('nonsense')).toBeUndefined();
    expect(findModel('constructor')).toBeUndefined();
  });
});

describe('brief emptiness', () => {
  it('knows an empty brief from a filled one', () => {
    expect(isBriefEmpty({})).toBe(true);
    expect(isBriefEmpty({ subject: '' })).toBe(true);
    expect(isBriefEmpty({ subject: '   ' })).toBe(true);
    expect(isBriefEmpty({ light: [] })).toBe(true);
    expect(isBriefEmpty({ subject: 'A boxer' })).toBe(false);
    expect(isBriefEmpty({ light: ['golden hour'] })).toBe(false);
  });

  it('lists only the fields that carry a value', () => {
    expect(filledFields({ subject: 'A boxer', setting: '', light: ['golden hour'] })).toEqual([
      'subject',
      'light',
    ]);
    expect(filledFields({})).toEqual([]);
  });
});
