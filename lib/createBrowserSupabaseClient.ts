import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns a Supabase client configured to keep the session in cookies
 * so that middleware and server routes can read auth state.
 */
export const createBrowserSupabaseClient = (): SupabaseClient =>
  createClientComponentClient();
