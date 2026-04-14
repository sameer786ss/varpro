"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { submitAssignment } from "@/lib/data/assignments";

const submissionSchema = z.object({
  assignmentId: z.string().uuid(),
  submissionText: z.string().min(8).max(8000),
  submissionUrl: z.url().optional(),
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
