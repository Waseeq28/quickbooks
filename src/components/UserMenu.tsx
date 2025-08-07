"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";

interface UserMenuProps {
  user: {
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 px-3 rounded-full border border-border/10 hover:border-border/20"
          disabled={isLoading}
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={displayName} />
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

      <DropdownMenuContent align="end" className="w-56 p-2 border-2 border-gray-800">
        {/* <DropdownMenuLabel className="font-normal text-xs text-muted-foreground px-2 pb-2">
          {user.email}
        </DropdownMenuLabel> */}

        <DropdownMenuItem className="py-2">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isLoading}
          className="py-2"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoading ? 'Signing out...' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
