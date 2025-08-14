"use client";

import { Receipt } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
  message = "Loading...",
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-20 h-20",
    lg: "w-24 h-24",
  };

  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Animated Invoice Icon */}
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-br from-primary/80 to-primary shadow-2xl animate-pulse`}
        >
          <Receipt
            className={`${iconSizes[size]} text-primary-foreground absolute inset-0 m-auto`}
          />
        </div>
        {/* Floating particles */}
        <div
          className="absolute -top-2 -right-2 w-4 h-4 bg-accent rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="absolute -bottom-2 -left-2 w-3 h-3 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></div>
        <div
          className="absolute top-1/2 -right-4 w-2 h-2 bg-border rounded-full animate-bounce"
          style={{ animationDelay: "600ms" }}
        ></div>
      </div>

      {/* Animated Text */}
      <div className="text-center">
        <h3
          className={`${textSizes[size]} font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent`}
        >
          {message}
        </h3>
      </div>
    </div>
  );
}
