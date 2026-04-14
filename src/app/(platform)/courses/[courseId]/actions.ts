"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const enrollmentSchema = z.object({
  courseId: z.uuid(),
});

export async function enrollCourseAction(formData: FormData) {
  const { user } = await requireRole(["student"]);

  const parsed = enrollmentSchema.safeParse({
    courseId: formData.get("course_id"),
  });

  if (!parsed.success) {
    redirect("/courses?error=Invalid+course+id");
  }

  const supabase = await createSupabaseServerClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", parsed.data.courseId)
    .single();

  if (!course) {
    redirect("/courses?error=Course+not+found");
  }

  const { error } = await supabase.from("course_enrollments").upsert(
    {
      course_id: parsed.data.courseId,
      student_id: user.id,
      status: "active",
      progress_percent: 0,
    },
    {
      onConflict: "course_id,student_id",
    },
  );

  if (error) {
    redirect(`/courses/${parsed.data.courseId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/courses");
  revalidatePath(`/courses/${parsed.data.courseId}`);
  redirect(`/courses/${parsed.data.courseId}?success=Enrolled+successfully`);
}
