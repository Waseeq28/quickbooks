"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileDialog } from "@/components/profile";
import { TeamSettingsDialog } from "@/components/teams";
import { toast } from "sonner";
// Supabase-backed current team name will be loaded dynamically
import { useEffect } from "react";
import { LogOut, User, Building2, ChevronDown } from "lucide-react";

interface UserMenuProps {
  user: {
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
      team?: string;
      role?: string;
    };
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [teamSettingsOpen, setTeamSettingsOpen] = useState(false);
  const [currentTeamName, setCurrentTeamName] = useState("No Team Selected");
  const router = useRouter();
  const supabase = createClient();

  // Load current team name and refresh on team events
  useEffect(() => {
    const load = async () => {
      // Use passed-in user instead of re-reading from auth
      const currentUserId = (user as any)?.id as string | undefined;
      if (!currentUserId) {
        setCurrentTeamName("No Team Selected");
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("current_team_id, team:current_team_id(name)")
        .eq("id", currentUserId)
        .single();
      if (error) {
        setCurrentTeamName("No Team Selected");
        return;
      }
      const name = (data as any)?.team?.name as string | undefined;
      setCurrentTeamName(name || "No Team Selected");
    };

    load();

    const handleTeamSwitch = () => {
      load();
    };
    const handleTeamCreated = () => {
      load();
    };
    window.addEventListener("teamSwitched", handleTeamSwitch);
    window.addEventListener("teamCreated", handleTeamCreated);
    return () => {
      window.removeEventListener("teamSwitched", handleTeamSwitch);
      window.removeEventListener("teamCreated", handleTeamCreated);
    };
  }, [supabase]);

  const handleUserUpdate = async () => {
    // Refresh from DB
    const currentUserId = (user as any)?.id as string | undefined;
    if (!currentUserId) {
      setCurrentTeamName("No Team Selected");
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("current_team_id, team:current_team_id(name)")
      .eq("id", currentUserId)
      .single();
    const name = (data as any)?.team?.name as string | undefined;
    setCurrentTeamName(name || "No Team Selected");
  };

  const handleSignOut = async () => {
    setIsLoading(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      handleSignOutError(error.message);
    } else {
      handleSignOutSuccess();
    }

    setIsLoading(false);
  };

  const handleSignOutSuccess = () => {
    toast.success("Signed out successfully");
    router.push("/login");
  };

  const handleSignOutError = (errorMessage: string) => {
    toast.error("Failed to sign out", {
      description: errorMessage,
    });
  };

  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 px-3 rounded-full border border-border/10 hover:border-border/20"
            disabled={isLoading}
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={user.user_metadata?.avatar_url}
                  alt={displayName}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:block">
                {displayName}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-56 p-2 border-2 border-gray-800"
        >
          {/* <DropdownMenuLabel className="font-normal text-xs text-muted-foreground px-2 pb-2">
            {user.email}
          </DropdownMenuLabel> */}

          <DropdownMenuItem
            className="py-2"
            onClick={() => setProfileOpen(true)}
          >
            <User className="mr-2 h-4 w-4" />
            <span>My Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="py-2"
            onClick={() => setTeamSettingsOpen(true)}
          >
            <Building2 className="mr-2 h-4 w-4" />
            <span>
              {currentTeamName === "No Team Selected"
                ? "Team Settings"
                : currentTeamName}
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-2" />

          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={isLoading}
            className="py-2"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isLoading ? "Signing out..." : "Sign out"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={user}
        onUserUpdate={handleUserUpdate}
      />

      <TeamSettingsDialog
        open={teamSettingsOpen}
        onOpenChange={setTeamSettingsOpen}
        user={user}
        onTeamUpdate={handleUserUpdate}
      />
    </>
  );
}
