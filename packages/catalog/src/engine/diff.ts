export type DiffKind = 'same' | 'added' | 'removed';

export interface DiffPart {
  kind: DiffKind;
  text: string;
}

export interface PromptDiff {
  parts: DiffPart[];
  added: number;
  removed: number;
  unchanged: number;
}

/** Split on whitespace but keep it, so rebuilding the text loses nothing. */
function tokenise(s: string): string[] {
  return s.split(/(\s+)/).filter((t) => t.length > 0);
}

function isGap(t: string): boolean {
  return /^\s+$/.test(t);
}

/**
 * The longest common subsequence of two token lists, which is what makes a diff read as an edit
 * rather than as a wholesale replacement.
 */
function lcs(a: string[], b: string[]): number[][] {
  const table: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) {
      const row = table[i];
      const next = table[i + 1];
      if (!row || !next) continue;
      row[j] = a[i] === b[j] ? (next[j + 1] ?? 0) + 1 : Math.max(next[j] ?? 0, row[j + 1] ?? 0);
    }
  return table;
}

/**
 * Word-level difference between two prompts, so a user can see which edit caused the improvement
 * rather than guessing. Whitespace runs are carried along with whichever side they belong to.
 */
export function diffPrompts(before: string, after: string): PromptDiff {
  const a = tokenise(before);
  const b = tokenise(after);
  const table = lcs(a, b);
  const parts: DiffPart[] = [];

  const push = (kind: DiffKind, text: string): void => {
    // Runs of the same kind join, so a whole replaced clause reads as one change.
    const last = parts[parts.length - 1];
    if (last?.kind === kind) last.text += text;
    else parts.push({ kind, text });
  };

  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const ai = a[i] ?? '';
    const bj = b[j] ?? '';
    if (ai === bj) {
      push('same', ai);
      i++;
      j++;
    } else if ((table[i + 1]?.[j] ?? 0) >= (table[i]?.[j + 1] ?? 0)) {
      push('removed', ai);
      i++;
    } else {
      push('added', bj);
      j++;
    }
  }
  while (i < a.length) push('removed', a[i++] ?? '');
  while (j < b.length) push('added', b[j++] ?? '');

  const count = (kind: DiffKind): number =>
    parts
      .filter((p) => p.kind === kind)
      .reduce((n, p) => n + tokenise(p.text).filter((t) => !isGap(t)).length, 0);

  return {
    parts,
    added: count('added'),
    removed: count('removed'),
    unchanged: count('same'),
  };
}
