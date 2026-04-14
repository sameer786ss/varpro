import { formatDistanceToNow } from "date-fns";
import { Activity, Bell, CalendarClock } from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { getDashboardPayload } from "@/lib/data/dashboard";

export default async function DashboardPage() {
  const { user, profile } = await requireSession();
  const payload = await getDashboardPayload(user.id, profile.role);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface-1)] p-6">
        <p className="text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">Overview</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
          {profile.full_name ?? "Welcome"}, your learning command center is ready.
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)] sm:text-base">
          Track performance, workflow tasks, and communication threads across your role in one
          integrated dashboard.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {payload.kpis.map((kpi, index) => (
          <KpiCard key={`${kpi.label}-${index}`} index={index} kpi={kpi} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-[var(--accent)]" />
            Upcoming Focus
          </CardTitle>
          <CardDescription className="mt-1">Assignments and activities that need action.</CardDescription>

          <div className="mt-4 space-y-3">
            {payload.upcomingAssignments.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No pending assignments right now.</p>
            ) : (
              payload.upcomingAssignments.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
                >
                  <p className="font-medium text-[var(--text-primary)]">{item.title}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {item.dueAt
                      ? `Due ${formatDistanceToNow(new Date(item.dueAt), { addSuffix: true })}`
                      : "No due date"}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[var(--accent)]" />
            Announcements
          </CardTitle>
          <CardDescription className="mt-1">Recent institution and course broadcasts.</CardDescription>

          <div className="mt-4 space-y-3">
            {payload.recentAnnouncements.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No announcements yet.</p>
            ) : (
              payload.recentAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
                >
                  <p className="font-medium text-[var(--text-primary)]">{announcement.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">
                    {announcement.body}
                  </p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <Card>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[var(--accent)]" />
          Platform Scope
        </CardTitle>
        <CardDescription className="mt-1">
          Learning materials, assignments, quizzes, messaging, and evaluations are fully integrated
          into your role-specific workspace.
        </CardDescription>
      </Card>
    </div>
  );
}
