import { createClient } from "@/utils/supabase/server";
import type { TeamRole, Action } from "@/lib/authz";
import { canRole } from "@/lib/authz";

export type AuthzContext = {
  userId: string;
  teamId: string;
  role: TeamRole;
};

export async function getServerAuthzContext(): Promise<AuthzContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    throw Object.assign(new Error("Not authenticated"), { status: 401 });
  }

  // Resolve current team from profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("current_team_id")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw Object.assign(
      new Error(`Failed to load profile: ${profileError.message}`),
      { status: 500 },
    );
  }

  const teamId = profile?.current_team_id as string | null;
  
  if (!teamId) {
    throw Object.assign(new Error("No team selected"), { status: 400 });
  }

  // Resolve role in team
  const { data: tm, error: tmError } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .single();

  if (tmError) {
    throw Object.assign(new Error("Not a member of the current team"), {
      status: 403,
    });
  }

  const role = tm?.role as TeamRole;
  return { userId: user.id, teamId, role };
}

export async function requirePermission(action: Action): Promise<AuthzContext> {
  const ctx = await getServerAuthzContext();
  if (!canRole(ctx.role, action)) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
  return ctx;
}
