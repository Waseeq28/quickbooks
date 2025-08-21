"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/utils/supabase/client";
import type { Action, TeamRole } from "@/lib/authz";
import { canRole } from "@/lib/authz";

type AuthzContextState = {
  loading: boolean;
  teamId: string | null;
  role: TeamRole | null;
  can: (action: Action) => boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
};

const AuthzContext = createContext<AuthzContextState | undefined>(undefined);

export function AuthzProvider({
  children,
  initialTeamId = null,
  initialRole = null,
}: {
  children: React.ReactNode;
  initialTeamId?: string | null;
  initialRole?: TeamRole | null;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(initialTeamId);
  const [role, setRole] = useState<TeamRole | null>(initialRole);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setTeamId(null);
        setRole(null);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_team_id")
        .eq("id", user.id)
        .single();
      const currentTeamId = (profile?.current_team_id as string) || null;
      setTeamId(currentTeamId);
      if (!currentTeamId) {
        setRole(null);
        return;
      }
      const { data: tm } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", currentTeamId)
        .eq("user_id", user.id)
        .single();
      setRole((tm?.role as TeamRole) || null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // Only refresh if we don't have initial data
    if (initialTeamId === null && initialRole === null) {
      refresh();
    }

    const onTeamSwitched = () => refresh();
    const onTeamUpdated = () => refresh();
    window.addEventListener("teamSwitched", onTeamSwitched);
    window.addEventListener("teamUpdated", onTeamUpdated);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => refresh());

    return () => {
      window.removeEventListener("teamSwitched", onTeamSwitched);
      window.removeEventListener("teamUpdated", onTeamUpdated);
      subscription.unsubscribe();
    };
  }, [refresh, supabase, initialTeamId, initialRole]);

  const value = useMemo<AuthzContextState>(
    () => ({
      loading,
      teamId,
      role,
      can: (action: Action) => canRole(role, action),
      isAdmin: role === "admin",
      refresh,
    }),
    [loading, teamId, role, refresh]
  );

  return (
    <AuthzContext.Provider value={value}>{children}</AuthzContext.Provider>
  );
}

export function useAuthz() {
  const ctx = useContext(AuthzContext);
  if (!ctx) throw new Error("useAuthz must be used within AuthzProvider");
  return ctx;
}

export function PermissionGate({
  action,
  children,
}: {
  action: Action;
  children: React.ReactNode;
}) {
  const { can } = useAuthz();
  if (!can(action)) return null;
  return <>{children}</>;
}
