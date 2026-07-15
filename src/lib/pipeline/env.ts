import { z } from "zod";

const schema = z.object({
  // Optional so the site can build/deploy before these are configured.
  // Callers validate required values lazily when a feature actually uses them.
  ANTHROPIC_API_KEY: z.string().optional(),
  TMDB_API_KEY: z.string().optional(),
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL").optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const invalid = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
  throw new Error(
    `Invalid environment variables: ${invalid}. Copy .env.example to .env and fill in values.`,
  );
}

export const env = parsed.data;

export function requireEnv(name: keyof typeof env): string {
  const value = env[name];
  if (!value) {
    throw new Error(`${name} is not set -- add it in your environment to use this feature.`);
  }
  return value;
}
