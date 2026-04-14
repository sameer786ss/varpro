import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types/domain";
import type { Database } from "@/lib/types/database";

export interface SessionContext {
  user: User;
  profile: Database["public"]["Tables"]["profiles"]["Row"];
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return null;
  }

  return { user, profile };
}

export async function requireSession() {
  const session = await getSessionContext();

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

export async function requireRole(allowedRoles: AppRole[]) {
  const session = await requireSession();

  if (!allowedRoles.includes(session.profile.role)) {
    redirect("/dashboard?unauthorized=1");
  }

  return session;
}
