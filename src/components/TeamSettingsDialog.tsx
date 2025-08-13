"use client";

import { useState } from "react";
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
} from "@/lib/teams";
import { useAuthz } from "@/components/AuthzProvider";
import { toTitleCaseRole, type TeamRole } from "@/lib/authz";
import { useEffect } from "react";
import { InviteMemberDialog } from "@/components/InviteMemberDialog";

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
}

export function TeamSettingsDialog({
  open,
  onOpenChange,
  user,
  onTeamUpdate,
}: TeamSettingsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentTeamName, setCurrentTeamName] = useState("No Team Selected");
  const [currentTeamRole, setCurrentTeamRole] = useState<
    "admin" | "accountant" | "viewer"
  >("viewer");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const supabase = createClient();
  const { can, isAdmin } = useAuthz();
  const [isQbConnected, setIsQbConnected] = useState<boolean>(false);

  // Load current team and members; listen for team switching events
  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const ctx = await fetchCurrentTeamContext(supabase);
      setCurrentTeamId(ctx.teamId);
      if (!ctx.teamId) {
        setCurrentTeamName("No Team Selected");
        setTeamMembers([]);
        return;
      }
      setCurrentTeamName(ctx.teamName || "Team");
      const roleLower = (ctx.currentUserRole || "viewer") as
        | "admin"
        | "accountant"
        | "viewer";
      setCurrentTeamRole(roleLower);
      setUserRole(toTitleCaseRole(roleLower));

      const members = await fetchTeamMembers(supabase, ctx.teamId);
      setTeamMembers(
        members.map((m) => ({
          ...m,
          role: toTitleCaseRole(m.role as TeamRole),
        }))
      );

      // Reset form defaults
      setTeamName(ctx.teamName || "Team");
      // already set above
    };

    const handleTeamSwitch = () => {
      load();
    };
    const handleTeamCreated = () => {
      load();
    };
    load();

    window.addEventListener("teamSwitched", handleTeamSwitch);
    window.addEventListener("teamCreated", handleTeamCreated);
    return () => {
      window.removeEventListener("teamSwitched", handleTeamSwitch);
      window.removeEventListener("teamCreated", handleTeamCreated);
    };
  }, [supabase]);

  // Load QuickBooks connection for current team
  useEffect(() => {
    const loadConn = async () => {
      if (!currentTeamId) { setIsQbConnected(false); return; }
      const { data, error } = await supabase
        .from('quickbooks_connections')
        .select('realm_id, expires_at')
        .eq('team_id', currentTeamId)
        .single();
      if (error) { setIsQbConnected(false); return; }
      setIsQbConnected(!!data);
    };
    loadConn();
  }, [supabase, currentTeamId]);

  // Initialize form fields with current team data
  const [teamName, setTeamName] = useState(currentTeamName);
  const [userRole, setUserRole] = useState<string>(
    toTitleCaseRole(currentTeamRole as TeamRole)
  );

  const handleSave = async () => {
    if (!currentTeamId) return;
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updates: Array<() => Promise<any>> = [];

      // Rename team (admin only)
      const trimmedName = teamName.trim();
      if (isAdmin && trimmedName && trimmedName !== currentTeamName) {
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
      if (isAdmin && trimmedName && trimmedName !== currentTeamName) {
        setCurrentTeamName(trimmedName);
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
    setTeamName(currentTeamName);
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
              {currentTeamName === "No Team Selected"
                ? "Team Settings"
                : currentTeamName}
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
                      currentTeamName === "No Team Selected"
                        ? "Enter team name"
                        : currentTeamName
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

            {/* QuickBooks Connection (admin only) */}
            {can('team:update') && (
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
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        fetch('/api/quickbooks/disconnect', { method: 'DELETE' })
                          .then(() => {
                            toast.success('Disconnected QuickBooks for this team');
                            setIsQbConnected(false);
                            onTeamUpdate?.();
                          })
                      }
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="ml-2">
                    <form action="/api/quickbooks/connect" method="get">
                      <Button type="submit" variant="outline" size="sm" className="gap-2 bg-background">
                        <ExternalLink className="h-4 w-4" />
                        Connect
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Team Members */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members
                  </h3>
                  {currentTeamName !== "No Team Selected" && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentTeamName} • {teamMembers.length} members
                    </p>
                  )}
                </div>
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
        teamName={currentTeamName}
        onMemberInvited={() => {
          // Optionally refresh team members or show success message
          toast.success("Team member invited successfully!");
        }}
      />
    </>
  );
}
