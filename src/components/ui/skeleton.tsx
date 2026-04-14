import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-[linear-gradient(110deg,rgba(255,255,255,0.06),rgba(255,255,255,0.14),rgba(255,255,255,0.06))] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}
