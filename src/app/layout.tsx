import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthzProvider } from "@/components/providers/AuthzProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "QuickBooks Invoice Manager",
  description: "AI-powered invoice management with QuickBooks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${inter.className} min-h-screen bg-background antialiased`}
      >
        <AuthzProvider>{children}</AuthzProvider>
        <Toaster />
      </body>
    </html>
  );
}
