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
import { Building2, Users, UserCheck, Plus, Edit3, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { getCurrentTeam, getTeamMembers, mockUserTeams } from "@/lib/mock-data";
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
  const [currentTeam, setCurrentTeam] = useState(getCurrentTeam());
  const [currentTeamName, setCurrentTeamName] = useState(
    currentTeam?.name || "No Team Selected"
  );
  const [currentTeamRole, setCurrentTeamRole] = useState(
    currentTeam
      ? mockUserTeams.find((ut) => ut.teamId === currentTeam.id)?.role ||
          "Viewer"
      : "Viewer"
  );
  const [teamMembers, setTeamMembers] = useState(
    currentTeam ? getTeamMembers(currentTeam.id) : []
  );
  const supabase = createClient();

  // Listen for team switching events
  useEffect(() => {
    const handleTeamSwitch = () => {
      const newCurrentTeam = getCurrentTeam();
      setCurrentTeam(newCurrentTeam);
      setCurrentTeamName(newCurrentTeam?.name || "No Team Selected");
      setCurrentTeamRole(
        newCurrentTeam
          ? mockUserTeams.find((ut) => ut.teamId === newCurrentTeam.id)?.role ||
              "Viewer"
          : "Viewer"
      );
      setTeamMembers(newCurrentTeam ? getTeamMembers(newCurrentTeam.id) : []);
      // Reset form fields to new team data
      setTeamName(newCurrentTeam?.name || "No Team Selected");
      setUserRole(
        newCurrentTeam
          ? mockUserTeams.find((ut) => ut.teamId === newCurrentTeam.id)?.role ||
              "Viewer"
          : "Viewer"
      );
    };

    const handleTeamCreated = () => {
      const newCurrentTeam = getCurrentTeam();
      setCurrentTeam(newCurrentTeam);
      setCurrentTeamName(newCurrentTeam?.name || "No Team Selected");
      setCurrentTeamRole(
        newCurrentTeam
          ? mockUserTeams.find((ut) => ut.teamId === newCurrentTeam.id)?.role ||
              "Viewer"
          : "Viewer"
      );
      setTeamMembers(newCurrentTeam ? getTeamMembers(newCurrentTeam.id) : []);
      // Reset form fields to new team data
      setTeamName(newCurrentTeam?.name || "No Team Selected");
      setUserRole(
        newCurrentTeam
          ? mockUserTeams.find((ut) => ut.teamId === newCurrentTeam.id)?.role ||
              "Viewer"
          : "Viewer"
      );
    };

    window.addEventListener("teamSwitched", handleTeamSwitch);
    window.addEventListener("teamCreated", handleTeamCreated);
    return () => {
      window.removeEventListener("teamSwitched", handleTeamSwitch);
      window.removeEventListener("teamCreated", handleTeamCreated);
    };
  }, []);

  // Initialize form fields with current team data
  const [teamName, setTeamName] = useState(currentTeamName);
  const [userRole, setUserRole] = useState(currentTeamRole);

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          team: teamName,
          role: userRole,
        },
      });

      if (error) {
        toast.error("Failed to save team settings", {
          description: error.message,
        });
      } else {
        toast.success("Team settings updated successfully");
        setIsEditing(false);
        onTeamUpdate?.();
      }
    } catch (error) {
      toast.error("Failed to save team settings", {
        description: "An unexpected error occurred",
      });
    }

    setIsLoading(false);
  };

  const handleCancel = () => {
    setTeamName(currentTeamName);
    setUserRole(currentTeamRole);
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
                    disabled={!isEditing}
                    placeholder={
                      currentTeamName === "No Team Selected"
                        ? "Enter team name"
                        : currentTeamName
                    }
                    className="flex-1"
                  />
                  {!isEditing && (
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
                  <Input
                    id="userRole"
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your role"
                    className="flex-1"
                  />
                  {!isEditing && (
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
                {currentTeamRole === "Admin" && (
                  <Button
                    size="sm"
                    className="gap-2"
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
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          member.role === "Admin"
                            ? "bg-primary/10 text-primary"
                            : member.role === "Accountant"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-slate-500/10 text-slate-500"
                        }`}
                      >
                        {member.role}
                      </span>
                      {isEditing && member.id !== "1" && (
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
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
