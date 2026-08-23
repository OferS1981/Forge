import type { Model } from '../../types';
import { rows } from '../shared';

export const devin: Model = {
  id: 'devin',
  name: 'Devin',
  version: 'Cloud / Desktop',
  maker: 'Cognition',
  category: 'code',
  blurb:
    'Four components in every good Devin prompt: context, step-by-step instructions, measurable success criteria, and an existing pattern to follow.',
  tags: ['Success criteria', 'Playbooks', '6k/12k char rule caps', 'AGENTS.md'],
  grammar: 'code',
  length: [0, 0],
  core: ['cTask', 'cStack', 'cCheck'],
  craft: ['cScope', 'cPattern', 'rules'],
  tech: [],
  negative: { mode: 'prose', label: 'Out of scope', note: '' },
  best: 'Async remote work on well-scoped tasks with a clear finish line.',
  worst:
    "Open-ended decisions. Cognition's own guidance is to be opinionated and not leave major decisions open.",
  notes: [
    'Break work into verified checkpoints. Use Playbooks for procedures and Knowledge for standards that persist.',
  ],
  warnings: [
    'Rules files are hard-capped: 6,000 characters global, 12,000 per workspace file. A longer file silently truncates.',
    'Windsurf is now Devin Desktop. .devin/ beats .windsurf/, and leftover Windsurf configs can be shadowed.',
  ],
  settings: () =>
    rows([
      ['Rules', '.devin/rules/*.md', ''],
      ['Trigger', 'always_on, model_decision, glob, manual', ''],
      ['Caps', '6k global / 12k workspace', 'Enforced'],
      ['Success criteria', "measurable, not 'make it work'", ''],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    { url: 'https://docs.devin.ai/', title: 'Devin documentation', publisher: 'Cognition' },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
