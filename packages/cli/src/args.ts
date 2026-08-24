/**
 * Argument parsing, by hand and on purpose.
 *
 * A dependency would be larger than this file and would bring its own opinions about what a flag
 * means. Forge needs one shape: `--name value`, `--name=value` and `--flag`, with everything else
 * positional. Sixty lines, no surprises, and every edge tested.
 */

export interface Parsed {
  command: string | undefined;
  positional: string[];
  flags: Record<string, string | true>;
}

export function parseArgs(argv: readonly string[]): Parsed {
  const positional: string[] = [];
  const flags: Record<string, string | true> = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) continue;
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }
    // Everything after a bare -- is positional, which is how a subject beginning with a dash gets in.
    if (arg === '--') {
      positional.push(...argv.slice(i + 1));
      break;
    }
    const body = arg.slice(2);
    const equals = body.indexOf('=');
    if (equals >= 0) {
      flags[body.slice(0, equals)] = body.slice(equals + 1);
      continue;
    }
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      flags[body] = true;
    } else {
      flags[body] = next;
      i += 1;
    }
  }

  const [command, ...rest] = positional;
  return { command, positional: rest, flags };
}

/** A flag's value when it was given one, rather than `true` for a bare flag. */
export function value(flags: Parsed['flags'], name: string): string | undefined {
  const found = flags[name];
  return typeof found === 'string' ? found : undefined;
}

export function present(flags: Parsed['flags'], name: string): boolean {
  return flags[name] !== undefined;
}

/**
 * The nearest known name to one that was not recognised, so a typo gets a suggestion rather than a
 * list of ninety fields. Plain edit distance, capped, because a wrong answer here costs nothing.
 */
export function nearest(unknown: string, known: readonly string[]): string | undefined {
  let best: { name: string; distance: number } | undefined;
  for (const name of known) {
    const distance = editDistance(unknown, name);
    if (distance <= 3 && (best === undefined || distance < best.distance))
      best = { name, distance };
  }
  return best?.name;
}

function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const substitute = (previous[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1);
      const insert = (current[j - 1] ?? 0) + 1;
      const remove = (previous[j] ?? 0) + 1;
      current[j] = Math.min(substitute, insert, remove);
    }
    previous = current;
  }
  return previous[b.length] ?? Math.max(a.length, b.length);
}
