import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthzProvider } from "@/components/providers/AuthzProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { getServerAuthzContext } from "@/utils/authz-server";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "QuickBooks Invoice Manager",
  description: "AI-powered invoice management with QuickBooks.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get server-side auth data for AuthzProvider
  let initialAuthz = null;
  try {
    initialAuthz = await getServerAuthzContext();
  } catch (error) {
    // User not authenticated, let AuthzProvider handle it
  }

  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${inter.className} min-h-screen bg-background antialiased`}
      >
        <AuthzProvider
          initialTeamId={initialAuthz?.teamId || null}
          initialRole={initialAuthz?.role || null}
        >
          {children}
        </AuthzProvider>
        <Toaster />
        {/* <SpeedInsights /> */}
        {/* <Analytics /> */}
      </body>
    </html>
  );
}
