import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent)] text-[#111111] shadow-[0_10px_30px_rgba(230,179,30,0.3)] hover:translate-y-[-1px] hover:brightness-105",
        secondary:
          "bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--surface-3)]",
        ghost:
          "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
        danger: "bg-[#b3261e] text-white hover:bg-[#cf3c33]",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-5",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
