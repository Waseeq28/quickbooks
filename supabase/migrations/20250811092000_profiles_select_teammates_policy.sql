-- Allow users to read profiles of users who share a team with them
drop policy if exists "profiles: select teammates" on public.profiles;
create policy "profiles: select teammates"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.team_members tm_self
      join public.team_members tm_other
        on tm_other.team_id = tm_self.team_id
      where tm_self.user_id = auth.uid()
        and tm_other.user_id = public.profiles.id
    )
  );


