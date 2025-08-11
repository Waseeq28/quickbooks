import type { SupabaseClient } from '@supabase/supabase-js'

export interface UserTeamSummary {
  teamId: string
  role: 'admin' | 'accountant' | 'viewer'
  isCurrent: boolean
  team: {
    name: string
    memberCount: number
  }
}

/**
 * Fetch the current user's teams and mark which one is current.
 * Requires RLS policies from migrations to be applied.
 */
export async function fetchUserTeamsSummary(
  supabase: SupabaseClient
): Promise<UserTeamSummary[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) return []

  // Get current team id from profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_team_id')
    .eq('id', user.id)
    .single()

  const currentTeamId = profile?.current_team_id as string | null

  // Get memberships (no join yet for maximum compatibility)
  const { data: memberships, error: memberError } = await supabase
    .from('team_members')
    .select('team_id, role')
    .eq('user_id', user.id)

  if (memberError) throw memberError
  if (!memberships || memberships.length === 0) return []

  const teamIds = Array.from(new Set(memberships.map((m: any) => m.team_id as string)))

  // Fetch team names
  const { data: teamsData } = await supabase
    .from('teams')
    .select('id, name')
    .in('id', teamIds)
  const nameMap = new Map<string, string>((teamsData || []).map((t: any) => [t.id as string, t.name as string]))

  // For small teams, fetch member counts per team id (simple approach for now)
  const counts = await Promise.all(
    teamIds.map(async (id) => {
      const { count } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', id)
      return { id, count: count ?? 0 }
    })
  )

  const countMap = new Map(counts.map((c) => [c.id, c.count]))

  return memberships.map((m: any) => {
    const teamId = m.team_id as string
    const name = nameMap.get(teamId) || 'Untitled Team'
    const role = m.role as UserTeamSummary['role']
    return {
      teamId,
      role,
      isCurrent: currentTeamId === teamId,
      team: {
        name,
        memberCount: countMap.get(teamId) ?? 0,
      },
    }
  })
}


