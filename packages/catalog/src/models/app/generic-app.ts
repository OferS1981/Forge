import type { ModelSpec } from '../../types';
import { rows } from '../shared';

export const genericApp: ModelSpec = {
  id: 'generic-app',
  name: 'Any other app builder',
  version: 'category wildcard',
  category: 'app',
  wildcard: true,
  blurb:
    'The three rules that hold across every builder: plan first, one slice at a time, and always say what to leave alone.',
  tags: ['Model-agnostic', 'Scoped slices'],
  grammar: 'app',
  length: [0, 0],
  core: ['aApp', 'aScreens', 'aData'],
  craft: ['aStyle', 'cScope', 'rules'],
  tech: [],
  negative: { mode: 'field', label: 'Leave alone', note: '' },
  best: 'Any AI app builder.',
  worst: 'Nothing tool-specific.',
  notes: [
    'Every builder in this category recommends the same thing: scope the slice, name the data, and protect what already works.',
  ],
  warnings: [
    'A prompt that describes a whole app produces an app-shaped demo, not a working slice.',
  ],
  settings: () =>
    rows([
      ['Scope', 'one screen', ''],
      ['Protect', 'name the files to leave alone', ''],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://docs.lovable.dev/tips-tricks/prompting-one',
      title: 'Prompting',
      publisher: 'Lovable',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
