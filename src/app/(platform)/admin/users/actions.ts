"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { updateUserRole } from "@/lib/data/admin";

const updateRoleSchema = z.object({
  userId: z.uuid(),
  role: z.enum(["student", "teacher", "admin", "staff"]),
});

export async function updateUserRoleAction(formData: FormData) {
  await requireRole(["admin"]);

  const parsed = updateRoleSchema.safeParse({
    userId: formData.get("user_id"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    redirect("/admin/users?error=Invalid+role+update");
  }

  const { error } = await updateUserRole(parsed.data.userId, parsed.data.role);

  if (error) {
    redirect(`/admin/users?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/users");
  redirect("/admin/users?success=Role+updated");
}
