"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { postMessage } from "@/lib/data/messages";

const messageSchema = z.object({
  body: z.string().min(2).max(3000),
  receiverId: z.uuid().optional(),
  courseId: z.uuid().optional(),
});

export async function sendMessageAction(formData: FormData) {
  const { user } = await requireSession();

  const parsed = messageSchema.safeParse({
    body: formData.get("body"),
    receiverId: formData.get("receiver_id") || undefined,
    courseId: formData.get("course_id") || undefined,
  });

  if (!parsed.success) {
    redirect("/messages?error=Invalid+message+payload");
  }

  const { error } = await postMessage({
    senderId: user.id,
    receiverId: parsed.data.receiverId,
    courseId: parsed.data.courseId,
    body: parsed.data.body,
  });

  if (error) {
    redirect(`/messages?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/messages");
  redirect("/messages?success=Message+sent");
}
