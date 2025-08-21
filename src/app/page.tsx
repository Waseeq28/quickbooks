import { Header } from "@/components/layout/Header";
import { getServerAuthzContext } from "@/utils/authz-server";
import { createClient } from "@/utils/supabase/server";
import { InvoiceManagementClient } from "./InvoiceManagementClient";
import {
  fetchUserTeamsSummaryServer,
  fetchCurrentTeamContextServer,
  fetchTeamMembersServer,
  fetchQuickBooksConnectionServer,
} from "@/services/teams-server";

export default async function InvoiceManagement() {
  // Fetch user and auth data server-side
  let userData = null;
  let authzData = null;
  let userTeams = null;
  let teamContext = null;
  let teamMembers = null;
  let isQbConnected = false;

  try {
    const authzContext = await getServerAuthzContext();
    authzData = authzContext;

    // Get user details for display
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && authzContext.teamId && user.email) {
      // Get team name for display
      const { data: team } = await supabase
        .from("teams")
        .select("name")
        .eq("id", authzContext.teamId)
        .single();

      userData = {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        teamName: team?.name || "No Team Selected",
      };

      // Fetch data for dialogs
      try {
        userTeams = await fetchUserTeamsSummaryServer(user.id);
        teamContext = await fetchCurrentTeamContextServer(user.id);
        if (authzContext.teamId) {
          teamMembers = await fetchTeamMembersServer(authzContext.teamId);
          isQbConnected = await fetchQuickBooksConnectionServer(
            authzContext.teamId
          );
        }
      } catch (dialogDataError) {
        console.log("Failed to fetch dialog data:", dialogDataError);
        // Continue without dialog data - dialogs will show loading states
      }
    }
  } catch (error) {
    // Auth failed, components will handle no-auth state
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        initialUser={userData}
        initialAuthz={authzData}
        dialogData={{
          userTeams,
          teamContext,
          teamMembers,
          isQbConnected,
        }}
      />
      <InvoiceManagementClient />
    </div>
  );
}
