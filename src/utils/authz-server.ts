import { createClient } from "@/utils/supabase/server";
import type { TeamRole, Action } from "@/lib/authz";
import { canRole } from "@/lib/authz";

export type AuthzContext = {
  userId: string;
  teamId: string;
  role: TeamRole;
};

export async function getServerAuthzContext(): Promise<AuthzContext> {
  console.log("🔍 [AUTHZ] Getting server authz context...");
  
  const supabase = await createClient();
  console.log("🔍 [AUTHZ] Supabase client created");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("🔍 [AUTHZ] User from auth:", user ? `ID: ${user.id}` : "No user");
  
  if (!user) {
    console.log("❌ [AUTHZ] No authenticated user");
    throw Object.assign(new Error("Not authenticated"), { status: 401 });
  }

  console.log("🔍 [AUTHZ] Fetching profile for user:", user.id);
  // Resolve current team from profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("current_team_id")
    .eq("id", user.id)
    .single();

  console.log("🔍 [AUTHZ] Profile query result:", { profile, profileError });

  if (profileError) {
    console.log("❌ [AUTHZ] Profile error:", profileError);
    throw Object.assign(
      new Error(`Failed to load profile: ${profileError.message}`),
      { status: 500 },
    );
  }

  const teamId = profile?.current_team_id as string | null;
  console.log("🔍 [AUTHZ] Team ID from profile:", teamId);
  
  if (!teamId) {
    console.log("❌ [AUTHZ] No team selected");
    throw Object.assign(new Error("No team selected"), { status: 400 });
  }

  console.log("🔍 [AUTHZ] Fetching team membership for user:", user.id, "team:", teamId);
  // Resolve role in team
  const { data: tm, error: tmError } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .single();

  console.log("🔍 [AUTHZ] Team membership query result:", { tm, tmError });

  if (tmError) {
    console.log("❌ [AUTHZ] Team membership error:", tmError);
    throw Object.assign(new Error("Not a member of the current team"), {
      status: 403,
    });
  }

  const role = tm?.role as TeamRole;
  console.log("✅ [AUTHZ] Success! Role:", role);
  return { userId: user.id, teamId, role };
}

export async function requirePermission(action: Action): Promise<AuthzContext> {
  const ctx = await getServerAuthzContext();
  if (!canRole(ctx.role, action)) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
  return ctx;
}
