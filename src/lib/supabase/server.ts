import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { env, requireServerSecret } from "@/lib/env";
import type { Database } from "@/lib/types/database";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components may not be able to set cookies directly.
          }
        },
      },
    },
  );
}

export function createSupabaseAdminClient() {
  const serviceRoleKey = requireServerSecret(
    env.SUPABASE_SERVICE_ROLE_KEY,
    "SUPABASE_SERVICE_ROLE_KEY",
  );

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
