-- Allow users to select their own membership rows directly (non-recursive)
drop policy if exists "team_members: select own memberships" on public.team_members;
create policy "team_members: select own memberships"
  on public.team_members for select
  using (user_id = auth.uid());


