import { Header } from "@/components/layout/Header";
import { getServerAuthzContext } from "@/utils/authz-server";
import { createClient } from "@/utils/supabase/server";
import { InvoiceManagementClient } from "./InvoiceManagementClient";

export default async function InvoiceManagement() {
  // Fetch user and auth data server-side
  let userData = null;
  let authzData = null;

  try {
    const authzContext = await getServerAuthzContext();
    authzData = authzContext;

    // Get user details for display
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && authzContext.teamId) {
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
    }
  } catch (error) {
    // Auth failed, components will handle no-auth state
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header initialUser={userData} initialAuthz={authzData} />
      <InvoiceManagementClient />
    </div>
  );
}
