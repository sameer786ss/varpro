import * as React from "react";

import { cn } from "@/lib/utils";

const toneClasses: Record<string, string> = {
  neutral: "bg-[var(--surface-2)] text-[var(--text-secondary)]",
  success: "bg-[rgba(37,160,79,0.18)] text-[#87f4ad]",
  warning: "bg-[rgba(230,179,30,0.2)] text-[#f3d06b]",
  danger: "bg-[rgba(179,38,30,0.26)] text-[#ff9e99]",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof toneClasses }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold uppercase tracking-[0.08em]",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
