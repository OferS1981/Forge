import type { ModelSpec } from '../../types';
import { rows } from '../shared';

export const base44: ModelSpec = {
  id: 'base44',
  name: 'Base44',
  version: 'current',
  maker: 'Wix',
  category: 'app',
  blurb:
    'Entities and data model first, then screens, then logic. Managed backend, auth and hosting come with it.',
  tags: ['Entity-first', 'Managed backend', 'Superagents', 'SDK + CLI'],
  grammar: 'app',
  length: [0, 0],
  core: ['aApp', 'aData', 'aScreens'],
  craft: ['aStyle', 'cScope', 'rules'],
  tech: [],
  negative: { mode: 'prose', label: 'Leave alone', note: '' },
  best: 'Internal tools and small products where auth, data and hosting being handled is worth more than framework control.',
  worst:
    'No published model identity or context limits, so no model-specific prompt tuning is possible.',
  notes: [
    'Describe the entities and their relationships before you describe a single screen. The data model is what everything else hangs off.',
  ],
  warnings: [
    'Treat prompt advice here as generic app-builder advice: Base44 publish no formal prompting guidance.',
  ],
  settings: () =>
    rows([
      ['Order', 'entities → screens → logic', ''],
      ['Integrations', 'connect before you build against them', ''],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [{ url: 'https://docs.base44.com/', title: 'Base44 documentation', publisher: 'Wix' }],
  verifiedOn: '2026-08-23',
  unverified: true,
};
