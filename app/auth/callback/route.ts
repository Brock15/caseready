import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabaseConfig";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  console.log("[Auth Callback] Request URL:", requestUrl.toString());
  console.log("[Auth Callback] Code:", code ? "present" : "missing");
  console.log("[Auth Callback] Error:", error);
  console.log("[Auth Callback] Error Description:", errorDescription);

  const redirectUrl = new URL(next, requestUrl.origin);

  if (error) {
    console.error("[Auth Callback] OAuth error:", error, errorDescription);
    redirectUrl.searchParams.set(
      "error",
      errorDescription || "Google sign-in failed. Please try again."
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              console.error("[Auth Callback] Cookie set error:", error);
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: "", ...options });
            } catch (error) {
              console.error("[Auth Callback] Cookie remove error:", error);
            }
          },
        },
      }
    );

    console.log("[Auth Callback] Attempting to exchange code for session...");
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[Auth Callback] Exchange error:", exchangeError);
      redirectUrl.pathname = "/signin";
      redirectUrl.searchParams.set("error", exchangeError.message);
      return NextResponse.redirect(redirectUrl);
    }

    console.log("[Auth Callback] Session exchanged successfully:", data?.session?.user?.email);
  }

  console.log("[Auth Callback] Redirecting to:", redirectUrl.toString());
  return NextResponse.redirect(redirectUrl);
}
