import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { DatabaseService } from "@/services/quickbooks-connections";
import { getServerAuthzContext } from "@/utils/authz-server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        `
        <html>
          <body>
            <h1>Authentication Required</h1>
            <p>Please sign in first before connecting to QuickBooks.</p>
            <p><a href="/login">Sign In</a></p>
          </body>
        </html>
      `,
        { headers: { "Content-Type": "text/html" }, status: 401 },
      );
    }
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const realmId = searchParams.get("realmId");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    const storedState = request.cookies.get("qb_oauth_state")?.value;

    if (error) {
      return new Response(
        `
        <html><body><h1>QuickBooks Connection Failed</h1><p>Error: ${error}</p><p><a href="/">Go back to app</a></p></body></html>
      `,
        { headers: { "Content-Type": "text/html" } },
      );
    }

    if (state !== storedState) {
      return new Response(
        `
        <html><body><h1>Invalid State / CSRF Detected</h1><p>The state parameter doesn't match. Please try connecting again.</p><p><a href="/">Go back</a></p></body></html>
      `,
        { headers: { "Content-Type": "text/html" }, status: 400 },
      );
    }

    if (!code || !realmId) {
      return new Response(
        `
        <html><body><h1>Invalid OAuth Response</h1><p>Missing authorization code or company ID</p><p><a href="/">Go back to app</a></p></body></html>
      `,
        { headers: { "Content-Type": "text/html" } },
      );
    }

    const tokenResponse = await fetch(
      "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          // Build callback URL from app base URL; prefer APP_URL, fallback to localhost for dev
          redirect_uri: `${process.env.APP_URL || "http://localhost:3000"}/api/quickbooks/callback`,
        }),
      },
    );

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokens = await tokenResponse.json();

    try {
      const { teamId, role } = await getServerAuthzContext();
      if (role !== "admin") {
        const url = new URL("/error", request.url);
        const response = NextResponse.redirect(url);
        response.cookies.set("app_err_title", "Forbidden", { path: "/" });
        response.cookies.set(
          "app_err_message",
          "Only team admins can connect QuickBooks.",
          { path: "/" },
        );
        response.cookies.set("app_err_back", "/", { path: "/" });
        return response;
      }
      await DatabaseService.saveQuickBooksConnectionForTeam(
        teamId,
        tokens.access_token,
        tokens.refresh_token,
        realmId!,
        tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : undefined,
      );

      const responseHtml = `
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>QuickBooks Connected</title>
            <style>
              :root { color-scheme: light dark; }
              * { box-sizing: border-box; }
              html, body { height: 100%; margin: 0; }
              body {
                display: grid;
                place-items: center;
                font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
                background: radial-gradient(1200px 600px at 10% -10%, rgba(59,130,246,.08), transparent),
                            radial-gradient(1200px 600px at 110% 110%, rgba(16,185,129,.08), transparent);
                padding: 24px;
              }
              .card {
                width: min(560px, 92vw);
                border: 1px solid rgba(148,163,184,.3);
                border-radius: 14px;
                padding: 24px;
                background: rgb(17 24 39 / 0.75);
                backdrop-filter: blur(8px);
                color: #e5e7eb;
              }
              .title { display: flex; align-items: center; gap: 12px; margin: 0 0 8px; font-size: 1.25rem; font-weight: 700; }
              .subtitle { margin: 0 0 20px; color: #94a3b8; font-size: .95rem; }
              .row { display: flex; gap: 12px; align-items: center; justify-content: space-between; }
              .badge { padding: 4px 10px; border-radius: 999px; font-size: .75rem; background: rgba(16,185,129,.15); color: #34d399; border: 1px solid rgba(16,185,129,.3); }
              .actions { display: flex; gap: 10px; margin-top: 16px; }
              .btn { padding: 8px 14px; border-radius: 10px; border: 1px solid rgba(148,163,184,.3); color: #e5e7eb; text-decoration: none; font-weight: 600; }
              .btn:hover { border-color: rgba(59,130,246,.5); }
              .btn-primary { background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.45); color: #93c5fd; }
              .hint { color: #94a3b8; font-size: .8rem; margin-top: 8px; }
            </style>
            <script>
              // Soft-redirect back to app after a moment
              setTimeout(() => { window.location.replace('/'); }, 1500);
            </script>
          </head>
          <body>
            <section class="card">
              <h1 class="title">✅ QuickBooks Connected</h1>
              <p class="subtitle">Your QuickBooks account has been securely connected and linked to your team.</p>
              <div class="row">
                <span class="badge">Connected</span>
              </div>
              <div class="actions">
                <a class="btn btn-primary" href="/">Go to Dashboard</a>
                <a class="btn" href="/docs">View Docs</a>
              </div>
              <p class="hint">You will be redirected automatically.</p>
            </section>
          </body>
        </html>`;
      const response = new NextResponse(responseHtml, {
        headers: { "Content-Type": "text/html" },
      });
      response.cookies.set("qb_oauth_state", "", { maxAge: -1 });
      return response;
    } catch (dbError: any) {
      const message = (dbError?.message || "").toLowerCase();
      const isUniqueRealm =
        message.includes("duplicate key value") ||
        message.includes("qbo_conns_unique_realm");
      const isAppGuard = (dbError as any)?.code === "REALM_ALREADY_LINKED";
      const friendly = isUniqueRealm
        ? "This QuickBooks company is already linked to another team. Please switch to that team or choose a different company."
        : isAppGuard
          ? "This QuickBooks company is already linked to another team. Please switch teams or connect a different company."
          : `QuickBooks connection was successful, but we couldn't save your credentials.`;
      const status = isUniqueRealm || isAppGuard ? 409 : 500;
      return new Response(
        `<html><body><h1>Connection Stored Failed</h1><p>${friendly}</p><p>Error: ${dbError.message}</p><p><a href="/">Go back</a></p></body></html>`,
        { headers: { "Content-Type": "text/html" }, status },
      );
    }
  } catch (error: any) {
    return new Response(
      `<html><body><h1>OAuth Callback Error</h1><p>Error: ${error.message}</p><p><a href="/">Go back to app</a></p></body></html>`,
      { headers: { "Content-Type": "text/html" } },
    );
  }
}
