import type { Model } from '../../types';
import { rows } from '../shared';

export const v0: Model = {
  id: 'v0',
  name: 'v0',
  version: 'v2 API',
  maker: 'Vercel',
  category: 'app',
  blurb:
    'Headless as well as interactive. Each app is a chat that holds its own state, and the model is a composite that can change under you.',
  tags: ['Headless API', 'Composite model', '3 skills per request', 'Next.js sweet spot'],
  grammar: 'app',
  length: [0, 0],
  core: ['aApp', 'aScreens', 'aData'],
  craft: ['aStyle', 'cScope', 'rules'],
  tech: [],
  negative: { mode: 'prose', label: 'Leave alone', note: '' },
  best: 'Next.js, React and Tailwind on Vercel, invoked from your own product or CI.',
  worst:
    'Off-stack requests degrade. Composite means the base model can be swapped without a version bump.',
  notes: [
    "Do not hard-tune prompts to a specific base model's quirks: v0 swaps them independently.",
  ],
  warnings: ['Three skills per request is a hard cap.'],
  settings: () =>
    rows([
      ['Model', 'v0-1.5-md', 'lg for harder work'],
      ['Mode', 'streaming', ''],
      ['Skills', 'max 3', ''],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [{ url: 'https://v0.app/docs', title: 'v0 documentation', publisher: 'Vercel' }],
  verifiedOn: '2026-08-23',
  unverified: true,
};
