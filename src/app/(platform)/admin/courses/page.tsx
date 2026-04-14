import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { getAdminCourseSummary } from "@/lib/data/admin";
import { currencyFromCents } from "@/lib/utils";

function toneFromStatus(status: string) {
  if (status === "published") {
    return "success";
  }

  if (status === "draft") {
    return "warning";
  }

  return "neutral";
}

export default async function AdminCoursesPage() {
  await requireRole(["admin"]);
  const courses = await getAdminCourseSummary();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Admin: Courses</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
          Review academic inventory, publication status, and monetized offerings.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id}>
            <div className="flex items-start justify-between gap-3">
              <CardTitle>{course.title}</CardTitle>
              <Badge tone={toneFromStatus(course.status)}>{course.status}</Badge>
            </div>
            <CardDescription className="mt-2">Code: {course.code}</CardDescription>
            <CardDescription className="mt-1">Teacher ID: {course.teacher_id}</CardDescription>
            <CardDescription className="mt-1">
              Price: {course.price_cents > 0 ? currencyFromCents(course.price_cents, "USD") : "Free"}
            </CardDescription>
          </Card>
        ))}
      </section>
    </div>
  );
}
