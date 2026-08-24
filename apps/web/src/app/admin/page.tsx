'use client';

import { useEffect, useState } from 'react';
import { configured, usageRows, watchAccount, type Account } from '../../lib/account';
import { Table } from '@forge/ui';

/**
 * The admin's page: the counters, and nothing else, for the person named in admin_emails. There
 * is nothing secret to hide on this route: a visitor who is not the admin gets zero rows from
 * the database itself, so the page's job is to be honest about what it shows and what Forge
 * refuses to collect.
 */

interface Row {
  day: string;
  event: string;
  n: number;
}

type Fetched = { kind: 'loading' } | { kind: 'not-admin' } | { kind: 'ready'; rows: Row[] };

function summarise(rows: Row[]): {
  visitsToday: number;
  visits7: number;
  models: [string, number][];
  tools: [string, number][];
} {
  const today = new Date().toISOString().slice(0, 10);
  const week = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);
  let visitsToday = 0;
  let visits7 = 0;
  const models = new Map<string, number>();
  const tools = new Map<string, number>();
  for (const r of rows) {
    if (r.event === 'visit') {
      if (r.day === today) visitsToday += r.n;
      if (r.day >= week) visits7 += r.n;
    } else if (r.event.startsWith('strike:')) {
      const id = r.event.slice('strike:'.length);
      models.set(id, (models.get(id) ?? 0) + r.n);
    } else if (r.event.startsWith('heard:')) {
      tools.set('heard: ' + r.event.slice(6), (tools.get('heard: ' + r.event.slice(6)) ?? 0) + r.n);
    } else {
      tools.set(r.event, (tools.get(r.event) ?? 0) + r.n);
    }
  }
  const top = (m: Map<string, number>): [string, number][] =>
    [...m.entries()].sort((a, b) => b[1] - a[1]);
  return { visitsToday, visits7, models: top(models).slice(0, 15), tools: top(tools) };
}

export default function AdminPage(): React.ReactNode {
  const [fetched, setFetched] = useState<Fetched>({ kind: 'loading' });
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => watchAccount(setAccount), []);

  useEffect(() => {
    if (!configured() || account === null) return;
    let live = true;
    usageRows()
      .then((rows) => {
        if (!live) return;
        // RLS answers a non-admin with zero rows, never an error: an empty read IS the refusal.
        setFetched(rows.length === 0 ? { kind: 'not-admin' } : { kind: 'ready', rows });
      })
      .catch(() => {
        if (live) setFetched({ kind: 'not-admin' });
      });
    return () => {
      live = false;
    };
  }, [account]);

  // The synchronous states are derived, not stored: nothing to desynchronise.
  const state: Fetched | { kind: 'unconfigured' } | { kind: 'signed-out' } = !configured()
    ? { kind: 'unconfigured' }
    : account === null
      ? { kind: 'signed-out' }
      : fetched;

  return (
    <main className="admin" aria-label="Forge admin">
      <h1 className="admin__title">The counters</h1>
      <p className="admin__lede">
        Everything Forge knows about its use, in one table: anonymous counts of events, one row per
        day. No prompts, no briefs, no names, no addresses, no per-person anything is collected,
        here or anywhere else, so this page can never show them.
      </p>

      {state.kind === 'unconfigured' && (
        <p className="admin__note">
          This build has no account service configured, so there are no counters to read.
        </p>
      )}
      {state.kind === 'signed-out' && (
        <p className="admin__note">
          Sign in on the <a href="/account">account page</a> first. The counters answer only to the
          admin address.
        </p>
      )}
      {state.kind === 'loading' && <p className="admin__note">Reading the counters.</p>}
      {state.kind === 'not-admin' && (
        <p className="admin__note">
          This page is for the person who runs Forge. Signed in as anyone else, the database answers
          with nothing, which is what just happened.
        </p>
      )}

      {state.kind === 'ready' && <AdminBody rows={state.rows} />}
    </main>
  );
}

function AdminBody({ rows }: { rows: Row[] }): React.ReactNode {
  const s = summarise(rows);
  return (
    <>
      <section className="admin__cards" aria-label="Visitors">
        <div className="admin__card">
          <p className="admin__n">{s.visitsToday}</p>
          <p className="admin__what">browsers today</p>
        </div>
        <div className="admin__card">
          <p className="admin__n">{s.visits7}</p>
          <p className="admin__what">browsers this week</p>
        </div>
      </section>

      <section aria-label="Most used models">
        <h2 className="admin__h2">Most used models</h2>
        <Table
          caption="Strikes per model, all time"
          columns={[
            { key: 'model', header: 'Model', cell: (r: [string, number]) => r[0], mono: true },
            { key: 'n', header: 'Strikes', cell: (r: [string, number]) => String(r[1]) },
          ]}
          rows={s.models}
          rowKey={(r) => r[0]}
        />
      </section>

      <section aria-label="Tools and answers">
        <h2 className="admin__h2">Tools, and how people heard</h2>
        <Table
          caption="Everything else being counted"
          columns={[
            { key: 'event', header: 'Event', cell: (r: [string, number]) => r[0], mono: true },
            { key: 'n', header: 'Count', cell: (r: [string, number]) => String(r[1]) },
          ]}
          rows={s.tools}
          rowKey={(r) => r[0]}
        />
      </section>
    </>
  );
}
