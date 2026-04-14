import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl rounded-3xl border border-[var(--border)] bg-[var(--surface-1)] p-7 shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-6 h-10 w-full max-w-2xl" />
        <Skeleton className="mt-3 h-6 w-full max-w-xl" />

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
