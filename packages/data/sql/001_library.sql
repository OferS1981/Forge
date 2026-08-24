-- The library. One migration, tables and policies together, because section 13 says the policies
-- are written before the tables are used and separating them invites a window where they are not.
--
-- Assumed to exist, because Supabase provides them: the `auth` schema with `auth.users` and
-- `auth.uid()`, and the `anon` and `authenticated` roles. `test/harness.ts` creates exactly those
-- and nothing else, so this file runs unedited against both.
--
-- Every table here follows the same three lines: enable row level security, force it so that even
-- the table owner is subject to it, and grant the two roles only the verbs they need.

-- ---------------------------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  handle      text unique check (handle ~ '^[a-z0-9][a-z0-9-]{1,30}$'),
  settings    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

-- A profile is private. Nothing about who made a prompt appears on a share page, so there is no
-- reason for anyone but the owner to read this row.
create policy profiles_owner on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

grant select, insert, update, delete on public.profiles to authenticated;

-- ---------------------------------------------------------------------------------------------
-- folders
-- ---------------------------------------------------------------------------------------------

create table public.folders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index folders_user_idx on public.folders (user_id, position);

alter table public.folders enable row level security;
alter table public.folders force row level security;

create policy folders_owner on public.folders
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.folders to authenticated;

-- ---------------------------------------------------------------------------------------------
-- prompts
-- ---------------------------------------------------------------------------------------------
--
-- `brief` is the brief as JSON and there is no column for the rendered string. Section 13's own
-- reason: a stored brief can be re-forged when a model changes or translated to another model, and
-- a stored string is dead. `score` is what section 13 calls `heat`, renamed to the word the product
-- uses.

create table public.prompts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  folder_id   uuid references public.folders (id) on delete set null,
  model_id    text not null check (char_length(model_id) between 1 and 60),
  brief       jsonb not null default '{}'::jsonb,
  title       text not null check (char_length(title) between 1 and 140),
  score       integer not null default 0 check (score between 0 and 100),
  mode        text not null default 'simple' check (mode in ('simple', 'advanced')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index prompts_user_idx on public.prompts (user_id, updated_at desc);

alter table public.prompts enable row level security;
alter table public.prompts force row level security;

create policy prompts_owner on public.prompts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Deliberately no policy for `anon`. A shared prompt is read through share_by_slug below, which
-- returns the one row whose slug the reader already holds. Granting anon a select here instead
-- would let anyone list every prompt anyone had ever shared.
grant select, insert, update, delete on public.prompts to authenticated;

-- A folder belonging to someone else must not be usable as a destination. The row level policy
-- checks the prompt's owner, not the folder's, so the link needs its own guard.
create or replace function public.prompts_folder_is_own() returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if new.folder_id is not null
     and not exists (
       select 1 from public.folders f where f.id = new.folder_id and f.user_id = new.user_id
     )
  then
    raise exception 'folder does not belong to this user';
  end if;
  return new;
end;
$$;

create trigger prompts_folder_is_own_trigger
  before insert or update on public.prompts
  for each row execute function public.prompts_folder_is_own();

create or replace function public.touch_updated_at() returns trigger
  language plpgsql
  set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger prompts_touch_updated_at
  before update on public.prompts
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------------------------
-- recipes
-- ---------------------------------------------------------------------------------------------

create table public.recipes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 80),
  model_id      text not null check (char_length(model_id) between 1 and 60),
  brief         jsonb not null default '{}'::jsonb,
  locked_fields text[] not null default '{}',
  created_at    timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.recipes enable row level security;
alter table public.recipes force row level security;

create policy recipes_owner on public.recipes
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.recipes to authenticated;

-- ---------------------------------------------------------------------------------------------
-- pins
-- ---------------------------------------------------------------------------------------------

create table public.pins (
  user_id     uuid not null references auth.users (id) on delete cascade,
  model_id    text not null check (char_length(model_id) between 1 and 60),
  position    integer not null default 0,
  primary key (user_id, model_id)
);

alter table public.pins enable row level security;
alter table public.pins force row level security;

create policy pins_owner on public.pins
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.pins to authenticated;

-- ---------------------------------------------------------------------------------------------
-- shares
-- ---------------------------------------------------------------------------------------------
--
-- `user_id` is not in section 13's sketch. Deriving ownership through a subquery on the prompt
-- would run on every row of every policy check and would make the prompts policy and the shares
-- policy depend on each other. One column removes both problems.
--
-- There is no `view_count`. It is per-share analytics and CLAUDE.md says no analytics.
--
-- The slug is minted by the client from a cryptographic random source, so the check constraint is
-- what stops a client choosing a short guessable one. Twenty-two characters of base32 is a hundred
-- and ten bits, which is not worth guessing at.

create table public.shares (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  prompt_id   uuid not null references public.prompts (id) on delete cascade,
  slug        text not null unique check (slug ~ '^[a-z0-9]{22}$'),
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index shares_prompt_idx on public.shares (prompt_id);

alter table public.shares enable row level security;
alter table public.shares force row level security;

create policy shares_owner on public.shares
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.shares to authenticated;

-- Sharing someone else's prompt would be a way to publish it. The owner check on `shares` alone
-- does not stop that, because the row's own user_id would be the sharer's.
create or replace function public.shares_prompt_is_own() returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if not exists (
    select 1 from public.prompts p where p.id = new.prompt_id and p.user_id = new.user_id
  )
  then
    raise exception 'prompt does not belong to this user';
  end if;
  return new;
end;
$$;

create trigger shares_prompt_is_own_trigger
  before insert or update on public.shares
  for each row execute function public.shares_prompt_is_own();

-- The one thing an anonymous reader may do: exchange a slug they already hold for the brief behind
-- it. Security definer, so it sees past the prompts policy, and it takes an exact slug so it cannot
-- be used to enumerate anything. An expired share returns no rows rather than an error.
create or replace function public.share_by_slug(p_slug text)
  returns table (
    slug       text,
    title      text,
    model_id   text,
    brief      jsonb,
    mode       text,
    score      integer,
    created_at timestamptz
  )
  language sql
  stable
  security definer
  set search_path = public
as $$
  select s.slug, p.title, p.model_id, p.brief, p.mode, p.score, p.created_at
  from public.shares s
  join public.prompts p on p.id = s.prompt_id
  where s.slug = p_slug
    and (s.expires_at is null or s.expires_at > now());
$$;

revoke all on function public.share_by_slug(text) from public;
grant execute on function public.share_by_slug(text) to anon, authenticated;

grant usage on schema public to anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- What may be called over the API
-- ---------------------------------------------------------------------------------------------
--
-- PostgREST exposes every function in `public` as an endpoint under /rest/v1/rpc/. The three
-- trigger functions above exist only to fire on a write and have no business being callable, so
-- their execute rights are taken away by name. `share_by_slug` keeps its grant: that one is the
-- single thing an anonymous reader is meant to be able to call, and `rls.test.ts` asserts that the
-- list is exactly these three revoked and that one granted.
--
-- This is here because Supabase's own linter found it and the policy tests could not: PGlite has no
-- REST layer, so nothing in Node can see which functions the API would publish.

revoke execute on function public.prompts_folder_is_own() from public, anon, authenticated;
revoke execute on function public.shares_prompt_is_own() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- What an anonymous visitor may reach
-- ---------------------------------------------------------------------------------------------
--
-- Supabase grants every new table in `public` to `anon` by default, so without these lines an
-- anonymous request reaches the table and is turned back by row level security alone: it comes back
-- as an empty list rather than a refusal. That is the correct outcome from one layer of defence,
-- and these tables want two.
--
-- An anonymous visitor has exactly one thing to do, which is exchange a share slug for the brief
-- behind it, and `share_by_slug` is security definer, so it needs no table rights of its own.
--
-- Found by probing the deployed API, not by the tests: PGlite has no default privileges to grant,
-- so the test database was stricter than production. The test below now asserts the state these
-- lines create, which makes it true of both.

revoke all on public.profiles from anon;
revoke all on public.folders from anon;
revoke all on public.prompts from anon;
revoke all on public.recipes from anon;
revoke all on public.pins from anon;
revoke all on public.shares from anon;

-- And for anything added later, so a new table does not quietly arrive readable.
alter default privileges in schema public revoke all on tables from anon;
