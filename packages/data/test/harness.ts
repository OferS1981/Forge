import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

/**
 * A real Postgres to run the policies against.
 *
 * PGlite is Postgres 16 compiled to WebAssembly: the real planner and the real row level security,
 * in this process, with no server, no Docker and no hosted project. That matters, because the
 * policies are the security boundary of the whole account layer and a boundary nobody tests is a
 * boundary nobody has.
 *
 * The harness creates only what Supabase itself provides and the migration therefore assumes: the
 * `auth` schema with a `users` table and `auth.uid()`, and the `anon` and `authenticated` roles.
 * `auth.uid()` is Supabase's own definition, reading the request's JWT claims out of a setting.
 * `sql/001_library.sql` then runs unedited, so what is tested here is what would be deployed.
 */

const PRELUDE = `
  create schema if not exists auth;

  create table auth.users (
    id    uuid primary key,
    email text unique
  );

  create or replace function auth.jwt() returns jsonb
    language sql stable
  as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
  $$;

  create or replace function auth.uid() returns uuid
    language sql stable
  as $$
    select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid;
  $$;

  create role anon nologin;
  create role authenticated nologin;
`;

const MIGRATIONS = ['001_library.sql', '002_usage.sql'].map((f) =>
  fileURLToPath(new URL(`../sql/${f}`, import.meta.url)),
);

/** Two people, so that "only the owner" can be tested rather than asserted. */
export const ALICE = '11111111-1111-1111-1111-111111111111';
export const BOB = '22222222-2222-2222-2222-222222222222';

export interface Db {
  /** One statement as a signed-in user. Its own transaction, so a rejection leaves nothing behind. */
  as: <T>(uid: string, sql: string, params?: unknown[]) => Promise<T[]>;
  /** The same, with an email claim, for policies that name people by address. */
  asEmail: <T>(uid: string, email: string, sql: string, params?: unknown[]) => Promise<T[]>;
  /** One statement as an anonymous visitor, which is what a share page is. */
  anon: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
  /** One statement with no role change, for setting up the world the policies act on. */
  admin: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
  close: () => Promise<void>;
}

export async function makeDb(): Promise<Db> {
  const pg = new PGlite();
  await pg.exec(PRELUDE);
  for (const m of MIGRATIONS) await pg.exec(readFileSync(m, 'utf8'));
  await pg.exec(`
    insert into auth.users (id, email) values
      ('${ALICE}', 'alice@example.test'),
      ('${BOB}', 'bob@example.test');
  `);

  async function run<T>(
    role: string,
    claims: string,
    sql: string,
    params: unknown[],
  ): Promise<T[]> {
    await pg.exec('begin');
    try {
      await pg.query('select set_config($1, $2, true)', ['request.jwt.claims', claims]);
      await pg.query(`set local role ${role}`);
      const result = await pg.query<T>(sql, params);
      await pg.exec('commit');
      return result.rows;
    } catch (error) {
      await pg.exec('rollback');
      throw error;
    }
  }

  return {
    as: (uid, sql, params = []) =>
      run('authenticated', JSON.stringify({ sub: uid, role: 'authenticated' }), sql, params),
    asEmail: (uid, email, sql, params = []) =>
      run('authenticated', JSON.stringify({ sub: uid, email, role: 'authenticated' }), sql, params),
    anon: (sql, params = []) => run('anon', JSON.stringify({ role: 'anon' }), sql, params),
    admin: async <T>(sql: string, params: unknown[] = []) => (await pg.query<T>(sql, params)).rows,
    close: () => pg.close(),
  };
}

/** What a policy rejection looks like, so a test can say it was the policy and not a typo. */
export async function denied(work: Promise<unknown>): Promise<string> {
  try {
    await work;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error('expected the statement to be refused, and it was allowed');
}

/** A slug of the shape the check constraint demands, without needing a random source in a test. */
export function slug(seed: string): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  let hash = 7;
  for (let i = 0; i < 22; i++) {
    hash = (hash * 31 + seed.charCodeAt(i % seed.length)) % 1_000_003;
    out += alphabet.charAt(hash % alphabet.length);
  }
  return out;
}
