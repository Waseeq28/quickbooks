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
import { Building2, Plus } from "lucide-react";
import { createNewTeam } from "@/lib/mock-data";
import { toast } from "sonner";

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamCreated?: () => void;
}

export function CreateTeamDialog({ open, onOpenChange, onTeamCreated }: CreateTeamDialogProps) {
  const [teamName, setTeamName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }

    setIsLoading(true);
    
    try {
      // Create the new team
      const newTeamId = createNewTeam(teamName.trim());
      
      toast.success("Team created successfully!");
      setTeamName("");
      onOpenChange(false);
      onTeamCreated?.();
    } catch (error) {
      toast.error("Failed to create team", {
        description: "An unexpected error occurred",
      });
    }
    
    setIsLoading(false);
  };

  const handleCancel = () => {
    setTeamName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-2 border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Team
          </DialogTitle>
          <DialogDescription>
            Create a new team. You'll be the admin of this team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teamName" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Team Name
            </Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleCreateTeam();
                }
              }}
            />
          </div>

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
              onClick={handleCreateTeam}
              disabled={isLoading || !teamName.trim()}
              className="flex-1"
            >
              {isLoading ? "Creating..." : "Create Team"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
