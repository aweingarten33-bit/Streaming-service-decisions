/**
 * Environment access.
 *
 * The offline ingestion pipeline needs several keys (YouTube, Anthropic, Reddit),
 * but the *runtime* Next.js app only ever touches Supabase and TMDB. Validating
 * every key eagerly at import time meant a single missing pipeline-only key took
 * the entire site down. So we validate lazily, per key, on first access — the app
 * boots with just Supabase + TMDB, and the pipeline scripts still fail loudly if
 * their keys are missing when they actually run.
 */

const OPTIONAL = new Set(["REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET"]);

interface Env {
  YOUTUBE_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  TMDB_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  REDDIT_CLIENT_ID?: string;
  REDDIT_CLIENT_SECRET?: string;
}

function resolve(key: string): string | undefined {
  // Support the Supabase integration's prefixed variables as fallbacks.
  if (key === "SUPABASE_URL") {
    return (
      process.env.SUPABASE_URL ??
      process.env.SUPABASE_SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );
  }
  if (key === "SUPABASE_SERVICE_ROLE_KEY") {
    return (
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_SERVICE_ROLE
    );
  }
  return process.env[key];
}

export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    const value = resolve(prop);
    if (!value && !OPTIONAL.has(prop)) {
      throw new Error(
        `Missing environment variable: ${prop}. Set it in your project's environment variables.`,
      );
    }
    return value;
  },
});
