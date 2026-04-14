"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import {
  createAnnouncement,
  createAssignmentForCourse,
  createCourseForTeacher,
  createQuizForCourse,
} from "@/lib/data/teacher";

function toIsoOrUndefined(raw: FormDataEntryValue | null) {
  if (!raw || typeof raw !== "string" || raw.trim().length === 0) {
    return undefined;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

export async function createCourseAction(formData: FormData) {
  const { user } = await requireRole(["teacher", "admin"]);

  const { error } = await createCourseForTeacher(user.id, {
    title: String(formData.get("title") ?? ""),
    code: String(formData.get("code") ?? ""),
    description: String(formData.get("description") ?? ""),
    scheduleText: String(formData.get("schedule_text") ?? ""),
    priceCents: Number(formData.get("price_cents") ?? "0"),
    status: String(formData.get("status") ?? "draft") as "draft" | "published" | "archived",
  });

  if (error) {
    redirect(`/teacher/workspace?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/courses");
  revalidatePath("/teacher/workspace");
  redirect("/teacher/workspace?success=Course+created");
}

export async function createAssignmentAction(formData: FormData) {
  const { user } = await requireRole(["teacher", "admin"]);

  const { error } = await createAssignmentForCourse(user.id, {
    courseId: String(formData.get("course_id") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    dueAt: toIsoOrUndefined(formData.get("due_at")),
    maxScore: Number(formData.get("max_score") ?? "100"),
  });

  if (error) {
    redirect(`/teacher/workspace?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/assignments");
  revalidatePath("/teacher/workspace");
  redirect("/teacher/workspace?success=Assignment+created");
}

export async function createQuizAction(formData: FormData) {
  const { user } = await requireRole(["teacher", "admin"]);

  const { error } = await createQuizForCourse(user.id, {
    courseId: String(formData.get("course_id") ?? ""),
    title: String(formData.get("title") ?? ""),
    instructions: String(formData.get("instructions") ?? ""),
    timeLimitMinutes: Number(formData.get("time_limit_minutes") ?? "0") || undefined,
    maxAttempts: Number(formData.get("max_attempts") ?? "1"),
  });

  if (error) {
    redirect(`/teacher/workspace?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/quizzes");
  revalidatePath("/teacher/workspace");
  redirect("/teacher/workspace?success=Quiz+created");
}

export async function createAnnouncementAction(formData: FormData) {
  const { user } = await requireRole(["teacher", "admin"]);

  const courseIdRaw = String(formData.get("course_id") ?? "").trim();

  const { error } = await createAnnouncement(user.id, {
    courseId: courseIdRaw.length ? courseIdRaw : undefined,
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
  });

  if (error) {
    redirect(`/teacher/workspace?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/courses");
  revalidatePath("/teacher/workspace");
  redirect("/teacher/workspace?success=Announcement+published");
}
