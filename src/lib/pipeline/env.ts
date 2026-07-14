import { z } from "zod";

const schema = z.object({
  // Optional so the site can build/deploy before these are configured --
  // callers (llm.ts, tmdb.ts) throw a clear error if actually used without
  // one set, rather than the whole build refusing to run.
  ANTHROPIC_API_KEY: z.string().optional(),
  TMDB_API_KEY: z.string().optional(),
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
  throw new Error(
    `Missing/invalid environment variables: ${missing}. Copy .env.example to .env and fill in values.`,
  );
}

export const env = parsed.data;
