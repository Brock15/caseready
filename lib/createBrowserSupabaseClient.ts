import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabaseConfig";

/**
 * Returns a Supabase client configured to keep the session in cookies
 * so that middleware and server routes can read auth state.
 */
export const createBrowserSupabaseClient = () =>
  createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
