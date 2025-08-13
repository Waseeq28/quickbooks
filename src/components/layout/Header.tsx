"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { FileText, Sparkles, Zap } from "lucide-react";
import { UserMenu } from "../UserMenu";

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return (
    <header className="sticky top-0 z-50 w-full glass-effect border-b border-border/50 shadow-lg">
      <div className="px-4 lg:px-6">
        <div className="flex h-12 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md opacity-60 animate-glow"></div>
              <div className="relative flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary to-purple-500 rounded-lg shadow-lg">
                <FileText className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">
                Invoice Manager
              </h1>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                AI-Powered QuickBooks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-card/50 rounded-lg border border-border/30">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse shadow-sm"></div>
                <Zap className="h-3 w-3 text-green-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Live
              </span>
            </div>
            {!loading && user && <UserMenu user={user} />}
          </div>
        </div>
      </div>
    </header>
  );
}
