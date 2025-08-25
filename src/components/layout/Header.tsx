"use client";

import { useMemo } from "react";
import { UserMenu } from "../UserMenu";
import Image from "next/image";
import { useAuthz } from "@/components/providers/AuthzProvider";
import { toTitleCaseRole } from "@/lib/authz";

export function Header() {
  const { role, user } = useAuthz();
  const safeUser = useMemo(() => user ?? null, [user]);

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
            {safeUser && <UserMenu user={safeUser} />}
          </div>
        </div>
      </div>
    </header>
  );
}
