import { format } from "date-fns";

import { createScheduleItemAction } from "@/app/(platform)/staff/schedule/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requireRole } from "@/lib/auth/session";
import { getStaffSchedule } from "@/lib/data/staff";

type StaffSchedulePageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function StaffSchedulePage({ searchParams }: StaffSchedulePageProps) {
  const params = await searchParams;
  const { user } = await requireRole(["staff", "admin"]);
  const schedule = await getStaffSchedule(user.id);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Staff Schedule</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
          Coordinate institutional support windows, academic operations, and service tasks.
        </p>
      </section>

      {params.error ? (
        <div className="rounded-xl border border-[rgba(179,38,30,0.4)] bg-[rgba(179,38,30,0.15)] px-3 py-2 text-sm text-[#ffb3ae]">
          {params.error}
        </div>
      ) : null}

      {params.success ? (
        <div className="rounded-xl border border-[rgba(37,160,79,0.4)] bg-[rgba(37,160,79,0.15)] px-3 py-2 text-sm text-[#9df0b9]">
          {params.success}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardTitle>Upcoming Items</CardTitle>
          <CardDescription className="mt-1">Planned support and operational schedule blocks.</CardDescription>

          <div className="mt-4 space-y-3">
            {schedule.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No schedule entries yet.</p>
            ) : (
              schedule.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {format(new Date(item.starts_at), "PPP p")} - {format(new Date(item.ends_at), "PPP p")}
                  </p>
                  {item.notes ? (
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.notes}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>Add Schedule Item</CardTitle>
          <CardDescription className="mt-1">Create a new support activity block.</CardDescription>

          <form action={createScheduleItemAction} className="mt-4 space-y-3">
            <Input name="title" required placeholder="Schedule title" />
            <Input name="starts_at" type="datetime-local" required />
            <Input name="ends_at" type="datetime-local" required />
            <Textarea name="notes" placeholder="Optional notes" />
            <Button type="submit">Add Item</Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
