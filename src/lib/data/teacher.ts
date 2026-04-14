import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const createCourseSchema = z.object({
  title: z.string().min(5).max(150),
  code: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/),
  description: z.string().max(4000).optional(),
  scheduleText: z.string().max(500).optional(),
  priceCents: z.coerce.number().min(0).max(2_000_000),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

const createAssignmentSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(4).max(150),
  description: z.string().max(4000).optional(),
  dueAt: z.string().datetime().optional(),
  maxScore: z.coerce.number().min(1).max(1000).default(100),
});

const createQuizSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(4).max(150),
  instructions: z.string().max(4000).optional(),
  timeLimitMinutes: z.coerce.number().min(1).max(180).optional(),
  maxAttempts: z.coerce.number().min(1).max(10).default(1),
});

const createAnnouncementSchema = z.object({
  courseId: z.string().uuid().optional(),
  title: z.string().min(4).max(160),
  body: z.string().min(8).max(5000),
});

export async function createCourseForTeacher(
  teacherId: string,
  payload: z.infer<typeof createCourseSchema>,
) {
  const data = createCourseSchema.parse(payload);
  const supabase = await createSupabaseServerClient();

  return supabase.from("courses").insert({
    title: data.title,
    code: data.code.toUpperCase(),
    description: data.description ?? null,
    teacher_id: teacherId,
    schedule_text: data.scheduleText ?? null,
    price_cents: data.priceCents,
    status: data.status,
  });
}

export async function createAssignmentForCourse(
  teacherId: string,
  payload: z.infer<typeof createAssignmentSchema>,
) {
  const data = createAssignmentSchema.parse(payload);
  const supabase = await createSupabaseServerClient();

  return supabase.from("assignments").insert({
    course_id: data.courseId,
    title: data.title,
    description: data.description ?? null,
    due_at: data.dueAt ?? null,
    max_score: data.maxScore,
    created_by: teacherId,
  });
}

export async function createQuizForCourse(
  teacherId: string,
  payload: z.infer<typeof createQuizSchema>,
) {
  const data = createQuizSchema.parse(payload);
  const supabase = await createSupabaseServerClient();

  return supabase.from("quizzes").insert({
    course_id: data.courseId,
    title: data.title,
    instructions: data.instructions ?? null,
    time_limit_minutes: data.timeLimitMinutes ?? null,
    max_attempts: data.maxAttempts,
    created_by: teacherId,
  });
}

export async function createAnnouncement(
  authorId: string,
  payload: z.infer<typeof createAnnouncementSchema>,
) {
  const data = createAnnouncementSchema.parse(payload);
  const supabase = await createSupabaseServerClient();

  return supabase.from("announcements").insert({
    author_id: authorId,
    course_id: data.courseId ?? null,
    title: data.title,
    body: data.body,
  });
}
