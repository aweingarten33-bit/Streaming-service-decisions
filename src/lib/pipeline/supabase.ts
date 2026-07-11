import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

/** Server-side client using the service role key — pipeline scripts only, never expose to a browser bundle. */
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
