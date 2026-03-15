import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-polaris-highlight text-polaris-text",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-polaris-critical-light text-polaris-critical",
        outline: "text-foreground",
        success: "border-transparent bg-polaris-success-light text-polaris-success",
        warning: "border-transparent bg-polaris-warning-light text-polaris-warning",
        info: "border-transparent bg-polaris-info-light text-polaris-info",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
