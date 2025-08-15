import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { requirePermission } from "@/utils/authz-server";

type InviteBody = {
  email?: string;
  role?: string; // "Admin" | "Accountant" | "Viewer"
};

export async function POST(request: Request) {
  try {
    const { teamId } = await requirePermission("member:invite");

    const body = (await request.json()) as InviteBody;
    const email = (body.email || "").trim();
    const roleTitle = (body.role || "Viewer").trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    const role =
      roleTitle.toLowerCase() === "admin"
        ? "admin"
        : roleTitle.toLowerCase() === "accountant"
        ? "accountant"
        : "viewer";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration missing" },
        { status: 500 },
      );
    }

    const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const url = new URL(request.url);
    const origin = url.origin;
    const redirectTo = `${origin}/auth/callback?next=/`;

    // First attempt with redirectTo; if any error, retry without it
    let inviteRes = await admin.auth.admin.inviteUserByEmail(email, {
      data: { invited_team_id: teamId, invited_role: role },
      redirectTo,
    });
    if (inviteRes.error) {
      inviteRes = await admin.auth.admin.inviteUserByEmail(email, {
        data: { invited_team_id: teamId, invited_role: role },
      });
    }

    let invitedUserId: string | null = inviteRes.data?.user?.id ?? null;

    if (inviteRes.error || !invitedUserId) {
      // If the user already exists, add them to the team anyway
      const { data: existing, error: existingErr } = await admin
        .from("auth.users")
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle();
      if (existingErr || !existing?.id) {
        return NextResponse.json(
          { error: inviteRes.error?.message || "Failed to send invite" },
          { status: 400 },
        );
      }
      invitedUserId = existing.id as string;
    }

    // Pre-create team membership for the invited user so they have access on first login
    const { error: memberErr } = await admin
      .from("team_members")
      .insert({ team_id: teamId, user_id: invitedUserId as string, role });
    if (memberErr && (memberErr as any).code !== "23505") {
      // Best-effort: surface but don't fail the invite that already went out
      return NextResponse.json(
        { error: `Invite sent but failed to add to team: ${memberErr.message}` },
        { status: 202 },
      );
    }

    // Best-effort ensure a profiles row exists with the email
    await admin.from("profiles").upsert(
      { id: invitedUserId as string, email },
      { onConflict: "id" },
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e?.status && Number.isInteger(e.status) ? e.status : 500;
    return NextResponse.json(
      { error: e?.message || "Unexpected server error" },
      { status },
    );
  }
}


