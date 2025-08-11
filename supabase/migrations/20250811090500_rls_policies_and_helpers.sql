-- RLS, policies, and helper functions (separate from core schema for clarity)

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- Helper functions to check membership/admin rights
create or replace function public.is_team_member(team uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.team_members
    where team_id = team and user_id = auth.uid()
  );
$$;

create or replace function public.is_team_admin(team uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.team_members
    where team_id = team and user_id = auth.uid() and role = 'admin'
  );
$$;

-- Profiles policies (self only)
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  using (id = auth.uid());

drop policy if exists "profiles: upsert own" on public.profiles;
create policy "profiles: upsert own"
  on public.profiles for insert
  with check (id = auth.uid());

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and (
      current_team_id is null
      or exists (
        select 1 from public.team_members tm
        where tm.team_id = current_team_id and tm.user_id = auth.uid()
      )
    )
  );

-- Teams policies
drop policy if exists "teams: select members only" on public.teams;
create policy "teams: select members only"
  on public.teams for select
  using (public.is_team_member(id));

drop policy if exists "teams: insert any authenticated" on public.teams;
create policy "teams: insert any authenticated"
  on public.teams for insert
  with check (auth.uid() is not null);

drop policy if exists "teams: update admin only" on public.teams;
create policy "teams: update admin only"
  on public.teams for update
  using (public.is_team_admin(id));

drop policy if exists "teams: delete admin only" on public.teams;
create policy "teams: delete admin only"
  on public.teams for delete
  using (public.is_team_admin(id));

-- Team members policies
drop policy if exists "team_members: select members only" on public.team_members;
create policy "team_members: select members only"
  on public.team_members for select
  using (public.is_team_member(team_id));

drop policy if exists "team_members: insert admin only" on public.team_members;
create policy "team_members: insert admin only"
  on public.team_members for insert
  with check (public.is_team_admin(team_id));

drop policy if exists "team_members: update admin only" on public.team_members;
create policy "team_members: update admin only"
  on public.team_members for update
  using (public.is_team_admin(team_id))
  with check (public.is_team_admin(team_id));

drop policy if exists "team_members: delete admin only" on public.team_members;
create policy "team_members: delete admin only"
  on public.team_members for delete
  using (public.is_team_admin(team_id));

-- Trigger to maintain updated_at on profiles
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();


