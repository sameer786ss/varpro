import { ArrowRight, BookOpen, Bot, ClipboardCheck, MessageSquare, Shield } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 opacity-80">
        <div className="absolute -left-20 top-[-10rem] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,_rgba(230,179,30,0.26),_transparent_64%)]" />
        <div className="absolute right-[-12rem] top-[22%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.1),_transparent_68%)]" />
      </div>

      <main className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-8 sm:pt-16 lg:pb-24">
        <section className="rounded-3xl border border-[var(--border)] bg-[linear-gradient(150deg,_#242424_0%,_#1f1f1f_52%,_#1a1a1a_100%)] p-7 shadow-[0_25px_60px_rgba(0,0,0,0.35)] sm:p-12">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
            Digital Learning Support System
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            One platform for learning materials, assignments, quizzes, communication, and progress.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
            Built with Supabase, role-based workflows, AI tutor guidance via Gemma 3 27B IT,
            and cloud-native deployment on Vercel.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-[var(--accent)] px-6 font-semibold text-[#101010] transition hover:translate-y-[-1px]"
            >
              Launch Platform
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-6 font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-3)]"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <p className="text-sm text-[var(--text-muted)]">Primary Users</p>
              <p className="mt-1 text-lg font-semibold">Students + Teachers</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <p className="text-sm text-[var(--text-muted)]">Secondary Users</p>
              <p className="mt-1 text-lg font-semibold">Admins + Staff</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <p className="text-sm text-[var(--text-muted)]">Deployment</p>
              <p className="mt-1 text-lg font-semibold">Supabase + Vercel</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
            <BookOpen className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="mt-3 text-lg font-semibold">Student Experience</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Access learning materials, submit assignments, attempt quizzes, and monitor progress in
              one dashboard.
            </p>
          </article>

          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
            <ClipboardCheck className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="mt-3 text-lg font-semibold">Teacher Workspace</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Upload materials, create assignments and quizzes, publish announcements, and evaluate
              learner performance.
            </p>
          </article>

          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
            <Shield className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="mt-3 text-lg font-semibold">Administration Layer</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Manage users, courses, governance actions, schedule operations, and institution-wide
              oversight.
            </p>
          </article>

          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
            <MessageSquare className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="mt-3 text-lg font-semibold">Integrated Communication</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Built-in channels for discussions, instructional messages, alerts, and announcement
              workflows.
            </p>
          </article>

          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
            <Bot className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="mt-3 text-lg font-semibold">Gemma AI Support</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Context-aware tutoring assistant powered by Google GenAI with Gemma 3 27B IT for
              conceptual clarity.
            </p>
          </article>

          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
            <Shield className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="mt-3 text-lg font-semibold">Operational Backbone</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Role-aware auth, secure database policies, and notification workflows configured for
              free-tier friendly scale.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
