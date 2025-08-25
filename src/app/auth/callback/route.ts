import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  let next = request.nextUrl.searchParams.get("next") ?? "/";

  if (!next.startsWith("/")) {
    // if "next" is not a relative URL, use the default
    next = "/";
  }

  // Compute the correct post-auth origin (handles load balancer/preview envs)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const destOrigin = isLocalEnv
    ? request.nextUrl.origin
    : forwardedHost
      ? `https://${forwardedHost}`
      : request.nextUrl.origin;

  const redirectUrl = new URL(next, destOrigin);
  const response = NextResponse.redirect(redirectUrl);

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Ensure a profiles row exists for this user (Task 2 bootstrap)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            full_name: user.user_metadata?.full_name ?? null,
            avatar_url: user.user_metadata?.avatar_url ?? null,
            email: user.email ?? null,
          },
          { onConflict: "id" },
        );
      }

      return response;
    }
  }

  // return the user to login page with error
  const errorResponse = NextResponse.redirect(
    new URL("/login?error=auth_failed", request.nextUrl.origin),
  );
  return errorResponse;
}
