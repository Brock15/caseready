import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabaseConfig";

/**
 * Returns a Supabase client configured to keep the session in cookies
 * so that middleware and server routes can read auth state.
 */
export const createBrowserSupabaseClient = () =>
  createClientComponentClient({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY,
  });
