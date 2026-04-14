import { NextResponse } from "next/server";
import { z } from "zod";

import { generateTutorResponse } from "@/lib/ai/gemma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const payloadSchema = z.object({
  prompt: z.string().min(4).max(4000),
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

    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    let courseTitle: string | null = null;

    if (parsed.data.courseId) {
      const { data: course } = await supabase
        .from("courses")
        .select("title")
        .eq("id", parsed.data.courseId)
        .maybeSingle();

      courseTitle = course?.title ?? null;
    }

    const answer = await generateTutorResponse({
      prompt: parsed.data.prompt,
      learnerName: profile?.full_name ?? null,
      courseTitle,
    });

    await supabase.from("ai_tutor_logs").insert({
      user_id: user.id,
      course_id: parsed.data.courseId ?? null,
      prompt: parsed.data.prompt,
      response: answer,
    });

    return NextResponse.json({ answer }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate tutor response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
