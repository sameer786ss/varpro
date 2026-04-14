import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function QuizzesPage() {
  const { user, profile } = await requireSession();
  const supabase = await createSupabaseServerClient();

  let quizzes:
    | {
        id: string;
        title: string;
        course_id: string;
        max_attempts: number;
        time_limit_minutes: number | null;
        created_at: string;
      }[]
    | null = null;

  if (profile.role === "student") {
    const { data: enrollments } = await supabase
      .from("course_enrollments")
      .select("course_id")
      .eq("student_id", user.id);

    const courseIds = (enrollments ?? []).map((row) => row.course_id);

    if (courseIds.length) {
      const { data } = await supabase
        .from("quizzes")
        .select("id, title, course_id, max_attempts, time_limit_minutes, created_at")
        .in("course_id", courseIds)
        .order("created_at", { ascending: false });

      quizzes = data;
    } else {
      quizzes = [];
    }
  } else if (profile.role === "teacher") {
    const { data: courses } = await supabase.from("courses").select("id").eq("teacher_id", user.id);

    const courseIds = (courses ?? []).map((row) => row.id);

    if (courseIds.length) {
      const { data } = await supabase
        .from("quizzes")
        .select("id, title, course_id, max_attempts, time_limit_minutes, created_at")
        .in("course_id", courseIds)
        .order("created_at", { ascending: false });

      quizzes = data;
    } else {
      quizzes = [];
    }
  } else {
    const { data } = await supabase
      .from("quizzes")
      .select("id, title, course_id, max_attempts, time_limit_minutes, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    quizzes = data;
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Quizzes</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
          Attempt, track, and manage assessment activities across all courses.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {(quizzes ?? []).length === 0 ? (
          <Card>
            <CardTitle>No quizzes found</CardTitle>
            <CardDescription className="mt-1">
              Quizzes will appear once instructors publish assessments.
            </CardDescription>
          </Card>
        ) : (
          (quizzes ?? []).map((quiz) => (
            <Card key={quiz.id}>
              <CardTitle>{quiz.title}</CardTitle>
              <CardDescription className="mt-2">Course: {quiz.course_id}</CardDescription>
              <CardDescription className="mt-1">
                Attempts: {quiz.max_attempts}
                {quiz.time_limit_minutes ? ` • Time limit: ${quiz.time_limit_minutes} min` : ""}
              </CardDescription>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
