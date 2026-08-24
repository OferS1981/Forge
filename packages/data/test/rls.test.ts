import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ALICE, BOB, denied, makeDb, slug, type Db } from './harness';

/**
 * The account layer's security is these policies and nothing else. Every table gets the same pair
 * of questions: does the owner get through, and is everybody else stopped. Anything that only
 * proves the first half proves nothing.
 */

let db: Db;

beforeAll(async () => {
  db = await makeDb();
});

afterAll(async () => {
  await db.close();
});

async function promptFor(user: string, title: string): Promise<string> {
  const rows = await db.as<{ id: string }>(
    user,
    `insert into prompts (user_id, model_id, title, brief, score, mode)
     values ($1, 'midjourney', $2, '{"subject":"a dragon"}'::jsonb, 70, 'simple')
     returning id`,
    [user, title],
  );
  const row = rows[0];
  if (row === undefined) throw new Error('the insert returned no row');
  return row.id;
}

describe('every table is protected', () => {
  it('has row level security on, so a table added without policies cannot pass quietly', async () => {
    const rows = await db.admin<{
      relname: string;
      relrowsecurity: boolean;
      relforcerowsecurity: boolean;
    }>(
      `select relname, relrowsecurity, relforcerowsecurity
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r'
       order by relname`,
    );
    expect(rows.map((r) => r.relname)).toEqual([
      'folders',
      'pins',
      'profiles',
      'prompts',
      'recipes',
      'shares',
    ]);
    for (const row of rows) {
      expect(row.relrowsecurity, `${row.relname} has row level security off`).toBe(true);
      expect(row.relforcerowsecurity, `${row.relname} does not force it`).toBe(true);
    }
  });

  /*
   * PostgREST publishes every function in `public` as an endpoint, which is a surface these tests
   * cannot see: PGlite has no REST layer. What they can see is the grant behind it, which is what
   * decides whether the endpoint answers. Supabase's own linter found this on the live project and
   * this is the test that stops it returning.
   */
  it('publishes exactly one function, and it is the one an anonymous reader is meant to call', async () => {
    const callable = await db.admin<{ proname: string; who: string }>(
      `select p.proname, r.rolname as who
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       cross join (select unnest(array['anon', 'authenticated']) as rolname) r
       where n.nspname = 'public'
         and has_function_privilege(r.rolname, p.oid, 'execute')
       order by p.proname, r.rolname`,
    );
    expect(callable.map((row) => `${row.proname}:${row.who}`)).toEqual([
      'share_by_slug:anon',
      'share_by_slug:authenticated',
    ]);
  });

  it('pins the search path on every function, so none can be aimed at another schema', async () => {
    const loose = await db.admin<{ proname: string }>(
      `select proname from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and not exists (
           select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%'
         )`,
    );
    expect(loose.map((row) => row.proname)).toEqual([]);
  });

  /*
   * Two layers, not one. Row level security already returns no rows to an anonymous reader, but a
   * table it can reach comes back as an empty list rather than a refusal, and a policy edited
   * wrongly one day would then leak instead of erroring. Taking the grant away means the request is
   * refused at the door.
   *
   * This is asserted rather than assumed because Supabase grants new tables to `anon` by default
   * and PGlite does not, so for a while the test database was stricter than the deployment and this
   * test passed while production disagreed with it. The migration now revokes them by name.
   */
  it('gives an anonymous visitor no table privileges at all', async () => {
    const rows = await db.admin<{ table_name: string }>(
      `select distinct table_name from information_schema.role_table_grants
       where grantee = 'anon' and table_schema = 'public'`,
    );
    expect(rows).toEqual([]);
  });

  it('leaves signed-in users the four verbs on every table, and nothing more', async () => {
    const rows = await db.admin<{ table_name: string; privilege_type: string }>(
      `select table_name, privilege_type from information_schema.role_table_grants
       where grantee = 'authenticated' and table_schema = 'public'
       order by table_name, privilege_type`,
    );
    const byTable = new Map<string, string[]>();
    for (const row of rows) {
      byTable.set(row.table_name, [...(byTable.get(row.table_name) ?? []), row.privilege_type]);
    }
    expect([...byTable.keys()].sort()).toEqual([
      'folders',
      'pins',
      'profiles',
      'prompts',
      'recipes',
      'shares',
    ]);
    for (const [table, verbs] of byTable) {
      expect([...verbs].sort(), `${table} has the wrong verbs`).toEqual([
        'DELETE',
        'INSERT',
        'SELECT',
        'UPDATE',
      ]);
    }
  });
});

describe('profiles', () => {
  it('lets a person read and write their own', async () => {
    await db.as(ALICE, `insert into profiles (id, handle) values ($1, 'alice')`, [ALICE]);
    expect(await db.as<{ handle: string }>(ALICE, 'select handle from profiles')).toEqual([
      { handle: 'alice' },
    ]);
  });

  it('hides it from everyone else', async () => {
    expect(await db.as(BOB, 'select handle from profiles')).toEqual([]);
  });

  it('refuses a profile written under someone else id', async () => {
    const message = await denied(db.as(BOB, `insert into profiles (id) values ($1)`, [ALICE]));
    expect(message).toMatch(/row-level security/);
  });
});

describe('folders', () => {
  it('lets the owner create, rename and delete', async () => {
    await db.as(ALICE, `insert into folders (user_id, name) values ($1, 'Campaign')`, [ALICE]);
    await db.as(ALICE, `update folders set name = 'Campaign 2'`);
    expect(await db.as<{ name: string }>(ALICE, 'select name from folders')).toEqual([
      { name: 'Campaign 2' },
    ]);
  });

  it('does not show one person the other person folders', async () => {
    expect(await db.as(BOB, 'select name from folders')).toEqual([]);
  });

  it('refuses a folder created under someone else id', async () => {
    const message = await denied(
      db.as(BOB, `insert into folders (user_id, name) values ($1, 'Theirs')`, [ALICE]),
    );
    expect(message).toMatch(/row-level security/);
  });

  it('cannot rename a folder it cannot see, and does not say whether one exists', async () => {
    expect(await db.as(BOB, `update folders set name = 'Mine now' returning id`)).toEqual([]);
  });

  it('cannot delete a folder it cannot see', async () => {
    await db.as(BOB, 'delete from folders');
    expect(await db.as<{ name: string }>(ALICE, 'select name from folders')).toEqual([
      { name: 'Campaign 2' },
    ]);
  });
});

describe('prompts', () => {
  it('keeps one person prompts to themselves', async () => {
    await promptFor(ALICE, 'Dragon, wide');
    await promptFor(BOB, 'A quiet kitchen');
    expect(await db.as<{ title: string }>(ALICE, 'select title from prompts')).toEqual([
      { title: 'Dragon, wide' },
    ]);
    expect(await db.as<{ title: string }>(BOB, 'select title from prompts')).toEqual([
      { title: 'A quiet kitchen' },
    ]);
  });

  it('refuses to file a prompt in a folder belonging to someone else', async () => {
    const folders = await db.as<{ id: string }>(
      BOB,
      `insert into folders (user_id, name) values ($1, 'Bob work') returning id`,
      [BOB],
    );
    const folder = folders[0];
    expect(folder).toBeDefined();
    const message = await denied(
      db.as(
        ALICE,
        `insert into prompts (user_id, folder_id, model_id, title)
         values ($1, $2, 'midjourney', 'Sneaking in')`,
        [ALICE, folder?.id],
      ),
    );
    expect(message).toMatch(/folder does not belong to this user/);
  });

  it('files a prompt in a folder of its own without complaint', async () => {
    const folders = await db.as<{ id: string }>(
      ALICE,
      `insert into folders (user_id, name) values ($1, 'Dragons') returning id`,
      [ALICE],
    );
    const rows = await db.as<{ folder_id: string }>(
      ALICE,
      `insert into prompts (user_id, folder_id, model_id, title)
       values ($1, $2, 'midjourney', 'Filed') returning folder_id`,
      [ALICE, folders[0]?.id],
    );
    expect(rows[0]?.folder_id).toBe(folders[0]?.id);
  });

  it('touches updated_at on a change, so the library can order by most recent', async () => {
    const id = await promptFor(ALICE, 'Before');
    const before = await db.as<{ updated_at: Date }>(
      ALICE,
      'select updated_at from prompts where id = $1',
      [id],
    );
    await db.as(ALICE, `update prompts set title = 'After' where id = $1`, [id]);
    const after = await db.as<{ updated_at: Date }>(
      ALICE,
      'select updated_at from prompts where id = $1',
      [id],
    );
    expect(after[0]?.updated_at.getTime()).toBeGreaterThanOrEqual(
      before[0]?.updated_at.getTime() ?? 0,
    );
  });
});

describe('recipes and pins', () => {
  it('keeps recipes to their owner', async () => {
    await db.as(
      ALICE,
      `insert into recipes (user_id, name, model_id, locked_fields)
       values ($1, 'Basement documentary', 'midjourney', array['lens','light'])`,
      [ALICE],
    );
    expect(await db.as<{ name: string }>(ALICE, 'select name from recipes')).toEqual([
      { name: 'Basement documentary' },
    ]);
    expect(await db.as(BOB, 'select name from recipes')).toEqual([]);
  });

  it('keeps pins to their owner', async () => {
    await db.as(ALICE, `insert into pins (user_id, model_id, position) values ($1, 'veo', 0)`, [
      ALICE,
    ]);
    expect(await db.as<{ model_id: string }>(ALICE, 'select model_id from pins')).toEqual([
      { model_id: 'veo' },
    ]);
    expect(await db.as(BOB, 'select model_id from pins')).toEqual([]);
  });
});

describe('shares', () => {
  it('refuses to share a prompt belonging to someone else', async () => {
    const bobs = await promptFor(BOB, 'Bob private prompt');
    const message = await denied(
      db.as(ALICE, `insert into shares (user_id, prompt_id, slug) values ($1, $2, $3)`, [
        ALICE,
        bobs,
        slug('steal'),
      ]),
    );
    expect(message).toMatch(/prompt does not belong to this user/);
  });

  it('refuses a slug short enough to guess', async () => {
    const id = await promptFor(ALICE, 'Short slug');
    const message = await denied(
      db.as(ALICE, `insert into shares (user_id, prompt_id, slug) values ($1, $2, 'abc')`, [
        ALICE,
        id,
      ]),
    );
    expect(message).toMatch(/check constraint/);
  });

  it('gives an anonymous reader the one share whose slug they hold', async () => {
    const id = await promptFor(ALICE, 'The dragon, shared');
    const s = slug('shared');
    await db.as(ALICE, `insert into shares (user_id, prompt_id, slug) values ($1, $2, $3)`, [
      ALICE,
      id,
      s,
    ]);
    const rows = await db.anon<{ title: string; brief: Record<string, string> }>(
      'select title, brief from share_by_slug($1)',
      [s],
    );
    expect(rows[0]?.title).toBe('The dragon, shared');
    expect(rows[0]?.brief).toEqual({ subject: 'a dragon' });
  });

  it('gives an anonymous reader nothing without the slug', async () => {
    const message = await denied(db.anon('select title from prompts'));
    expect(message).toMatch(/permission denied/);
    expect(
      await db.anon('select title from share_by_slug($1)', [slug('not-a-real-share')]),
    ).toEqual([]);
  });

  it('stops serving a share once it has expired', async () => {
    const id = await promptFor(ALICE, 'Expired');
    const s = slug('expired');
    await db.as(
      ALICE,
      `insert into shares (user_id, prompt_id, slug, expires_at)
       values ($1, $2, $3, now() - interval '1 day')`,
      [ALICE, id, s],
    );
    expect(await db.anon('select title from share_by_slug($1)', [s])).toEqual([]);
  });

  it('takes the share down when the prompt is deleted', async () => {
    const id = await promptFor(ALICE, 'Deleted later');
    const s = slug('deleted');
    await db.as(ALICE, `insert into shares (user_id, prompt_id, slug) values ($1, $2, $3)`, [
      ALICE,
      id,
      s,
    ]);
    await db.as(ALICE, 'delete from prompts where id = $1', [id]);
    expect(await db.anon('select title from share_by_slug($1)', [s])).toEqual([]);
  });
});
