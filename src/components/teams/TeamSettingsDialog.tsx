"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Building2,
  Users,
  UserCheck,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  PlugZap,
  Check,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  fetchUserTeamsSummary,
  fetchCurrentTeamContext,
  fetchTeamMembers,
  updateTeamName,
  updateOwnTeamRole,
  removeTeamMember,
  updateTeamMemberRole,
} from "@/services/teams";
import type {
  ServerCurrentTeamContext,
  ServerTeamMember,
} from "@/services/teams-server";
import { useAuthz } from "@/components/providers/AuthzProvider";
import { toTitleCaseRole, type TeamRole } from "@/lib/authz";
import { InviteMemberDialog } from "./InviteMemberDialog";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface TeamSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
      team?: string;
      role?: string;
    };
  };
  onTeamUpdate?: () => void;
  currentTeamName?: string;
  initialTeamContext?: ServerCurrentTeamContext | null;
  initialTeamMembers?: ServerTeamMember[];
  initialQbConnected?: boolean;
}

export function TeamSettingsDialog({
  open,
  onOpenChange,
  user,
  onTeamUpdate,
  currentTeamName,
  initialTeamContext,
  initialTeamMembers = [],
  initialQbConnected = false,
}: TeamSettingsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(
    initialTeamContext?.teamId || null
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [teamDisplayName, setTeamDisplayName] = useState(
    initialTeamContext?.teamName || currentTeamName || "No Team Selected"
  );
  const [currentTeamRole, setCurrentTeamRole] = useState<
    "admin" | "accountant" | "viewer"
  >(initialTeamContext?.currentUserRole || "viewer");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(
    initialTeamMembers.map((m) => ({
      ...m,
      role: toTitleCaseRole(m.role as TeamRole),
    }))
  );
  const supabase = createClient();
  const { can, isAdmin } = useAuthz();
  const [isQbConnected, setIsQbConnected] =
    useState<boolean>(initialQbConnected);

  // Update state when initial data changes
  useEffect(() => {
    if (initialTeamContext) {
      setCurrentTeamId(initialTeamContext.teamId);
      setTeamDisplayName(initialTeamContext.teamName || "No Team Selected");
      setCurrentTeamRole(initialTeamContext.currentUserRole || "viewer");
      setTeamName(initialTeamContext.teamName || "");
      setUserRole(
        toTitleCaseRole(
          (initialTeamContext.currentUserRole || "viewer") as TeamRole
        )
      );
    }
    setTeamMembers(
      initialTeamMembers.map((m) => ({
        ...m,
        role: toTitleCaseRole(m.role as TeamRole),
      }))
    );
    setIsQbConnected(initialQbConnected);
  }, [initialTeamContext, initialTeamMembers, initialQbConnected]);

  // Get current user ID for auth operations
  useEffect(() => {
    if (!open) return;

    const getCurrentUser = async () => {
      try {
        const authPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Auth timeout")), 3000)
        );

        const {
          data: { user },
        } = (await Promise.race([authPromise, timeoutPromise])) as any;
        if (user) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.log(
          "TeamSettingsDialog: Failed to get current user, keeping existing state"
        );
      }
    };

    getCurrentUser();

    // Listen for team events only
    const handleTeamSwitch = () => {
      // On team switch, the page will refetch server-side data and update props
      console.log("Team switched, waiting for new props...");
    };
    const handleTeamCreated = () => {
      console.log("Team created, waiting for new props...");
    };

    window.addEventListener("teamSwitched", handleTeamSwitch);
    window.addEventListener("teamCreated", handleTeamCreated);

    return () => {
      window.removeEventListener("teamSwitched", handleTeamSwitch);
      window.removeEventListener("teamCreated", handleTeamCreated);
    };
  }, [supabase, open]);

  // QuickBooks connection is now handled via initialQbConnected prop

  // Initialize form fields with current team data
  const [teamName, setTeamName] = useState(
    initialTeamContext?.teamName || currentTeamName || ""
  );
  const [userRole, setUserRole] = useState<string>(
    toTitleCaseRole(
      (initialTeamContext?.currentUserRole || "viewer") as TeamRole
    )
  );

  const handleSave = async () => {
    if (!currentTeamId) return;
    setIsLoading(true);
    try {
      // Add timeout to auth call
      const authPromise = supabase.auth.getUser();
      const authTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Auth timeout")), 5000)
      );

      const {
        data: { user },
      } = (await Promise.race([authPromise, authTimeoutPromise])) as any;
      if (!user) throw new Error("Not authenticated");

      const updates: Array<() => Promise<any>> = [];

      // Rename team (admin only)
      const trimmedName = teamName?.trim() || "";
      if (isAdmin && trimmedName && trimmedName !== teamDisplayName) {
        updates.push(async () =>
          updateTeamName(supabase, currentTeamId, trimmedName)
        );
      }

      // Change own role (admin only)
      const desiredRoleLower = userRole.toLowerCase() as
        | "admin"
        | "accountant"
        | "viewer";
      if (isAdmin && desiredRoleLower !== currentTeamRole) {
        updates.push(async () =>
          updateOwnTeamRole(supabase, currentTeamId, user.id, desiredRoleLower)
        );
      }

      for (const op of updates) {
        const { error } = await op();
        if (error) throw error;
      }

      // Refresh local state
      if (isAdmin && trimmedName && trimmedName !== teamDisplayName) {
        setTeamDisplayName(trimmedName);
      }
      if (isAdmin && desiredRoleLower !== currentTeamRole) {
        setCurrentTeamRole(desiredRoleLower);
        setUserRole(toTitleCaseRole(desiredRoleLower));
      }

      toast.success("Team settings updated successfully");
      setIsEditing(false);
      onTeamUpdate?.();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("teamUpdated"));
      }
    } catch (e: any) {
      toast.error("Failed to save team settings", {
        description: e?.message || "Unexpected error",
      });
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    setTeamName(teamDisplayName);
    setUserRole(toTitleCaseRole(currentTeamRole as TeamRole));
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg border-2 border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {teamDisplayName === "No Team Selected"
                ? "Team Settings"
                : teamDisplayName}
            </DialogTitle>
            <DialogDescription>
              Manage your team information and member details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Team Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teamName" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Team Name
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    disabled={!isEditing || !can("team:update")}
                    placeholder={
                      teamDisplayName === "No Team Selected"
                        ? "Enter team name"
                        : teamDisplayName
                    }
                    className="flex-1"
                  />
                  {!isEditing && can("team:update") && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsEditing(true)}
                      className="shrink-0"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userRole" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Your Role
                </Label>
                <div className="flex gap-2">
                  <select
                    id="userRole"
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    disabled={!isEditing || !can("member:update")}
                    className="flex h-10 w-full mt-0 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option>Admin</option>
                    <option>Accountant</option>
                    <option>Viewer</option>
                  </select>
                  {!isEditing && can("team:update") && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsEditing(true)}
                      className="shrink-0"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* QuickBooks Connection (visible to all; actions restricted) */}
            {can("quickbooks:status:read") && (
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <PlugZap className="h-4 w-4" />
                  QuickBooks Connection
                </Label>
                {isQbConnected ? (
                  <div className="ml-2 flex items-center gap-2">
                    <Button type="button" variant="default" size="sm" disabled>
                      Connected
                    </Button>
                    {can("team:update") && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          fetch("/api/quickbooks/disconnect", {
                            method: "DELETE",
                          }).then(() => {
                            toast.success(
                              "Disconnected QuickBooks for this team"
                            );
                            setIsQbConnected(false);
                            onTeamUpdate?.();
                          })
                        }
                      >
                        Disconnect
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="ml-2 flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" disabled>
                      Not connected
                    </Button>
                    {can("team:update") && (
                      <form action="/api/quickbooks/connect" method="get">
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          className="gap-2 bg-background"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Connect
                        </Button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Team Members */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                  <span className="text-xs font-medium text-muted-foreground ml-2">
                    {teamMembers.length} members
                  </span>
                </h3>
                {can("member:invite") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-background"
                    onClick={() => setShowInviteDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Invite Member
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/30 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-sm">{member.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {can("member:update") && isEditing ? (
                        <select
                          className="px-2 py-1 text-xs rounded-md border border-border bg-background"
                          value={member.role}
                          onChange={async (e) => {
                            if (!currentTeamId) return;
                            const newRoleTitle = e.target.value as
                              | "Admin"
                              | "Accountant"
                              | "Viewer";
                            const newRole = newRoleTitle.toLowerCase() as
                              | "admin"
                              | "accountant"
                              | "viewer";
                            const { error } = await updateTeamMemberRole(
                              supabase,
                              currentTeamId,
                              member.id,
                              newRole
                            );
                            if (error) {
                              toast.error("Failed to update role", {
                                description: error.message,
                              });
                              return;
                            }
                            const updated = teamMembers.map((m) =>
                              m.id === member.id
                                ? { ...m, role: newRoleTitle }
                                : m
                            );
                            setTeamMembers(updated);
                            toast.success("Member role updated");
                          }}
                        >
                          <option>Admin</option>
                          <option>Accountant</option>
                          <option>Viewer</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            member.role === "Admin"
                              ? "bg-primary/10 text-primary"
                              : currentUserId && member.id === currentUserId
                              ? "bg-green-500/10 text-green-400"
                              : member.role === "Accountant"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-slate-500/10 text-slate-500"
                          }`}
                        >
                          {member.role}
                        </span>
                      )}
                      {can("member:remove") && isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (!currentTeamId) return;
                            const { error } = await removeTeamMember(
                              supabase,
                              currentTeamId,
                              member.id
                            );
                            if (error) {
                              toast.error("Failed to remove member", {
                                description: error.message,
                              });
                            } else {
                              toast.success("Member removed");
                              const updated = teamMembers.filter(
                                (m) => m.id !== member.id
                              );
                              setTeamMembers(updated);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {can("team:update") && isEditing && (
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <InviteMemberDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        teamName={teamDisplayName}
        onMemberInvited={() => {
          toast.success("Team member invited successfully!");
        }}
      />
    </>
  );
}
