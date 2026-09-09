import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-emerald-700 text-white shadow hover:bg-emerald-800",
        secondary:
          "border-transparent bg-emerald-100 text-emerald-900 hover:bg-emerald-200",
        outline: "text-slate-800 border-slate-300",
        amber: "border-amber-200 bg-amber-50 text-amber-800",
        blue: "border-sky-200 bg-sky-50 text-sky-800",
        destructive:
          "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
