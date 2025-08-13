"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { login, signup } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Chrome } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error("Error signing in with Google:", error.message);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl font-medium text-zinc-200">
            QuickBooks AI
          </CardTitle>
          <p className="text-sm text-zinc-400">Sign in to continue</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            variant="outline"
            className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
          >
            <Chrome className="w-4 h-4 mr-2" />
            {isLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-zinc-900 px-2 text-zinc-500">or</span>
            </div>
          </div>

          <form className="space-y-3">
            <div>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Email"
                className="bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-500"
              />
            </div>

            <div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Password"
                className="bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-500"
              />
            </div>

            <div className="flex gap-2">
              <Button
                formAction={login}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-zinc-100 cursor-pointer"
              >
                Log in
              </Button>
              <Button
                formAction={signup}
                variant="outline"
                className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
              >
                Sign up
              </Button>
            </div>
          </form>

          <p className="text-[10px] text-center text-zinc-500">
            By signing in, you agree to our terms and authorize QuickBooks
            access
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
