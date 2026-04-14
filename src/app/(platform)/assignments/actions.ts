"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { gradeAssignmentSubmission, submitAssignment } from "@/lib/data/assignments";

const submissionSchema = z.object({
  assignmentId: z.string().uuid(),
  submissionText: z.string().min(8).max(8000),
  submissionUrl: z.url().optional(),
});

const gradingSchema = z.object({
  submissionId: z.uuid(),
  score: z.coerce.number().min(0).max(1000),
  feedback: z.string().max(4000).optional(),
});

export async function submitAssignmentAction(formData: FormData) {
  const { user } = await requireRole(["student"]);

  const parsed = submissionSchema.safeParse({
    assignmentId: formData.get("assignment_id"),
    submissionText: formData.get("submission_text"),
    submissionUrl: formData.get("submission_url") || undefined,
  });

  if (!parsed.success) {
    redirect("/assignments?error=Invalid+submission+payload");
  }

  const { error } = await submitAssignment(
    parsed.data.assignmentId,
    user.id,
    parsed.data.submissionText,
    parsed.data.submissionUrl,
  );

  if (error) {
    redirect(`/assignments?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/assignments");
  redirect("/assignments?success=Assignment+submitted");
}

export async function gradeAssignmentSubmissionAction(formData: FormData) {
  const { user } = await requireRole(["teacher", "admin"]);

  const parsed = gradingSchema.safeParse({
    submissionId: formData.get("submission_id"),
    score: formData.get("score"),
    feedback: formData.get("feedback") || undefined,
  });

  if (!parsed.success) {
    redirect("/assignments?error=Invalid+grading+payload");
  }

  const { error } = await gradeAssignmentSubmission({
    submissionId: parsed.data.submissionId,
    graderId: user.id,
    score: parsed.data.score,
    feedback: parsed.data.feedback,
  });

  if (error) {
    redirect(`/assignments?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/assignments");
  revalidatePath("/dashboard");
  redirect("/assignments?success=Submission+graded");
}
