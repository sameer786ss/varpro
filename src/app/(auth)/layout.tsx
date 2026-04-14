import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 opacity-80">
        <div className="absolute left-[8%] top-[-5rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(230,179,30,0.24),_transparent_64%)]" />
        <div className="absolute right-[8%] top-[56%] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.08),_transparent_62%)]" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface-1)] p-7 shadow-[0_25px_60px_rgba(0,0,0,0.42)]">
        <div className="mb-6">
          <Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Back to homepage
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
