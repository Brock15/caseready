import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import "@/lib/supabaseConfig";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;

  if (!session && pathname.startsWith("/api/generate-exhibit")) {
    return NextResponse.json(
      { ok: false, message: "You must sign in to use this endpoint." },
      { status: 401 }
    );
  }

  if (session && pathname === "/signin") {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.searchParams.delete("redirectedFrom");
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ["/signin", "/api/generate-exhibit/:path*"],
};
