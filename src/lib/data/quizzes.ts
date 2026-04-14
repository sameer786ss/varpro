import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import type { AppRole } from "@/lib/types/domain";

type QuizListRow = Pick<
  Database["public"]["Tables"]["quizzes"]["Row"],
  "id" | "title" | "course_id" | "max_attempts" | "time_limit_minutes" | "created_at"
>;

type QuizAttemptRow = Pick<
  Database["public"]["Tables"]["quiz_attempts"]["Row"],
  "id" | "quiz_id" | "student_id" | "answers" | "score" | "started_at" | "submitted_at"
>;

export interface QuizListItem {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  maxAttempts: number;
  timeLimitMinutes: number | null;
  createdAt: string;
  attemptsUsed: number;
  latestScore: number | null;
  latestSubmittedAt: string | null;
  pendingGrading: number;
}

export interface QuizAttemptReviewItem {
  id: string;
  quizId: string;
  quizTitle: string;
  courseTitle: string;
  studentId: string;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  responsePreview: string | null;
}

function responsePreviewFromAnswers(answers: QuizAttemptRow["answers"]) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return null;
  }

  const responseValue = answers.responseText;
  if (typeof responseValue !== "string") {
    return null;
  }

  const trimmed = responseValue.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.length > 220 ? `${trimmed.slice(0, 220)}...` : trimmed;
}

export async function getQuizzesWithAttempts(userId: string, role: AppRole): Promise<{
  quizzes: QuizListItem[];
  attempts: QuizAttemptReviewItem[];
}> {
  const supabase = await createSupabaseServerClient();

  let quizzes: QuizListRow[] = [];

  if (role === "student") {
    const { data: enrollments } = await supabase
      .from("course_enrollments")
      .select("course_id")
      .eq("student_id", userId);

    const courseIds = (enrollments ?? []).map((row) => row.course_id);
    if (courseIds.length === 0) {
      return { quizzes: [], attempts: [] };
    }

    const { data } = await supabase
      .from("quizzes")
      .select("id, title, course_id, max_attempts, time_limit_minutes, created_at")
      .in("course_id", courseIds)
      .order("created_at", { ascending: false })
      .limit(200);

    quizzes = (data ?? []) as QuizListRow[];
  } else if (role === "teacher") {
    const { data: courses } = await supabase.from("courses").select("id").eq("teacher_id", userId);

    const courseIds = (courses ?? []).map((row) => row.id);
    if (courseIds.length === 0) {
      return { quizzes: [], attempts: [] };
    }

    const { data } = await supabase
      .from("quizzes")
      .select("id, title, course_id, max_attempts, time_limit_minutes, created_at")
      .in("course_id", courseIds)
      .order("created_at", { ascending: false })
      .limit(200);

    quizzes = (data ?? []) as QuizListRow[];
  } else {
    const { data } = await supabase
      .from("quizzes")
      .select("id, title, course_id, max_attempts, time_limit_minutes, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    quizzes = (data ?? []) as QuizListRow[];
  }

  if (quizzes.length === 0) {
    return { quizzes: [], attempts: [] };
  }

  const quizIds = quizzes.map((quiz) => quiz.id);
  const courseIds = [...new Set(quizzes.map((quiz) => quiz.course_id))];

  const [{ data: courses }, attemptsResult] = await Promise.all([
    supabase.from("courses").select("id, title").in("id", courseIds),
    role === "student"
      ? supabase
          .from("quiz_attempts")
          .select("id, quiz_id, student_id, answers, score, started_at, submitted_at")
          .eq("student_id", userId)
          .in("quiz_id", quizIds)
          .order("started_at", { ascending: false })
          .limit(500)
      : supabase
          .from("quiz_attempts")
          .select("id, quiz_id, student_id, answers, score, started_at, submitted_at")
          .in("quiz_id", quizIds)
          .order("started_at", { ascending: false })
          .limit(500),
  ]);

  const attempts = (attemptsResult.data ?? []) as QuizAttemptRow[];
  const courseTitleById = new Map((courses ?? []).map((course) => [course.id, course.title]));

  const attemptsByQuiz = new Map<string, QuizAttemptRow[]>();
  for (const attempt of attempts) {
    const bucket = attemptsByQuiz.get(attempt.quiz_id) ?? [];
    bucket.push(attempt);
    attemptsByQuiz.set(attempt.quiz_id, bucket);
  }

  const quizById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));

  const quizCards = quizzes.map((quiz) => {
    const quizAttempts = attemptsByQuiz.get(quiz.id) ?? [];
    const latestAttempt = quizAttempts[0] ?? null;
    const pendingGrading = quizAttempts.filter((attempt) => attempt.score === null).length;

    return {
      id: quiz.id,
      title: quiz.title,
      courseId: quiz.course_id,
      courseTitle: courseTitleById.get(quiz.course_id) ?? "Unknown Course",
      maxAttempts: quiz.max_attempts,
      timeLimitMinutes: quiz.time_limit_minutes,
      createdAt: quiz.created_at,
      attemptsUsed: quizAttempts.length,
      latestScore: latestAttempt?.score ?? null,
      latestSubmittedAt: latestAttempt?.submitted_at ?? latestAttempt?.started_at ?? null,
      pendingGrading,
    } satisfies QuizListItem;
  });

  const reviewAttempts: QuizAttemptReviewItem[] =
    role === "student"
      ? []
      : attempts.map((attempt) => {
          const quiz = quizById.get(attempt.quiz_id);

          return {
            id: attempt.id,
            quizId: attempt.quiz_id,
            quizTitle: quiz?.title ?? "Unknown Quiz",
            courseTitle: courseTitleById.get(quiz?.course_id ?? "") ?? "Unknown Course",
            studentId: attempt.student_id,
            startedAt: attempt.started_at,
            submittedAt: attempt.submitted_at,
            score: attempt.score,
            responsePreview: responsePreviewFromAnswers(attempt.answers),
          } satisfies QuizAttemptReviewItem;
        });

  return {
    quizzes: quizCards,
    attempts: reviewAttempts,
  };
}
