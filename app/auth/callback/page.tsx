"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get("next") || "/dashboard";
    router.replace(next);
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center px-4">
      <div className="rounded-3xl border border-slate-800 bg-[#0B1220] px-6 py-8 text-center space-y-2 shadow-lg">
        <p className="text-xs uppercase tracking-[0.3em] text-[#7DD3FC] font-semibold">
          Signing in
        </p>
        <p className="text-sm text-slate-300">
          Redirecting you to your workspace…
        </p>
      </div>
    </main>
  );
}
