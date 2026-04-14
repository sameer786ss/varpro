import { formatDistanceToNow } from "date-fns";

import {
  gradeQuizAttemptAction,
  submitQuizAttemptAction,
} from "@/app/(platform)/quizzes/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requireSession } from "@/lib/auth/session";
import { getQuizzesWithAttempts } from "@/lib/data/quizzes";

type QuizzesPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

function shortId(value: string) {
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

export default async function QuizzesPage({ searchParams }: QuizzesPageProps) {
  const params = await searchParams;
  const { user, profile } = await requireSession();
  const payload = await getQuizzesWithAttempts(user.id, profile.role);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Quizzes</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
          Attempt, track, and manage assessment activities across all courses.
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

      <section className="grid gap-4 md:grid-cols-2">
        {payload.quizzes.length === 0 ? (
          <Card>
            <CardTitle>No quizzes found</CardTitle>
            <CardDescription className="mt-1">
              Quizzes will appear once instructors publish assessments.
            </CardDescription>
          </Card>
        ) : (
          payload.quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>{quiz.title}</CardTitle>
                {profile.role === "student" ? (
                  <Badge tone={quiz.attemptsUsed < quiz.maxAttempts ? "warning" : "neutral"}>
                    {quiz.attemptsUsed < quiz.maxAttempts ? "open" : "limit reached"}
                  </Badge>
                ) : (
                  <Badge tone={quiz.pendingGrading > 0 ? "warning" : "success"}>
                    {quiz.pendingGrading > 0 ? `${quiz.pendingGrading} pending` : "all graded"}
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-2">Course: {quiz.courseTitle}</CardDescription>
              <CardDescription className="mt-1">
                Attempts: {quiz.attemptsUsed}/{quiz.maxAttempts}
                {quiz.timeLimitMinutes ? ` • Time limit: ${quiz.timeLimitMinutes} min` : ""}
              </CardDescription>

              {quiz.latestSubmittedAt ? (
                <CardDescription className="mt-1">
                  Last activity {formatDistanceToNow(new Date(quiz.latestSubmittedAt), { addSuffix: true })}
                </CardDescription>
              ) : null}

              {quiz.latestScore !== null ? (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Latest score: {quiz.latestScore}</p>
              ) : null}

              {profile.role === "student" ? (
                quiz.attemptsUsed < quiz.maxAttempts ? (
                  <form action={submitQuizAttemptAction} className="mt-4 space-y-3">
                    <input type="hidden" name="quiz_id" value={quiz.id} />
                    <div>
                      <label
                        htmlFor={`quiz-response-${quiz.id}`}
                        className="mb-1 block text-sm text-[var(--text-secondary)]"
                      >
                        Response summary
                      </label>
                      <Textarea
                        id={`quiz-response-${quiz.id}`}
                        name="response_text"
                        required
                        placeholder="Write your key answer points, reasoning, and final conclusion."
                      />
                    </div>
                    <Button type="submit">Submit Attempt</Button>
                  </form>
                ) : (
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">
                    You have used all allowed attempts for this quiz.
                  </p>
                )
              ) : (
                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  Pending grading items: {quiz.pendingGrading}
                </p>
              )}
            </Card>
          ))
        )}
      </section>

      {profile.role !== "student" ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl tracking-tight">Attempt Review</h2>

          {payload.attempts.length === 0 ? (
            <Card>
              <CardTitle>No attempts submitted yet</CardTitle>
              <CardDescription className="mt-1">
                Student attempts will appear here for scoring and audit.
              </CardDescription>
            </Card>
          ) : (
            payload.attempts.map((attempt) => (
              <Card key={attempt.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>{attempt.quizTitle}</CardTitle>
                  <Badge tone={attempt.score === null ? "warning" : "success"}>
                    {attempt.score === null ? "not graded" : `scored ${attempt.score}`}
                  </Badge>
                </div>
                <CardDescription className="mt-1">Course: {attempt.courseTitle}</CardDescription>
                <CardDescription className="mt-1">Student: {shortId(attempt.studentId)}</CardDescription>
                <CardDescription className="mt-1">
                  Submitted {formatDistanceToNow(new Date(attempt.submittedAt ?? attempt.startedAt), { addSuffix: true })}
                </CardDescription>

                {attempt.responsePreview ? (
                  <p className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--text-secondary)]">
                    {attempt.responsePreview}
                  </p>
                ) : null}

                <form action={gradeQuizAttemptAction} className="mt-4 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="attempt_id" value={attempt.id} />
                  <div>
                    <label
                      htmlFor={`attempt-score-${attempt.id}`}
                      className="mb-1 block text-sm text-[var(--text-secondary)]"
                    >
                      Score (0-100)
                    </label>
                    <Input
                      id={`attempt-score-${attempt.id}`}
                      name="score"
                      type="number"
                      min={0}
                      max={100}
                      required
                      defaultValue={attempt.score ?? undefined}
                      className="w-36"
                    />
                  </div>
                  <Button type="submit" variant="secondary">
                    {attempt.score === null ? "Grade Attempt" : "Update Score"}
                  </Button>
                </form>
              </Card>
            ))
          )}
        </section>
      ) : null}
    </div>
  );
}
