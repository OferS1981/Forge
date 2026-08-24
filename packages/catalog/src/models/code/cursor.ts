import type { ModelSpec } from '../../types';
import { rows } from '../shared';

export const cursor: ModelSpec = {
  id: 'cursor',
  name: 'Cursor',
  version: 'Composer 2.5 + frontier models',
  maker: 'Cursor',
  category: 'code',
  blurb:
    'Four kinds of rules with a real precedence order, and a plan mode whose official recovery advice is to fix the plan rather than patch the output.',
  tags: ['.mdc rules only', 'Under 500 lines', 'Plan mode', '@file references'],
  grammar: 'code',
  length: [0, 0],
  core: ['cTask', 'cStack', 'cCheck'],
  craft: ['cScope', 'cPattern', 'rules'],
  tech: [],
  negative: { mode: 'prose', label: 'Out of scope', note: '' },
  best: 'Fast in-editor iteration, glob-scoped rules for monorepos, plan-then-build on medium features.',
  worst: 'Rule bloat. It is the documented number one failure mode.',
  notes: [
    'Reference files with @filename.ts rather than pasting their content.',
    'When output is wrong, revert and refine the plan. Iteratively patching a bad output is the documented anti-pattern.',
  ],
  warnings: [
    'Rules must be .mdc inside .cursor/rules/. A plain .md file there does nothing at all, silently.',
    'Team rules override yours and can be made non-disableable. Check the hierarchy before blaming the model.',
  ],
  settings: () =>
    rows([
      ['Rules file', '.cursor/rules/*.mdc', 'Never .md'],
      ['Trigger', 'alwaysApply or globs', 'Or description for apply-intelligently'],
      ['Length', 'under 500 lines', 'Stated ceiling, not a target'],
      ['Mode', 'Plan, then build', 'Shift+Tab'],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [{ url: 'https://cursor.com/docs/context/rules', title: 'Rules', publisher: 'Cursor' }],
  verifiedOn: '2026-08-23',
  unverified: true,
};
