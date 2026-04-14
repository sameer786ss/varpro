"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { createStaffScheduleItem } from "@/lib/data/staff";

function toIso(raw: FormDataEntryValue | null) {
  if (!raw || typeof raw !== "string") {
    return "";
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString();
}

export async function createScheduleItemAction(formData: FormData) {
  const { user } = await requireRole(["staff", "admin"]);

  const startsAt = toIso(formData.get("starts_at"));
  const endsAt = toIso(formData.get("ends_at"));

  const { error } = await createStaffScheduleItem(user.id, {
    title: String(formData.get("title") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    startsAt,
    endsAt,
  });

  if (error) {
    redirect(`/staff/schedule?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/staff/schedule");
  redirect("/staff/schedule?success=Schedule+item+added");
}
