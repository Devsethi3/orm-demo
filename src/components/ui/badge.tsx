import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border border-primary/20 bg-primary/10 text-primary ring-1 ring-inset ring-primary/20 hover:bg-primary/15 hover:ring-primary/30",
        secondary:
          "border border-secondary/20 bg-secondary/10 text-secondary-foreground ring-1 ring-inset ring-secondary/20 hover:bg-secondary/15",
        destructive:
          "border border-red-500/20 bg-red-500/10 text-red-600 ring-1 ring-inset ring-red-500/20 hover:bg-red-500/15 hover:ring-red-500/30 dark:text-red-400",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-muted/50",
        success:
          "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-500/15 hover:ring-emerald-500/30 dark:text-emerald-400 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:ring-emerald-400/20",
        warning:
          "border border-amber-500/20 bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/20 hover:bg-amber-500/15 hover:ring-amber-500/30 dark:text-amber-400 dark:border-amber-400/20 dark:bg-amber-400/10 dark:ring-amber-400/20",
        info: "border border-blue-500/20 bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/20 hover:bg-blue-500/15 hover:ring-blue-500/30 dark:text-blue-400 dark:border-blue-400/20 dark:bg-blue-400/10 dark:ring-blue-400/20",
        muted:
          "border border-muted-foreground/20 bg-muted/50 text-muted-foreground ring-1 ring-inset ring-muted-foreground/10 hover:bg-muted/80",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[10px]",
        default: "px-2 py-0.5 text-xs",
        lg: "px-2.5 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  dot?: boolean;
  dotPulse?: boolean;
}

function Badge({
  className,
  variant,
  size,
  icon,
  dot,
  dotPulse,
  children,
  ...props
}: BadgeProps) {
  const dotColorMap: Record<string, string> = {
    default: "bg-primary",
    secondary: "bg-secondary-foreground",
    destructive: "bg-red-500 dark:bg-red-400",
    outline: "bg-foreground",
    success: "bg-emerald-500 dark:bg-emerald-400",
    warning: "bg-amber-500 dark:bg-amber-400",
    info: "bg-blue-500 dark:bg-blue-400",
    muted: "bg-muted-foreground",
  };

  const dotColor = dotColorMap[variant || "default"];

  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {dotPulse && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                dotColor,
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex h-1.5 w-1.5 rounded-full",
              dotColor,
            )}
          />
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
