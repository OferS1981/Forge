'use client';

import type { RemotePort } from '@forge/data';

/**
 * The account service, and the seam around it.
 *
 * Everything above this file is written against `Library` and `RemotePort` and is tested in Node.
 * This is the part that talks to a real project, and it is the only part that cannot be proven by
 * `pnpm verify`, so it is kept small and it is kept here.
 *
 * When no project is configured the whole file does nothing at all: `configured()` is false, the
 * client is never loaded, and every screen falls back to the library in this browser. That is the
 * normal state for a checkout of this repository, and it is a complete product, not a crippled one.
 */

const URL_KEY = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function configured(): boolean {
  return URL_KEY.length > 0 && ANON_KEY.length > 0;
}

export interface Account {
  userId: string;
  email: string;
}

/** Only the parts of the client this app uses, so the rest of the app never sees the vendor type. */
interface Session {
  user: { id: string; email?: string | undefined };
}

interface AuthClient {
  getSession: () => Promise<{ data: { session: Session | null } }>;
  onAuthStateChange: (handler: (event: string, session: Session | null) => void) => {
    data: { subscription: { unsubscribe: () => void } };
  };
  signInWithOtp: (input: {
    email: string;
    options: { emailRedirectTo: string };
  }) => Promise<{ error: { message: string } | null }>;
  signInWithOAuth: (input: {
    provider: 'google';
    options: { redirectTo: string };
  }) => Promise<{ error: { message: string } | null }>;
  signOut: () => Promise<{ error: { message: string } | null }>;
}

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

interface Client {
  auth: AuthClient;
  from: (table: string) => {
    select: (columns: string) => Promise<QueryResult<Record<string, unknown>[]>>;
    insert: (row: Record<string, unknown>) => {
      select: () => { single: () => Promise<QueryResult<Record<string, unknown>>> };
    };
    update: (patch: Record<string, unknown>) => {
      match: (match: Record<string, unknown>) => Promise<QueryResult<null>>;
    };
    delete: () => {
      match: (match: Record<string, unknown>) => Promise<QueryResult<null>>;
    };
  };
  rpc: (fn: string, args: Record<string, unknown>) => Promise<QueryResult<unknown[]>>;
}

let client: Promise<Client> | null = null;

/**
 * Loaded on demand. A visitor who never signs in never downloads it, which is the point of the
 * dynamic import: the account layer must not be a tax on the part of the product that is free of it.
 */
async function getClient(): Promise<Client> {
  client ??= import('@supabase/supabase-js').then(
    (mod) =>
      mod.createClient(URL_KEY, ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // The sign-in link comes back to the browser, so the browser is what completes it.
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      }) as unknown as Client,
  );
  return client;
}

function fail<T>(result: QueryResult<T>): T {
  if (result.error !== null) throw new Error(result.error.message);
  if (result.data === null)
    throw new Error('The library returned nothing where a row was expected.');
  return result.data;
}

export function portFor(userId: string): RemotePort {
  return {
    userId: () => userId,
    select: async <T>(table: string, columns: string) => {
      const db = await getClient();
      return fail(await db.from(table).select(columns)) as T[];
    },
    insert: async <T>(table: string, row: Record<string, unknown>) => {
      const db = await getClient();
      return fail(await db.from(table).insert(row).select().single()) as T;
    },
    update: async (table, patch, match) => {
      const db = await getClient();
      const result = await db.from(table).update(patch).match(match);
      if (result.error !== null) throw new Error(result.error.message);
    },
    remove: async (table, match) => {
      const db = await getClient();
      const result = await db.from(table).delete().match(match);
      if (result.error !== null) throw new Error(result.error.message);
    },
    rpc: async <T>(fn: string, args: Record<string, unknown>) => {
      const db = await getClient();
      const result = await db.rpc(fn, args);
      if (result.error !== null) throw new Error(result.error.message);
      return (result.data ?? []) as T[];
    },
  };
}

/** Reading a share needs no account, so it needs no user either. */
export function anonymousPort(): RemotePort {
  return portFor('');
}

function asAccount(session: Session | null): Account | null {
  if (session === null) return null;
  return { userId: session.user.id, email: session.user.email ?? '' };
}

/**
 * Watch who is signed in. Returns a function that stops watching. Calls back with null immediately
 * when there is no project, so a screen never waits for an answer that is not coming.
 */
export function watchAccount(onChange: (account: Account | null) => void): () => void {
  if (!configured()) {
    onChange(null);
    return () => {
      // Nothing was started.
    };
  }
  let stop = (): void => {
    // Replaced once the client has loaded.
  };
  let dropped = false;
  void getClient().then(async (db) => {
    if (dropped) return;
    const current = await db.auth.getSession();
    onChange(asAccount(current.data.session));
    const { data } = db.auth.onAuthStateChange((_event, session) => {
      onChange(asAccount(session));
    });
    stop = () => {
      data.subscription.unsubscribe();
    };
  });
  return () => {
    dropped = true;
    stop();
  };
}

export async function sendSignInLink(email: string, redirectTo: string): Promise<void> {
  const db = await getClient();
  const { error } = await db.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  if (error !== null) throw new Error(error.message);
}

export async function signInWithGoogle(redirectTo: string): Promise<void> {
  const db = await getClient();
  const { error } = await db.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
  if (error !== null) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  const db = await getClient();
  const { error } = await db.auth.signOut();
  if (error !== null) throw new Error(error.message);
}

/**
 * One anonymous counter tick. Fire and forget: the product never waits on it, never retries it,
 * and works identically when it fails or when no project is configured. The event vocabulary is
 * enforced server-side; nothing about the person or the brief travels with it.
 */
export function recordUse(event: string): void {
  if (!configured()) return;
  void getClient()
    .then((c) => c.rpc('record_use', { p_event: event }))
    .catch(() => {
      // Counting is a courtesy. The strike already happened.
    });
}

/** The admin's read: every counter row, newest day first. RLS decides who gets rows. */
export async function usageRows(): Promise<{ day: string; event: string; n: number }[]> {
  const c = await getClient();
  const result = await c.from('usage_counts').select('day, event, n');
  if (result.error !== null) throw new Error(result.error.message);
  const rows = result.data ?? [];
  return rows
    .map((r) => ({
      day: typeof r.day === 'string' ? r.day : '',
      event: typeof r.event === 'string' ? r.event : '',
      n: typeof r.n === 'number' ? r.n : Number(r.n ?? 0),
    }))
    .sort((a, b) => b.day.localeCompare(a.day) || b.n - a.n);
}
