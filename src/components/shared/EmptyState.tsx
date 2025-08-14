"use client";

import { FileText } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  title,
  description,
  icon: Icon = FileText,
  actions,
  size = "md",
}: EmptyStateProps) {
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
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-4">
        {/* Animated Icon with floating dots */}
        <div className="relative inline-block">
          <div
            className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-br from-primary/80 to-primary shadow-2xl animate-pulse flex items-center justify-center`}
          >
            <Icon className={`${iconSizes[size]} text-primary-foreground`} />
          </div>
          {/* Floating elements - positioned relative to icon only */}
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

        {/* Text Content */}
        <div className="space-y-2">
          <h3
            className={`${textSizes[size]} font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent`}
          >
            {title}
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {description}
          </p>
        </div>

        {/* Optional Actions */}
        {actions && (
          <div className="flex items-center justify-center">{actions}</div>
        )}
      </div>
    </div>
  );
}
