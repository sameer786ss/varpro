import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const announcementSchema = z.object({
  title: z.string().min(4).max(160),
  body: z.string().min(8).max(5000),
  courseId: z.uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: actorProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!actorProfile || !["teacher", "admin"].includes(actorProfile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = announcementSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { error } = await supabase.from("announcements").insert({
      author_id: user.id,
      course_id: parsed.data.courseId ?? null,
      title: parsed.data.title,
      body: parsed.data.body,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    let recipients: { id: string }[] = [];

    if (parsed.data.courseId) {
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("student_id")
        .eq("course_id", parsed.data.courseId);

      const studentIds = (enrollments ?? []).map((item) => item.student_id);

      if (studentIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .in("id", studentIds);

        recipients = profiles ?? [];
      }
    } else {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["student", "teacher", "staff"]);
      recipients = profiles ?? [];
    }

    if (recipients.length) {
      await supabase.from("notifications").insert(
        recipients.map((recipient) => ({
          user_id: recipient.id,
          title: parsed.data.title,
          body: parsed.data.body,
          category: "announcement",
        })),
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send announcement";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
