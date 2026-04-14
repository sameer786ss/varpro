import * as React from "react";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(230,179,30,0.25)]",
        className,
      )}
      {...props}
    />
  );
}
