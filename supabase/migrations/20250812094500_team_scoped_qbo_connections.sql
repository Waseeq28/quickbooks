-- Team-scoped QuickBooks connections
-- This migration renames any existing user-scoped table and creates a new team-scoped table

-- 1) Preserve existing user-scoped data (if present) by renaming the table
do $$
begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'quickbooks_connections'
  ) then
    -- If a user-scoped table existed, rename it for archival/reference
    execute 'alter table public.quickbooks_connections rename to quickbooks_user_connections';
  end if;
end$$;

-- 2) Create team-scoped table
create table if not exists public.quickbooks_connections (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  realm_id text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id)
);

-- 3) Updated-at helper (idempotent)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists t_quickbooks_connections_updated on public.quickbooks_connections;
create trigger t_quickbooks_connections_updated
before update on public.quickbooks_connections
for each row execute function public.set_updated_at();

-- 4) Enable RLS
alter table public.quickbooks_connections enable row level security;

-- These helpers are expected from prior migrations:
-- public.is_team_member(team uuid) returns boolean
-- public.is_team_admin(team uuid) returns boolean

-- 5) Policies
drop policy if exists "qbo_conns: select members only" on public.quickbooks_connections;
create policy "qbo_conns: select members only"
  on public.quickbooks_connections for select
  using (public.is_team_member(team_id));

drop policy if exists "qbo_conns: insert admin only" on public.quickbooks_connections;
create policy "qbo_conns: insert admin only"
  on public.quickbooks_connections for insert
  with check (public.is_team_admin(team_id));

drop policy if exists "qbo_conns: update admin only" on public.quickbooks_connections;
create policy "qbo_conns: update admin only"
  on public.quickbooks_connections for update
  using (public.is_team_admin(team_id))
  with check (public.is_team_admin(team_id));

drop policy if exists "qbo_conns: delete admin only" on public.quickbooks_connections;
create policy "qbo_conns: delete admin only"
  on public.quickbooks_connections for delete
  using (public.is_team_admin(team_id));

-- 6) Optional indexes
create index if not exists qbo_conns_team_idx on public.quickbooks_connections(team_id);


