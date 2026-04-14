import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface-1)] p-7 shadow-[0_25px_60px_rgba(0,0,0,0.42)]">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-6 h-9 w-60" />
        <Skeleton className="mt-3 h-4 w-72" />

        <div className="mt-7 space-y-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </div>
  );
}
