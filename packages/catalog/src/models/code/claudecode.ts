import type { Model } from '../../types';
import { or, rows } from '../shared';

export const claudecode: Model = {
  id: 'claudecode',
  name: 'Claude Code',
  version: 'current',
  maker: 'Anthropic',
  category: 'code',
  blurb:
    'Explore, plan, implement, commit. The documented prescription is a workflow, not a prompt, and giving it a verifiable check is most of the quality.',
  tags: ['CLAUDE.md', 'Plan mode', 'Verifiable check', 'Subagent review'],
  grammar: 'code',
  length: [0, 0],
  core: ['cTask', 'cStack', 'cCheck'],
  craft: ['cScope', 'cPattern', 'rules', 'examples'],
  tech: ['effort'],
  negative: {
    mode: 'prose',
    label: 'Out of scope',
    note: 'the leave-alone clause is the highest-value line in agent prompting',
  },
  best: 'Long autonomous runs with real verification, codebase questions and onboarding, parallel fan-out migrations.',
  worst:
    'Cheap one-liners: the context ramp costs more than it saves. Anything with no runnable check.',
  notes: [
    'Give it something that exits 0. Tests, a build, a screenshot diff. Without a check it cannot tell done from nearly done.',
    'Plan first in plan mode, then execute. For big features, have it interview you, write SPEC.md, then start a fresh session.',
    'Adversarial review works in fresh context, not in the same session. A reviewer prompted to find gaps will find some even when the work is sound.',
  ],
  warnings: [
    'Keep CLAUDE.md lean. Test every line with: would removing this cause a mistake? Emphasise one thing with IMPORTANT, not five.',
    'After two failed corrections, clear the context and rewrite the prompt rather than correcting a third time.',
  ],
  settings: (b) =>
    rows([
      ['Mode', 'plan first', 'Shift+Tab, or --permission-mode plan'],
      ['Effort', or(b.effort, 'High'), ''],
      ['Check', or(b.cCheck, 'a command that exits 0'), ''],
      ['CLAUDE.md', 'commands, style rules, gotchas', 'Not things derivable from the code'],
      ['Review', '/code-review in fresh context', ''],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://code.claude.com/docs/en/best-practices',
      title: 'Best practices',
      publisher: 'Anthropic',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
