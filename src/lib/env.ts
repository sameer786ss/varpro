import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  GOOGLE_GENAI_API_KEY: z.string().min(1).optional(),
  GEMMA_MODEL: z.string().min(1).default("gemma-3-27b-it"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL:
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GOOGLE_GENAI_API_KEY: process.env.GOOGLE_GENAI_API_KEY,
  GEMMA_MODEL: process.env.GEMMA_MODEL ?? "gemma-3-27b-it",
  APP_BASE_URL: process.env.APP_BASE_URL ?? "http://localhost:3000",
});

export function requireServerSecret(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}
