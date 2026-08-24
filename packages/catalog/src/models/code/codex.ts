import type { ModelSpec } from '../../types';
import { or, rows } from '../shared';

export const codex: ModelSpec = {
  id: 'codex',
  name: 'Codex',
  version: 'GPT-5.6',
  maker: 'OpenAI',
  category: 'code',
  blurb:
    'Reads AGENTS.md and has its own effort ladder. The official rule is to use the lowest effort that produces the result.',
  tags: ['AGENTS.md', 'Light→Ultra', 'Model-agnostic backend'],
  grammar: 'code',
  length: [0, 0],
  core: ['cTask', 'cStack', 'cCheck'],
  craft: ['cScope', 'cPattern', 'rules'],
  tech: ['effort'],
  negative: { mode: 'prose', label: 'Out of scope', note: '' },
  best: 'Deep analysis on ambiguous high-value work at Sol, everyday work at Terra, repeatable extraction at Luna.',
  worst: 'Ultra spawns parallel agents and the cost is non-linear.',
  notes: [
    "Codex will point at any model implementing Chat Completions or Responses, not only OpenAI's.",
  ],
  warnings: [
    'Effort names differ between the API and the Codex UI. Do not map reasoning.effort to Light and Ultra one-to-one.',
  ],
  settings: (b) =>
    rows([
      ['Model', 'gpt-5.6-sol', 'terra for everyday, luna for repeatable'],
      ['Effort', or(b.effort, 'Medium'), 'Light, Medium, High, Extra High, Max, Ultra'],
      ['Instructions', 'AGENTS.md', ''],
      ['Default model', 'config.toml', ''],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://developers.openai.com/codex',
      title: 'Codex documentation',
      publisher: 'OpenAI',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
