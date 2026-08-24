import type { ModelSpec } from '../../types';
import { rows } from '../shared';

export const copilot: ModelSpec = {
  id: 'copilot',
  name: 'GitHub Copilot',
  version: 'current',
  maker: 'GitHub',
  category: 'code',
  blurb:
    'Unusually explicit about what not to put in instructions: no external lookups, no tone rules, no word limits.',
  tags: ['Path-scoped instructions', 'AGENTS.md', 'Short and self-contained'],
  grammar: 'code',
  length: [0, 0],
  core: ['cTask', 'cStack', 'cCheck'],
  craft: ['cScope', 'cPattern', 'rules'],
  tech: [],
  negative: { mode: 'prose', label: 'Out of scope', note: '' },
  best: 'Repo-wide conventions, path-scoped rules in large monorepos, broad model choice.',
  worst:
    'Long instruction files. GitHub state plainly that these break on large diverse repositories.',
  notes: [
    'Effective instructions are short, self-contained and broadly applicable. Path-scoped .instructions.md files with applyTo frontmatter are the escape valve.',
  ],
  warnings: [
    'Do not write instructions that require looking something up externally, mandate tone, or set word limits.',
    'Agent-file support varies by Copilot feature. Do not assume AGENTS.md is read everywhere.',
  ],
  settings: () =>
    rows([
      ['Repo file', '.github/copilot-instructions.md', ''],
      ['Path-scoped', '.github/instructions/NAME.instructions.md', 'With applyTo frontmatter'],
      ['Precedence', 'Personal → Repo → Org', ''],
      ['Prompt files', '*.prompt.md', 'Reusable'],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions',
      title: 'Adding repository custom instructions',
      publisher: 'GitHub',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
