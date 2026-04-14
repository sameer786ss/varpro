import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const scheduleSchema = z.object({
  title: z.string().min(4).max(120),
  notes: z.string().max(2000).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export async function getStaffSchedule(staffId: string) {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("staff_schedules")
    .select("*")
    .eq("staff_id", staffId)
    .order("starts_at", { ascending: true })
    .limit(100);

  return data ?? [];
}

export async function createStaffScheduleItem(
  staffId: string,
  payload: z.infer<typeof scheduleSchema>,
) {
  const data = scheduleSchema.parse(payload);
  const supabase = await createSupabaseServerClient();

  return supabase.from("staff_schedules").insert({
    staff_id: staffId,
    title: data.title,
    notes: data.notes ?? null,
    starts_at: data.startsAt,
    ends_at: data.endsAt,
  });
}
