import { NextResponse } from "next/server";
import { getServerAuthzContext } from "@/utils/authz-server";
import { DatabaseService } from "@/lib/database";

// Disconnect current team's QuickBooks connection (admin only)
export async function DELETE() {
  try {
    const { teamId, role } = await getServerAuthzContext();
    if (role !== "admin") {
      return NextResponse.json(
        { error: "Only team admins can disconnect QuickBooks" },
        { status: 403 },
      );
    }
    await DatabaseService.deleteQuickBooksConnectionForTeam(teamId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to disconnect" },
      { status: 500 },
    );
  }
}
