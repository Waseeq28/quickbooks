"use client";

import { UserMenu } from "../UserMenu";
import Image from "next/image";
import { toTitleCaseRole } from "@/lib/authz";
import type { TeamRole } from "@/lib/authz";
import type {
  ServerUserTeamSummary,
  ServerCurrentTeamContext,
  ServerTeamMember,
} from "@/services/teams-server";

type UserData = {
  id: string;
  email: string;
  user_metadata?: any;
  teamName: string;
} | null;

type AuthzData = {
  userId: string;
  teamId: string;
  role: TeamRole;
} | null;

type DialogData = {
  userTeams: ServerUserTeamSummary[] | null;
  teamContext: ServerCurrentTeamContext | null;
  teamMembers: ServerTeamMember[] | null;
  isQbConnected: boolean;
};

interface HeaderProps {
  initialUser?: UserData;
  initialAuthz?: AuthzData;
  dialogData?: DialogData;
}

export function Header({ initialUser, initialAuthz, dialogData }: HeaderProps) {
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
              {initialAuthz?.role
                ? toTitleCaseRole(initialAuthz.role)
                : "Member"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {initialUser && (
              <UserMenu
                user={{
                  email: initialUser.email,
                  user_metadata: {
                    full_name: initialUser.user_metadata?.full_name,
                    avatar_url: initialUser.user_metadata?.avatar_url,
                  },
                }}
                teamName={initialUser.teamName}
                dialogData={dialogData}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
