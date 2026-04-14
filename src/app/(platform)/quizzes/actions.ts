"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const submitAttemptSchema = z.object({
  quizId: z.uuid(),
  responseText: z.string().min(8).max(8000),
});

const gradeAttemptSchema = z.object({
  attemptId: z.uuid(),
  score: z.coerce.number().min(0).max(100),
});

export async function submitQuizAttemptAction(formData: FormData) {
  const { user } = await requireRole(["student"]);

  const parsed = submitAttemptSchema.safeParse({
    quizId: formData.get("quiz_id"),
    responseText: formData.get("response_text"),
  });

  if (!parsed.success) {
    redirect("/quizzes?error=Invalid+quiz+attempt+payload");
  }

  const supabase = await createSupabaseServerClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, max_attempts")
    .eq("id", parsed.data.quizId)
    .single();

  if (!quiz) {
    redirect("/quizzes?error=Quiz+not+found");
  }

  const { count: attemptsCount } = await supabase
    .from("quiz_attempts")
    .select("id", { count: "exact", head: true })
    .eq("quiz_id", parsed.data.quizId)
    .eq("student_id", user.id);

  if ((attemptsCount ?? 0) >= quiz.max_attempts) {
    redirect("/quizzes?error=Maximum+attempt+limit+reached");
  }

  const { error } = await supabase.from("quiz_attempts").insert({
    quiz_id: parsed.data.quizId,
    student_id: user.id,
    answers: {
      responseText: parsed.data.responseText,
    },
    submitted_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/quizzes?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/quizzes");
  redirect("/quizzes?success=Quiz+attempt+submitted");
}

export async function gradeQuizAttemptAction(formData: FormData) {
  await requireRole(["teacher", "admin"]);

  const parsed = gradeAttemptSchema.safeParse({
    attemptId: formData.get("attempt_id"),
    score: formData.get("score"),
  });

  if (!parsed.success) {
    redirect("/quizzes?error=Invalid+grading+payload");
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("quiz_attempts")
    .update({
      score: parsed.data.score,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.attemptId);

  if (error) {
    redirect(`/quizzes?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/quizzes");
  revalidatePath("/courses");
  redirect("/quizzes?success=Attempt+graded");
}
