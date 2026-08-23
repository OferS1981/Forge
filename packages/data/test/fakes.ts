import type { RemotePort } from '../src/remote';
import type { Env } from '../src/types';
import type { KeyValue } from '../src/local';

/** A clock and an id source that count, so a test can say exactly what was written. */
export function fakeEnv(): Env {
  let n = 0;
  let clock = 0;
  return {
    now: () => {
      clock += 1000;
      return new Date(clock).toISOString();
    },
    id: () => {
      n += 1;
      return `id-${String(n)}`;
    },
    random: (size) => Uint8Array.from({ length: size }, (_, i) => (i * 7 + 3) % 256),
  };
}

export function fakeStorage(seed: Record<string, string> = {}): KeyValue & {
  dump: () => Record<string, string>;
} {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    dump: () => Object.fromEntries(map),
  };
}

/**
 * A stand-in for the tables. It does not enforce row level security and it is not supposed to: the
 * policies are tested against real Postgres in `rls.test.ts`. What this checks is that the account
 * library sends the right rows, under the right names, in the right order.
 */
export function fakePort(userId = 'user-1'): RemotePort & {
  rows: (table: string) => Record<string, unknown>[];
  calls: string[];
  fail: (message: string | null) => void;
} {
  const tables = new Map<string, Record<string, unknown>[]>();
  const calls: string[] = [];
  let failure: string | null = null;
  let n = 0;

  const table = (name: string): Record<string, unknown>[] => {
    const rows = tables.get(name) ?? [];
    tables.set(name, rows);
    return rows;
  };

  const matches = (row: Record<string, unknown>, match: Record<string, unknown>): boolean =>
    Object.entries(match).every(([key, value]) => row[key] === value);

  const check = (): void => {
    if (failure !== null) throw new Error(failure);
  };

  return {
    userId: () => userId,
    calls,
    rows: (name) => table(name),
    fail: (message) => {
      failure = message;
    },
    select: <T>(name: string, columns: string) => {
      check();
      calls.push(`select ${name} ${columns}`);
      return Promise.resolve(table(name) as T[]);
    },
    insert: <T>(name: string, row: Record<string, unknown>) => {
      check();
      calls.push(`insert ${name}`);
      n += 1;
      const withDefaults = {
        id: `row-${String(n)}`,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        expires_at: null,
        ...row,
      };
      table(name).push(withDefaults);
      return Promise.resolve(withDefaults as T);
    },
    update: (name, patch, match) => {
      check();
      calls.push(`update ${name} ${Object.keys(patch).join(',')}`);
      for (const row of table(name)) if (matches(row, match)) Object.assign(row, patch);
      return Promise.resolve();
    },
    remove: (name, match) => {
      check();
      calls.push(`remove ${name}`);
      tables.set(
        name,
        table(name).filter((row) => !matches(row, match)),
      );
      return Promise.resolve();
    },
    rpc: <T>(fn: string, args: Record<string, unknown>) => {
      check();
      calls.push(`rpc ${fn}`);
      const slug = args.p_slug;
      const shares = table('shares').filter((s) => s.slug === slug);
      const share = shares[0];
      if (share === undefined) return Promise.resolve([] as T[]);
      const prompt = table('prompts').find((p) => p.id === share.prompt_id);
      if (prompt === undefined) return Promise.resolve([] as T[]);
      return Promise.resolve([{ slug, ...prompt }] as T[]);
    },
  };
}
