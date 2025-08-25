import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getServerAuthzContext } from "@/utils/authz-server";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );

    const { teamId, role } = await getServerAuthzContext();
    if (!teamId || role !== "admin") {
      const url = new URL("/error", request.url);
      const response = NextResponse.redirect(url);
      response.cookies.set(
        "app_err_title",
        !teamId ? "No team selected" : "Forbidden",
        { path: "/" },
      );
      response.cookies.set(
        "app_err_message",
        !teamId
          ? "Please select a team before connecting QuickBooks."
          : "Only team admins can connect QuickBooks.",
        { path: "/" },
      );
      response.cookies.set("app_err_back", "/", { path: "/" });
      return response;
    }

    const clientId = process.env.QB_CLIENT_ID;
    if (!clientId) {
      const url = new URL("/error", request.url);
      const response = NextResponse.redirect(url);
      response.cookies.set("app_err_title", "Configuration error", {
        path: "/",
      });
      response.cookies.set(
        "app_err_message",
        "QB_CLIENT_ID is not configured.",
        { path: "/" },
      );
      response.cookies.set("app_err_back", "/", { path: "/" });
      return response;
    }

    const state = crypto.randomBytes(16).toString("hex");

    const baseUrl = "https://appcenter.intuit.com/connect/oauth2";
    const appBaseUrl = process.env.APP_URL || "http://localhost:3000";
    const redirectUri = `${appBaseUrl}/api/quickbooks/callback`;

    const authUrl = new URL(baseUrl);
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("scope", "com.intuit.quickbooks.accounting");
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("state", state);

    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set("qb_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 15,
    });
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
