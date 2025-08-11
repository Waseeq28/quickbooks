-- Redefine membership helper functions as SECURITY DEFINER to avoid RLS recursion

create or replace function public.is_team_member(team uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = team and user_id = auth.uid()
  );
$$;

create or replace function public.is_team_admin(team uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = team and user_id = auth.uid() and role = 'admin'
  );
$$;

-- Optional: grant execute so they can be used directly if needed
grant execute on function public.is_team_member(uuid) to authenticated;
grant execute on function public.is_team_admin(uuid) to authenticated;


