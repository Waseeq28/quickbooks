-- RPC to create a team, add creator as admin, and set current_team_id
-- Usage: select public.create_team('My Team');

create or replace function public.create_team(team_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_team_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.teams(name, created_by)
  values (team_name, auth.uid())
  returning id into new_team_id;

  -- Make the creator an admin member
  insert into public.team_members(team_id, user_id, role)
  values (new_team_id, auth.uid(), 'admin')
  on conflict do nothing;

  -- Ensure profile exists and set current team
  insert into public.profiles(id, current_team_id)
  values (auth.uid(), new_team_id)
  on conflict (id) do update
  set current_team_id = excluded.current_team_id;

  return new_team_id;
end;
$$;

-- Allow authenticated users to execute
grant execute on function public.create_team(text) to authenticated;


