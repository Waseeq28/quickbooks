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
import { Mail } from "lucide-react";
import { toast } from "sonner";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamName: string;
  onMemberInvited?: () => void;
}

export function InviteMemberDialog({ open, onOpenChange, teamName, onMemberInvited }: InviteMemberDialogProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Viewer");
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!inviteEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSendingInvite(true);
    
    try {
      // Mock invite sending - in real app this would send an email
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast.success("Invitation sent successfully!", {
        description: `Invitation sent to ${inviteEmail} with ${inviteRole} role`,
      });
      
      setInviteEmail("");
      setInviteRole("Viewer");
      onOpenChange(false);
      onMemberInvited?.();
    } catch (error) {
      toast.error("Failed to send invitation", {
        description: "An unexpected error occurred",
      });
    }
    
    setIsSendingInvite(false);
  };

  const handleCancel = () => {
    setInviteEmail("");
    setInviteRole("Viewer");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-2 border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Member to {teamName}
          </DialogTitle>
          <DialogDescription>
            The recipient will receive an invitation email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="inviteEmail">Email Address</Label>
            <Input
              id="inviteEmail"
              type="email"
              className="mt-2"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSendingInvite) {
                  handleSendInvite();
                }
              }}
            />
          </div>
          
          <div>
            <Label htmlFor="inviteRole">Role</Label>
            <select
              id="inviteRole"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="flex h-10 w-full mt-2 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="Viewer">Viewer</option>
              <option value="Accountant">Accountant</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSendingInvite}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvite}
              disabled={isSendingInvite || !inviteEmail.trim()}
              className="flex-1 gap-2"
            >
              {isSendingInvite ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
