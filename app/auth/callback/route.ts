import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    // This exchanges the OAuth code for a session and sets cookies for caseready.io
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect the user to the intended page (defaults to /dashboard)
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
