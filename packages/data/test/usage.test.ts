import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ALICE, BOB, makeDb, type Db } from './harness';

/**
 * The counters: anonymous by construction, readable by the named admin only, writable through
 * one function that accepts a fixed vocabulary and nothing else. The promise being tested is the
 * privacy page's promise: events, never people.
 */

let db: Db;

beforeAll(async () => {
  db = await makeDb();
  await db.admin(`insert into admin_emails (email) values ('admin@example.com')`);
});

afterAll(async () => {
  await db.close();
});

describe('usage counters', () => {
  it('anyone may bump a counter, signed in or not', async () => {
    await db.anon(`select record_use('strike:midjourney')`);
    await db.as(ALICE, `select record_use('strike:midjourney')`);
    await db.as(ALICE, `select record_use('visit')`);
    const rows = await db.admin<{ event: string; n: string }>(
      `select event, n from usage_counts order by event`,
    );
    expect(rows).toEqual([
      { event: 'strike:midjourney', n: 2 },
      { event: 'visit', n: 1 },
    ]);
  });

  it('garbage events never land', async () => {
    await db.anon(`select record_use('DROP TABLE usage_counts')`);
    await db.anon(`select record_use('strike:midjourney; --')`);
    const rows = await db.admin<{ event: string }>(
      `select event from usage_counts where event not in ('strike:midjourney','visit')`,
    );
    expect(rows).toEqual([]);
  });

  it('an anonymous visitor cannot read the counts at all', async () => {
    const rows = await db.anon(`select * from usage_counts`).catch(() => 'denied');
    expect(rows === 'denied' || (Array.isArray(rows) && rows.length === 0)).toBe(true);
  });

  it('a signed-in non-admin sees nothing', async () => {
    const rows = await db.as<{ event: string }>(BOB, `select * from usage_counts`);
    expect(rows).toEqual([]);
  });

  it('the admin email sees the counts', async () => {
    const rows = await db.asEmail<{ event: string }>(
      ALICE,
      'admin@example.com',
      `select event from usage_counts order by event`,
    );
    expect(rows.length).toBeGreaterThan(0);
  });

  it('nobody writes the table directly, admin included', async () => {
    await expect(
      db.asEmail(
        ALICE,
        'admin@example.com',
        `insert into usage_counts values (current_date, 'fake', 999)`,
      ),
    ).rejects.toThrow();
    await expect(db.as(BOB, `update usage_counts set n = 0`)).rejects.toThrow();
    await expect(db.anon(`delete from usage_counts`)).rejects.toThrow();
  });

  it('the admin list itself is invisible to clients', async () => {
    const anon = await db.anon(`select * from admin_emails`).catch(() => 'denied');
    expect(anon === 'denied' || (Array.isArray(anon) && anon.length === 0)).toBe(true);
    const user = await db.as(BOB, `select * from admin_emails`).catch(() => 'denied');
    expect(user === 'denied' || (Array.isArray(user) && user.length === 0)).toBe(true);
  });
});
