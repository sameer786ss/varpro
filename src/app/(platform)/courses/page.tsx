import Link from "next/link";
import { BookOpen, Clock3, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { getCoursesForRole } from "@/lib/data/courses";
import { currencyFromCents, percent } from "@/lib/utils";

function statusTone(status: string) {
  if (status === "published") {
    return "success";
  }

  if (status === "draft") {
    return "warning";
  }

  return "neutral";
}

export default async function CoursesPage() {
  const { user, profile } = await requireSession();
  const courses = await getCoursesForRole(user.id, profile.role);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Courses</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
          Browse your active classes, review progress, and open each course workspace.
        </p>
      </section>

      {courses.length === 0 ? (
        <Card>
          <CardTitle>No courses found</CardTitle>
          <CardDescription className="mt-2">
            Your course list will appear here when enrollments or teaching assignments are available.
          </CardDescription>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`}>
              <Card className="h-full transition hover:translate-y-[-2px] hover:border-[var(--accent)]">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                  <div className="flex flex-col items-end gap-2">
                    <Badge tone={statusTone(course.status)}>{course.status}</Badge>
                    {profile.role === "student" ? (
                      <Badge tone={course.enrollment_status ? "success" : "warning"}>
                        {course.enrollment_status ? "enrolled" : "not enrolled"}
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <CardDescription className="mt-2 line-clamp-3">
                  {course.description ?? "No description added yet."}
                </CardDescription>

                <div className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                  <p className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[var(--accent)]" />
                    Code: {course.code}
                  </p>
                  <p className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-[var(--accent)]" />
                    Instructor: {course.teacher_name ?? "Unassigned"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-[var(--accent)]" />
                    {course.schedule_text ?? "Schedule not published"}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">
                    Progress: {percent(course.progress_percent)}
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {course.price_cents > 0
                      ? `Fee ${currencyFromCents(course.price_cents, course.currency)}`
                      : "No fee"}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
