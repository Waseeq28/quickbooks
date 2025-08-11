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
import { User, Mail, Edit3, Building2, UserCheck, Users, Check, Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import type { UserTeamSummary } from "@/lib/teams";
import { fetchUserTeamsSummary } from "@/lib/teams";
import { useEffect } from "react";
import { CreateTeamDialog } from "@/components/CreateTeamDialog";
import { useAuthz } from "@/components/AuthzProvider";

interface ProfileDialogProps {
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
  onUserUpdate?: () => void;
}

export function ProfileDialog({ open, onOpenChange, user, onUserUpdate }: ProfileDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.user_metadata?.full_name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [userTeams, setUserTeams] = useState<UserTeamSummary[]>([]);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const supabase = createClient();
  const { can } = useAuthz();

  // Load teams and listen for team events
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchUserTeamsSummary(supabase);
        setUserTeams(data);
      } catch {
        setUserTeams([]);
      }
    };
    if (open) {
      load();
    }

    const handleTeamSwitch = () => { load(); };
    const handleTeamCreated = () => { load(); };

    window.addEventListener('teamSwitched', handleTeamSwitch);
    window.addEventListener('teamCreated', handleTeamCreated);
    return () => {
      window.removeEventListener('teamSwitched', handleTeamSwitch);
      window.removeEventListener('teamCreated', handleTeamCreated);
    };
  }, [supabase, open]);

  const handleTeamSwitch = async (teamId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ current_team_id: teamId })
        .eq('id', user.id);

      if (error) {
        toast.error('Failed to switch team', { description: error.message });
        return;
      }

      toast.success('Team switched successfully');
      const data = await fetchUserTeamsSummary(supabase);
      setUserTeams(data);
      // Notify other components to refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('teamSwitched', { detail: { teamId } }));
      }
      onUserUpdate?.();
    } catch (e: any) {
      toast.error('Failed to switch team', { description: e?.message || 'Unexpected error' });
    }
  };

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          full_name: name
        }
      });

      if (error) {
        toast.error("Failed to save changes", {
          description: error.message,
        });
      } else {
        toast.success("Profile updated successfully");
        setIsEditing(false);
        // Notify parent component to refresh user data
        onUserUpdate?.();
      }
    } catch (error) {
      toast.error("Failed to save changes", {
        description: "An unexpected error occurred",
      });
    }
    
    setIsLoading(false);
  };

  const handleCancel = () => {
    setName(user.user_metadata?.full_name || "");
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Profile Settings
          </DialogTitle>
          <DialogDescription>
            Manage your account information and preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Name
              </Label>
              <div className="flex gap-2">
                                 <Input
                   id="name"
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   disabled={!isEditing}
                   placeholder="Enter your name"
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
               <Label htmlFor="email" className="flex items-center gap-2">
                 <Mail className="h-4 w-4" />
                 Email Address
               </Label>
               <Input
                 id="email"
                 value={user.email || ""}
                 disabled
                 className="bg-muted/50"
               />
               <p className="text-xs text-muted-foreground">
                 Email address cannot be changed from this interface.
               </p>
             </div>


           </div>

           {/* User Teams */}
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <h3 className="text-lg font-semibold flex items-center gap-2">
                 <Users className="h-5 w-5" />
                 Your Teams
               </h3>
                <span className="text-sm text-muted-foreground">{userTeams.length} teams</span>
             </div>

             <div className="space-y-2">
               {userTeams.map((userTeam) => (
                 <div
                   key={userTeam.teamId}
                   className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                     userTeam.isCurrent
                       ? 'bg-primary/10 border-primary/30'
                       : 'bg-background border-border/30 hover:bg-muted/20'
                   }`}
                 >
                   <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                       userTeam.isCurrent
                         ? 'bg-primary/20 text-primary'
                         : 'bg-secondary/10 text-secondary-foreground'
                     }`}>
                       <Building2 className="h-5 w-5" />
                     </div>
                     <div>
                       <div className="flex items-center gap-2">
                         <h4 className="font-medium text-sm">{userTeam.team.name}</h4>
                         {userTeam.isCurrent && (
                           <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full flex items-center gap-1">
                             <Check className="h-3 w-3" />
                             Current
                           </span>
                         )}
                       </div>
                       <div className="flex items-center gap-3 mt-1">
                         <span className="text-xs text-muted-foreground">
                           {userTeam.role} • {userTeam.team.memberCount} members
                         </span>
                       </div>
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     {!userTeam.isCurrent && (
                       <Button 
                         variant="ghost" 
                         size="sm"
                         onClick={() => handleTeamSwitch(userTeam.teamId)}
                         className="text-xs"
                       >
                         Switch
                       </Button>
                     )}
                   </div>
                 </div>
               ))}
             </div>

             <div className="pt-2 border-t border-border/30">
               <div className="flex gap-2">
                  {can('team:update') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-2"
                      onClick={() => setCreateTeamOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Create New Team
                    </Button>
                  )}
                 <Button variant="outline" size="sm" className="flex-1 gap-2">
                   <Plus className="h-4 w-4" />
                   Join Another Team
                 </Button>
               </div>
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

      <CreateTeamDialog 
        open={createTeamOpen}
        onOpenChange={setCreateTeamOpen}
        onTeamCreated={onUserUpdate}
      />
    </Dialog>
  );
}
