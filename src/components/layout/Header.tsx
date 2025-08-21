"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { UserMenu } from "../UserMenu";
import Image from "next/image";
import { useAuthz } from "@/components/providers/AuthzProvider";
import { toTitleCaseRole } from "@/lib/authz";

export function Header() {
  const { role, loading } = useAuthz();
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  console.log(
    "🔍 [Header] Component rendering. User state:",
    user ? `${user.email} (ID: ${user.id})` : "null"
  );

  useEffect(() => {
    console.log("🔍 [Header] useEffect starting - loading user...");

    const load = async () => {
      console.log("🔍 [Header] Getting user from auth...");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log(
        "🔍 [Header] Auth result:",
        user ? `User ID: ${user.id}, Email: ${user.email}` : "No user"
      );
      setUser(user ?? null);
      console.log(
        "🔍 [Header] User state set to:",
        user ? "user object" : "null"
      );
    };

    load().catch((err) => {
      console.log("❌ [Header] Load function failed:", err);
      setUser(null);
    });

    console.log("🔍 [Header] Setting up auth state change listener...");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(
        "🔍 [Header] Auth state changed:",
        event,
        session?.user ? `User: ${session.user.email}` : "No user"
      );
      load();
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <header className="sticky top-0 z-50 w-full glass-effect border-b border-border/50 shadow-lg backdrop-blur-md">
      <div className="px-4 lg:px-6">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="relative">
              {/* QL AI Logo */}
              <Image
                src="/new-icon.png"
                alt="QL AI Logo"
                width={24}
                height={24}
                className="w-10 h-10 rounded-xl shadow-xl"
              />
            </div>

            <div className="space-y-1">
              <h1 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Waldo's AI QuickBooks
              </h1>
            </div>
          </div>

          {/* Current role for selected team */}
          <div className="flex items-center justify-center flex-1">
            <p className="text-xl font-semibold text-primary">
              {role ? toTitleCaseRole(role) : "Member"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {(() => {
              console.log(
                "🔍 [Header] Conditional render check. User exists:",
                !!user
              );
              return user && <UserMenu user={user} />;
            })()}
          </div>
        </div>
      </div>
    </header>
  );
}
