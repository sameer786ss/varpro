import { formatDistanceToNow } from "date-fns";
import { notFound } from "next/navigation";

import { enrollCourseAction } from "@/app/(platform)/courses/[courseId]/actions";
import { TutorPanel } from "@/components/ai/tutor-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { getCourseWorkspace } from "@/lib/data/courses";
import { currencyFromCents, percent } from "@/lib/utils";

type CourseDetailPageProps = {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function CourseDetailPage({
  params,
  searchParams,
}: CourseDetailPageProps) {
  const { courseId } = await params;
  const query = await searchParams;
  const { user, profile } = await requireSession();

  const workspace = await getCourseWorkspace(courseId, user.id, profile.role);

  if (!workspace) {
    notFound();
  }

  const requiresEnrollmentPreview = profile.role === "student" && !workspace.enrollment;
  const canAccessProtectedContent = profile.role !== "student" || Boolean(workspace.enrollment);

  return (
    <div className="space-y-6">
      {query.error ? (
        <div className="rounded-xl border border-[rgba(179,38,30,0.4)] bg-[rgba(179,38,30,0.15)] px-3 py-2 text-sm text-[#ffb3ae]">
          {query.error}
        </div>
      ) : null}

      {query.success ? (
        <div className="rounded-xl border border-[rgba(37,160,79,0.4)] bg-[rgba(37,160,79,0.15)] px-3 py-2 text-sm text-[#9df0b9]">
          {query.success}
        </div>
      ) : null}

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface-1)] p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="warning">{workspace.course.status}</Badge>
          <Badge tone="neutral">{workspace.course.code}</Badge>
          {workspace.enrollment ? (
            <Badge tone="success">Progress {percent(workspace.enrollment.progress_percent)}</Badge>
          ) : null}
        </div>

        <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">{workspace.course.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
          {workspace.course.description ?? "Course details will be updated by your instructor."}
        </p>

        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          Pricing: {workspace.course.price_cents > 0
            ? currencyFromCents(workspace.course.price_cents, workspace.course.currency)
            : "Free course"}
        </p>

        {requiresEnrollmentPreview ? (
          <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">
              You are viewing a course preview. Enroll to unlock full coursework, assignments, and
              quiz attempts.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <form action={enrollCourseAction}>
                <input type="hidden" name="course_id" value={workspace.course.id} />
                <Button type="submit">Enroll in Course</Button>
              </form>
            </div>
          </div>
        ) : null}
      </section>

      {canAccessProtectedContent ? (
        <>
          <section className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardTitle>Learning Materials</CardTitle>
              <CardDescription className="mt-1">Cloud-hosted resources and lecture references.</CardDescription>

              <div className="mt-4 space-y-3">
                {workspace.materials.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">No materials published yet.</p>
                ) : (
                  workspace.materials.map((material) => (
                    <div
                      key={material.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
                    >
                      <p className="font-medium">{material.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                        {material.content_type}
                      </p>
                      {material.content_url ? (
                        <a
                          href={material.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-sm text-[var(--accent)] hover:underline"
                        >
                          Open resource
                        </a>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <CardTitle>Assignments</CardTitle>
              <CardDescription className="mt-1">Track deadlines and deliverables.</CardDescription>

              <div className="mt-4 space-y-3">
                {workspace.assignments.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">No assignments published yet.</p>
                ) : (
                  workspace.assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
                    >
                      <p className="font-medium">{assignment.title}</p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        {assignment.due_at
                          ? `Due ${formatDistanceToNow(new Date(assignment.due_at), {
                              addSuffix: true,
                            })}`
                          : "No due date"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardTitle>Quizzes</CardTitle>
              <CardDescription className="mt-1">Auto-graded and instructor-curated assessments.</CardDescription>

              <div className="mt-4 space-y-3">
                {workspace.quizzes.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">No quizzes available yet.</p>
                ) : (
                  workspace.quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
                    >
                      <p className="font-medium">{quiz.title}</p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        Attempts: {quiz.max_attempts}
                        {quiz.time_limit_minutes ? ` • ${quiz.time_limit_minutes} min` : ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <CardTitle>Announcements</CardTitle>
              <CardDescription className="mt-1">Latest updates for this course.</CardDescription>

              <div className="mt-4 space-y-3">
                {workspace.announcements.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">No announcements posted yet.</p>
                ) : (
                  workspace.announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
                    >
                      <p className="font-medium">{announcement.title}</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{announcement.body}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>

          <TutorPanel courseId={workspace.course.id} />
        </>
      ) : (
        <Card>
          <CardTitle>Enrollment Required</CardTitle>
          <CardDescription className="mt-2">
            Complete enrollment to access full course materials, assignments, quizzes, and AI support
            context linked to this course.
          </CardDescription>
        </Card>
      )}
    </div>
  );
}
