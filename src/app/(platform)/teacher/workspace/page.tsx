import {
  createAnnouncementAction,
  createAssignmentAction,
  createCourseAction,
  createQuizAction,
} from "@/app/(platform)/teacher/workspace/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requireRole } from "@/lib/auth/session";
import { getCoursesForRole } from "@/lib/data/courses";

type TeacherWorkspacePageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function TeacherWorkspacePage({ searchParams }: TeacherWorkspacePageProps) {
  const params = await searchParams;
  const { user, profile } = await requireRole(["teacher", "admin"]);
  const courses = await getCoursesForRole(user.id, profile.role);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Teacher Workspace</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
          Publish courses, assignments, quizzes, and announcements from one control center.
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

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardTitle>Create Course</CardTitle>
          <CardDescription className="mt-1">Set up a new course shell with pricing metadata.</CardDescription>

          <form action={createCourseAction} className="mt-4 space-y-3">
            <Input name="title" required placeholder="Course title" />
            <Input name="code" required placeholder="Course code (e.g. CS-101)" />
            <Textarea name="description" placeholder="Course description" />
            <Input name="schedule_text" placeholder="Schedule summary" />
            <Input name="price_cents" type="number" min={0} defaultValue={0} placeholder="Price in cents" />
            <select
              name="status"
              defaultValue="draft"
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-primary)] outline-none"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <Button type="submit">Create Course</Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Create Assignment</CardTitle>
          <CardDescription className="mt-1">Add graded coursework to a selected course.</CardDescription>

          <form action={createAssignmentAction} className="mt-4 space-y-3">
            <select
              name="course_id"
              required
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-primary)] outline-none"
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <Input name="title" required placeholder="Assignment title" />
            <Textarea name="description" placeholder="Instructions" />
            <Input name="due_at" type="datetime-local" />
            <Input name="max_score" type="number" min={1} defaultValue={100} />
            <Button type="submit">Create Assignment</Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Create Quiz</CardTitle>
          <CardDescription className="mt-1">Publish objective assessments with limits.</CardDescription>

          <form action={createQuizAction} className="mt-4 space-y-3">
            <select
              name="course_id"
              required
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-primary)] outline-none"
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <Input name="title" required placeholder="Quiz title" />
            <Textarea name="instructions" placeholder="Quiz instructions" />
            <Input name="time_limit_minutes" type="number" min={1} placeholder="Time limit in minutes" />
            <Input name="max_attempts" type="number" min={1} defaultValue={1} />
            <Button type="submit">Create Quiz</Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Publish Announcement</CardTitle>
          <CardDescription className="mt-1">Broadcast updates globally or course-specific.</CardDescription>

          <form action={createAnnouncementAction} className="mt-4 space-y-3">
            <select
              name="course_id"
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-primary)] outline-none"
              defaultValue=""
            >
              <option value="">All courses / global announcement</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <Input name="title" required placeholder="Announcement title" />
            <Textarea name="body" required placeholder="Announcement body" />
            <Button type="submit">Publish</Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
