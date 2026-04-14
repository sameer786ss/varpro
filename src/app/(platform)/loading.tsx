import { Skeleton } from "@/components/ui/skeleton";

export default function PlatformLoading() {
  return (
    <div className="relative min-h-screen bg-[var(--surface-0)]">
      <div className="relative mx-auto grid min-h-screen w-full max-w-[1600px] gap-6 px-4 py-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="rounded-3xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="mt-1 h-4 w-28" />

          <div className="mt-8 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          <Skeleton className="mt-8 h-11 w-full" />
        </aside>

        <main className="space-y-6">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-1)] p-6">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-10 w-full max-w-3xl" />
            <Skeleton className="mt-3 h-6 w-full max-w-2xl" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        </main>
      </div>
    </div>
  );
}
