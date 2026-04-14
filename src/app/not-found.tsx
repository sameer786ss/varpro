import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--surface-1)] p-8 text-center">
        <p className="text-sm uppercase tracking-[0.14em] text-[var(--text-muted)]">404</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight">Page Not Found</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)] sm:text-base">
          The page you requested is not available or you may not have access to it.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-5 font-semibold text-[#101010]"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
