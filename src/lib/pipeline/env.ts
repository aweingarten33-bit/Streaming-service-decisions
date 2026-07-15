import { z } from "zod";

const schema = z.object({
  YOUTUBE_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  TMDB_API_KEY: z.string().min(1, "TMDB_API_KEY is required"),
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  // Optional: only needed by legacy ingestion scripts, not the Marquee app.
  REDDIT_CLIENT_ID: z.string().optional(),
  REDDIT_CLIENT_SECRET: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
  throw new Error(
    `Missing/invalid environment variables: ${missing}. Copy .env.example to .env and fill in values.`,
  );
}

export const env = parsed.data;
