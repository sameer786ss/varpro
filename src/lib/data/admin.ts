import { z } from "zod";

import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import type { AppRole } from "@/lib/types/domain";

const roleSchema = z.enum(["student", "teacher", "admin", "staff"]);

type AdminUserSummary = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "email" | "role" | "created_at"
>;

type AdminCourseSummary = Pick<
  Database["public"]["Tables"]["courses"]["Row"],
  "id" | "title" | "code" | "status" | "teacher_id" | "price_cents" | "created_at"
>;

export async function getAdminUsers(): Promise<AdminUserSummary[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (data ?? []) as AdminUserSummary[];
}

export async function getAdminCourseSummary(): Promise<AdminCourseSummary[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("courses")
    .select("id, title, code, status, teacher_id, price_cents, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (data ?? []) as AdminCourseSummary[];
}

export async function updateUserRole(userId: string, role: AppRole) {
  const validatedRole = roleSchema.parse(role);
  const supabase = createSupabaseAdminClient();

  return supabase.from("profiles").update({ role: validatedRole }).eq("id", userId);
}
