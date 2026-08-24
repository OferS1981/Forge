-- The counters, and who may read them.
--
-- Forge's promise is that nothing personal ever leaves the browser: no prompts, no briefs, no
-- identity. What this table holds is the other kind of fact entirely: that on some day, some
-- browser struck some model, with nothing attached to say whose browser it was. Events are a
-- fixed vocabulary written through one function; rows are readable only by the admin emails
-- listed below, and writable by nobody at all.

create table usage_counts (
  day   date not null default (current_date),
  event text not null check (event ~ '^[a-z0-9:_-]{1,64}$'),
  n     bigint not null default 0,
  primary key (day, event)
);

create table admin_emails (
  email text primary key
);

alter table usage_counts enable row level security;
alter table usage_counts force row level security;
alter table admin_emails enable row level security;
alter table admin_emails force row level security;

-- Reading the counts is for the person who runs Forge, named by email. The check runs as the
-- function owner so the admin list itself never needs to be readable by any client role.
create or replace function is_forge_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_emails where email = (auth.jwt() ->> 'email')
  );
$$;

revoke execute on function is_forge_admin() from public;
grant execute on function is_forge_admin() to authenticated;

create policy usage_counts_admin_read on usage_counts
  for select
  using (is_forge_admin());

-- Nobody inserts, updates or deletes through the API: the function below is the only writer,
-- and the admin list is managed in the dashboard, not from a browser.

revoke all on usage_counts from anon, authenticated;
revoke all on admin_emails from anon, authenticated;
grant select on usage_counts to authenticated;

-- One counter, one function. SECURITY DEFINER so the anonymous role can bump a count without
-- being able to read or write the table; the event vocabulary is enforced by the same check the
-- table carries, so garbage never lands.
create or replace function record_use(p_event text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event !~ '^[a-z0-9:_-]{1,64}$' then
    return;
  end if;
  insert into usage_counts as u (day, event, n)
  values (current_date, p_event, 1)
  on conflict (day, event) do update set n = u.n + 1;
end;
$$;

revoke execute on function record_use(text) from public;
grant execute on function record_use(text) to anon, authenticated;
