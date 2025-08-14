import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-all duration-200 transform hover:scale-105",
  {
    variants: {
      variant: {
        default:
          "bg-primary-solid text-white border-transparent shadow-sm hover:shadow-md",
        secondary:
          "bg-secondary-solid text-white border-transparent shadow-sm hover:shadow-md",
        destructive:
          "bg-danger-solid text-white border-transparent shadow-sm hover:shadow-md",
        success:
          "bg-success-solid text-white border-transparent shadow-sm hover:shadow-md",
        outline:
          "text-foreground border-current hover:bg-accent/10 hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
