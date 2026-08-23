import type { Model } from '../../types';
import { or, rows } from '../shared';

export const genericCode: Model = {
  id: 'generic-code',
  name: 'Any other coding agent',
  version: 'category wildcard',
  category: 'code',
  wildcard: true,
  blurb:
    'The four things every coding agent needs, in the order they need them, plus an AGENTS.md block that most of them now read.',
  tags: ['Model-agnostic', 'AGENTS.md', 'Verifiable check'],
  grammar: 'code',
  length: [0, 0],
  core: ['cTask', 'cStack', 'cCheck'],
  craft: ['cScope', 'cPattern', 'rules'],
  tech: [],
  negative: { mode: 'prose', label: 'Out of scope', note: '' },
  best: 'Any coding agent.',
  worst: 'Nothing tool-specific.',
  notes: [
    'AGENTS.md is the closest thing to a cross-tool standard: Cursor, Codex, Copilot and Devin Desktop all read it.',
  ],
  warnings: ['A success criterion that cannot be checked by a command is not a success criterion.'],
  settings: (b) =>
    rows([
      ['Instruction file', 'AGENTS.md', ''],
      ['Check', or(b.cCheck, 'a command that exits 0'), ''],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [{ url: 'https://agents.md/', title: 'AGENTS.md', publisher: 'AGENTS.md' }],
  verifiedOn: '2026-08-23',
  unverified: true,
};
