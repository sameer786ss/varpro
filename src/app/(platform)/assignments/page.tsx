import { formatDistanceToNow } from "date-fns";

import {
  gradeAssignmentSubmissionAction,
  submitAssignmentAction,
} from "@/app/(platform)/assignments/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requireSession } from "@/lib/auth/session";
import { getAssignmentsForRole, getSubmissionReviewForRole } from "@/lib/data/assignments";

type AssignmentsPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

function shortId(value: string) {
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

export default async function AssignmentsPage({ searchParams }: AssignmentsPageProps) {
  const params = await searchParams;
  const { user, profile } = await requireSession();
  const assignmentItems = (await getAssignmentsForRole(user.id, profile.role)) as Array<
    | {
        assignment: {
          id: string;
          title: string;
          due_at: string | null;
          max_score: number;
        };
        courseTitle: string;
        submitted: boolean;
        score: number | null;
        dueSoon: boolean;
        gradedHint?: string;
      }
    | {
        id: string;
        title: string;
        due_at: string | null;
        max_score: number;
      }
  >;

  const submissionReview =
    profile.role === "teacher" || profile.role === "admin"
      ? await getSubmissionReviewForRole(user.id, profile.role)
      : [];

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Assignments</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
          Submit coursework, monitor grading status, and track pending deliverables.
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

      <section className="space-y-4">
        {assignmentItems.length === 0 ? (
          <Card>
            <CardTitle>No assignments available</CardTitle>
            <CardDescription className="mt-2">
              Your assignment queue will populate when instructors publish tasks.
            </CardDescription>
          </Card>
        ) : (
          assignmentItems.map((item) => {
            if ("assignment" in item) {
              return (
                <Card key={item.assignment.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle>{item.assignment.title}</CardTitle>
                    {item.submitted ? (
                      <Badge tone="success">Submitted</Badge>
                    ) : item.dueSoon ? (
                      <Badge tone="warning">Due Soon</Badge>
                    ) : (
                      <Badge tone="neutral">Pending</Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2">
                    Course: {item.courseTitle} • Max score: {item.assignment.max_score}
                  </CardDescription>
                  <CardDescription className="mt-1">
                    {item.assignment.due_at
                      ? `Due ${formatDistanceToNow(new Date(item.assignment.due_at), {
                          addSuffix: true,
                        })}`
                      : "No due date"}
                  </CardDescription>

                  {item.score !== null ? (
                    <p className="mt-3 text-sm text-[var(--text-secondary)]">Scored: {item.score}</p>
                  ) : null}

                  {profile.role === "student" && !item.submitted ? (
                    <form action={submitAssignmentAction} className="mt-4 space-y-3">
                      <input type="hidden" name="assignment_id" value={item.assignment.id} />
                      <div>
                        <label
                          htmlFor={`submission-${item.assignment.id}`}
                          className="mb-1 block text-sm text-[var(--text-secondary)]"
                        >
                          Submission text
                        </label>
                        <Textarea
                          id={`submission-${item.assignment.id}`}
                          name="submission_text"
                          required
                          placeholder="Add your answer, summary, or report text here."
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`submission-url-${item.assignment.id}`}
                          className="mb-1 block text-sm text-[var(--text-secondary)]"
                        >
                          Submission URL (optional)
                        </label>
                        <Input
                          id={`submission-url-${item.assignment.id}`}
                          name="submission_url"
                          type="url"
                          placeholder="https://..."
                        />
                      </div>
                      <Button type="submit">Submit Assignment</Button>
                    </form>
                  ) : null}

                  {item.gradedHint ? (
                    <p className="mt-3 text-sm text-[var(--text-secondary)]">{item.gradedHint}</p>
                  ) : null}
                </Card>
              );
            }

            return (
              <Card key={item.id}>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription className="mt-1">Max score: {item.max_score}</CardDescription>
                <CardDescription className="mt-1">
                  {item.due_at
                    ? `Due ${formatDistanceToNow(new Date(item.due_at), { addSuffix: true })}`
                    : "No due date"}
                </CardDescription>
              </Card>
            );
          })
        )}
      </section>

      {profile.role === "teacher" || profile.role === "admin" ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl tracking-tight">Submission Review</h2>

          {submissionReview.length === 0 ? (
            <Card>
              <CardTitle>No submissions yet</CardTitle>
              <CardDescription className="mt-2">
                Student submissions will appear here for scoring and feedback.
              </CardDescription>
            </Card>
          ) : (
            submissionReview.map((item) => (
              <Card key={item.submissionId}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>{item.assignmentTitle}</CardTitle>
                  <Badge tone={item.score === null ? "warning" : "success"}>
                    {item.score === null ? "Needs grading" : `Scored ${item.score}`}
                  </Badge>
                </div>
                <CardDescription className="mt-2">Course: {item.courseTitle}</CardDescription>
                <CardDescription className="mt-1">Student: {shortId(item.studentId)}</CardDescription>
                <CardDescription className="mt-1">
                  Submitted {formatDistanceToNow(new Date(item.submittedAt), { addSuffix: true })}
                </CardDescription>

                {item.submissionText ? (
                  <p className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--text-secondary)]">
                    {item.submissionText}
                  </p>
                ) : null}

                {item.submissionUrl ? (
                  <a
                    href={item.submissionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
                  >
                    Open attached link
                  </a>
                ) : null}

                <form action={gradeAssignmentSubmissionAction} className="mt-4 space-y-3">
                  <input type="hidden" name="submission_id" value={item.submissionId} />
                  <div>
                    <label
                      htmlFor={`score-${item.submissionId}`}
                      className="mb-1 block text-sm text-[var(--text-secondary)]"
                    >
                      Score
                    </label>
                    <Input
                      id={`score-${item.submissionId}`}
                      name="score"
                      type="number"
                      min={0}
                      max={1000}
                      required
                      defaultValue={item.score ?? undefined}
                      className="max-w-[220px]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`feedback-${item.submissionId}`}
                      className="mb-1 block text-sm text-[var(--text-secondary)]"
                    >
                      Feedback
                    </label>
                    <Textarea
                      id={`feedback-${item.submissionId}`}
                      name="feedback"
                      placeholder="Write targeted feedback for the learner."
                      defaultValue={item.feedback ?? ""}
                    />
                  </div>
                  <Button type="submit" variant="secondary">
                    {item.score === null ? "Grade Submission" : "Update Grade"}
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
