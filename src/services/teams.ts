import type { SupabaseClient } from "@supabase/supabase-js";

export interface UserTeamSummary {
  teamId: string;
  role: "admin" | "accountant" | "viewer";
  isCurrent: boolean;
  team: {
    name: string;
    memberCount: number;
  };
}

export interface CurrentTeamContext {
  teamId: string | null;
  teamName: string | null;
  currentUserRole: "admin" | "accountant" | "viewer" | null;
}

export interface TeamMemberRow {
  id: string;
  name: string;
  email: string;
  role: "admin" | "accountant" | "viewer";
  avatar?: string;
}

export async function fetchUserTeamsSummary(
  supabase: SupabaseClient,
): Promise<UserTeamSummary[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_team_id")
    .eq("id", user.id)
    .single();

  const currentTeamId = profile?.current_team_id as string | null;

  const { data: memberships, error: memberError } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id);

  if (memberError) throw memberError;
  if (!memberships || memberships.length === 0) return [];

  const teamIds = Array.from(
    new Set(memberships.map((m: any) => m.team_id as string)),
  );

  const { data: teamsData } = await supabase
    .from("teams")
    .select("id, name")
    .in("id", teamIds);
  const nameMap = new Map<string, string>(
    (teamsData || []).map((t: any) => [t.id as string, t.name as string]),
  );

  const counts = await Promise.all(
    teamIds.map(async (id) => {
      const { count } = await supabase
        .from("team_members")
        .select("*", { count: "exact", head: true })
        .eq("team_id", id);
      return { id, count: count ?? 0 };
    }),
  );

  const countMap = new Map(counts.map((c) => [c.id, c.count]));

  return (memberships || []).map((m: any) => {
    const teamId = m.team_id as string;
    const name = nameMap.get(teamId) || "Untitled Team";
    const role = m.role as UserTeamSummary["role"];
    return {
      teamId,
      role,
      isCurrent: currentTeamId === teamId,
      team: {
        name,
        memberCount: countMap.get(teamId) ?? 0,
      },
    };
  });
}

export async function fetchCurrentTeamContext(
  supabase: SupabaseClient,
): Promise<CurrentTeamContext> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { teamId: null, teamName: null, currentUserRole: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_team_id")
    .eq("id", user.id)
    .single();

  const teamId = (profile?.current_team_id as string) || null;
  if (!teamId) return { teamId: null, teamName: null, currentUserRole: null };

  const { data: teamRow } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .single();

  const { data: myMember } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .single();

  return {
    teamId,
    teamName: teamRow?.name ?? null,
    currentUserRole:
      (myMember?.role as CurrentTeamContext["currentUserRole"]) ?? null,
  };
}

export async function fetchTeamMembers(
  supabase: SupabaseClient,
  teamId: string,
): Promise<TeamMemberRow[]> {
  const { data: memberRows } = await supabase
    .from("team_members")
    .select("user_id, role")
    .eq("team_id", teamId);

  const userIds = (memberRows || []).map((m: any) => m.user_id as string);
  if (userIds.length === 0) return [];

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email")
    .in("id", userIds);

  const profileMap = new Map(
    (profileRows || []).map((p: any) => [p.id as string, p]),
  );

  return (memberRows || []).map((m: any) => {
    const p = profileMap.get(m.user_id as string);
    return {
      id: m.user_id as string,
      name: (p?.full_name as string) || "Member",
      email: (p?.email as string) || "",
      role: (m.role as TeamMemberRow["role"]) || "viewer",
      avatar: (p?.avatar_url as string) || undefined,
    };
  });
}

export async function updateTeamName(
  supabase: SupabaseClient,
  teamId: string,
  name: string,
) {
  return await supabase.from("teams").update({ name }).eq("id", teamId);
}

export async function updateOwnTeamRole(
  supabase: SupabaseClient,
  teamId: string,
  userId: string,
  role: "admin" | "accountant" | "viewer",
) {
  return await supabase
    .from("team_members")
    .update({ role })
    .eq("team_id", teamId)
    .eq("user_id", userId);
}

export async function removeTeamMember(
  supabase: SupabaseClient,
  teamId: string,
  userId: string,
) {
  return await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);
}

export async function updateTeamMemberRole(
  supabase: SupabaseClient,
  teamId: string,
  userId: string,
  role: "admin" | "accountant" | "viewer",
) {
  return await supabase
    .from("team_members")
    .update({ role })
    .eq("team_id", teamId)
    .eq("user_id", userId);
}
