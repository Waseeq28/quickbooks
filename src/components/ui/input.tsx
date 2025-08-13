import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/70 selection:bg-primary selection:text-primary-foreground border-input flex h-10 w-full min-w-0 rounded-lg border bg-background px-3.5 py-2 text-sm shadow-sm transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus:bg-background focus:border-primary/50 focus:shadow-sm focus:shadow-primary/5 hover:border-primary/30 focus:ring-0 focus:ring-offset-0",
        "aria-invalid:border-destructive aria-invalid:shadow-destructive/10",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
