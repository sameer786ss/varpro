import Link from "next/link";

import { signUpAction } from "@/app/(auth)/actions";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

type SignUpPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Join as a student, teacher, or staff member to start collaborating.
      </p>

      {params.error ? (
        <div className="mt-4 rounded-xl border border-[rgba(179,38,30,0.4)] bg-[rgba(179,38,30,0.15)] px-3 py-2 text-sm text-[#ffb3ae]">
          {params.error}
        </div>
      ) : null}

      <form action={signUpAction} className="mt-6 space-y-4">
        <div>
          <label htmlFor="full_name" className="mb-1 block text-sm text-[var(--text-secondary)]">
            Full name
          </label>
          <Input id="full_name" name="full_name" type="text" required />
        </div>

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

        <div>
          <label htmlFor="role" className="mb-1 block text-sm text-[var(--text-secondary)]">
            Register as
          </label>
          <select
            id="role"
            name="role"
            defaultValue="student"
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(230,179,30,0.25)]"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher / Instructor</option>
            <option value="staff">Institution Staff</option>
          </select>
        </div>

        <SubmitButton className="w-full" type="submit" pendingText="Creating account...">
          Create account
        </SubmitButton>
      </form>

      <p className="mt-4 text-sm text-[var(--text-secondary)]">
        Already registered?{" "}
        <Link href="/sign-in" className="text-[var(--accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
