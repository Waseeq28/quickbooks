import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/70 selection:bg-primary selection:text-primary-foreground border-input flex h-10 w-full min-w-0 rounded-lg border bg-white/70 px-3.5 py-2 text-sm shadow-sm transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus:bg-white focus:border-primary/40 focus:shadow-md focus:shadow-primary/10 hover:border-primary/30",
        "aria-invalid:border-destructive aria-invalid:shadow-destructive/10",
        className
      )}
      {...props}
    />
  )
}

export { Input }
