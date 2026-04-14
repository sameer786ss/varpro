"use server";

import { z } from "zod";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(8),
  nextPath: z.string().default("/dashboard"),
});

const signUpSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.email().trim(),
  password: z
    .string()
    .min(8)
    .regex(/[a-zA-Z]/)
    .regex(/[0-9]/),
  role: z.enum(["student", "teacher", "staff"]).default("student"),
});

function resolveSafePath(input: string | null) {
  if (!input || !input.startsWith("/")) {
    return "/dashboard";
  }

  return input;
}

export async function signInAction(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    nextPath: formData.get("next"),
  });

  if (!parsed.success) {
    redirect("/sign-in?error=Invalid+credentials+payload");
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  redirect(resolveSafePath(parsed.data.nextPath));
}

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    redirect("/sign-up?error=Invalid+registration+details");
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        role: parsed.data.role,
      },
    },
  });

  if (error) {
    redirect(`/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/sign-in?success=Account+created.+Sign+in+to+continue");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
