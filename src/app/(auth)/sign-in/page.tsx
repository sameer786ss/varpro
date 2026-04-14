import Link from "next/link";

import { signInAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SignInPageProps = {
  searchParams: Promise<{ error?: string; success?: string; next?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Sign in to access your learning dashboard and workspace.
      </p>

      {params.error ? (
        <div className="mt-4 rounded-xl border border-[rgba(179,38,30,0.4)] bg-[rgba(179,38,30,0.15)] px-3 py-2 text-sm text-[#ffb3ae]">
          {params.error}
        </div>
      ) : null}

      {params.success ? (
        <div className="mt-4 rounded-xl border border-[rgba(37,160,79,0.4)] bg-[rgba(37,160,79,0.15)] px-3 py-2 text-sm text-[#9df0b9]">
          {params.success}
        </div>
      ) : null}

      <form action={signInAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={params.next ?? "/dashboard"} />

        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-[var(--text-secondary)]">
            Email
          </label>
          <Input id="email" name="email" type="email" required />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-[var(--text-secondary)]">
            Password
          </label>
          <Input id="password" name="password" type="password" required minLength={8} />
        </div>

        <Button className="w-full" type="submit">
          Sign in
        </Button>
      </form>

      <p className="mt-4 text-sm text-[var(--text-secondary)]">
        New here?{" "}
        <Link href="/sign-up" className="text-[var(--accent)] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
