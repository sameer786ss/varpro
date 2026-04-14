import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(230,179,30,0.25)]",
        className,
      )}
      {...props}
    />
  );
}
