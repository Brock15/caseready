"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/createBrowserSupabaseClient";

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [status, setStatus] = useState("Exchanging credentials…");

  useEffect(() => {
    const exchangeSession = async () => {
      const code = searchParams.get("code");
      const next = searchParams.get("next") || "/dashboard";
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus("Failed to complete sign-in. Redirecting to sign in…");
          router.replace(`/signin?error=${encodeURIComponent(error.message)}`);
          return;
        }
      } else {
        // Handle hash fragments (implicit flow) if present
        await supabase.auth.getSession();
      }
      router.replace(next);
    };

    exchangeSession();
  }, [router, searchParams, supabase]);

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center px-4">
      <div className="rounded-3xl border border-slate-800 bg-[#0B1220] px-6 py-8 text-center space-y-2 shadow-lg">
        <p className="text-xs uppercase tracking-[0.3em] text-[#7DD3FC] font-semibold">
          Signing in
        </p>
        <p className="text-sm text-slate-300">{status}</p>
      </div>
    </main>
  );
}
