import type { ModelSpec } from '../../types';
import { rows } from '../shared';

export const bolt: ModelSpec = {
  id: 'bolt',
  name: 'Bolt',
  version: 'current',
  maker: 'StackBlitz',
  category: 'app',
  blurb:
    'Bills by token, so Discussion Mode and file locking are cost controls rather than conveniences.',
  tags: ['Discussion Mode', 'File locking', 'Design vocabulary', 'Prompt Library'],
  grammar: 'app',
  length: [0, 0],
  core: ['aApp', 'aScreens', 'aData'],
  craft: ['aStyle', 'cScope', 'rules'],
  tech: [],
  negative: {
    mode: 'field',
    label: 'Locked files',
    note: 'file locking is the only reliable way to stop unwanted edits',
  },
  best: 'Fast first drafts where you compare several opening prompts before committing.',
  worst: "Vague aesthetic direction. It wants design vocabulary, not 'make it nicer'.",
  notes: [
    'Use real design words: font weight, line height, padding, margin, radius, contrast.',
    'Get three first drafts of the opening prompt and compare: the opening prompt disproportionately determines the architecture.',
  ],
  warnings: [
    'Discussion Mode makes it restate your idea before generating. That single step saves the most tokens.',
  ],
  settings: () =>
    rows([
      ['Mode', 'Discussion first', ''],
      ['Locks', 'lock finished files', ''],
      ['System prompt', 'set project defaults', ''],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [{ url: 'https://support.bolt.new/', title: 'Bolt support', publisher: 'StackBlitz' }],
  verifiedOn: '2026-08-23',
  unverified: true,
};
