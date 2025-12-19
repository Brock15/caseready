"use client";

import Link from "next/link";

export default function ComingSoonPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-xl w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">
          Preview — Under Development
        </span>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">This feature is coming soon</h1>
        <p className="mt-2 text-sm text-slate-600">
          We&apos;re putting all energy into the Exhibit Builder right now. This feature will be released soon.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full bg-gradient-to-r bg-[#0056D6] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
          >
            Go to Exhibit Builder
          </Link>
          <Link
            href="mailto:hello@caseready.io?subject=Feature%20early%20access"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Request early access
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          The Exhibit Builder is fully operational. Reach out if you want to pilot this feature early.
        </p>
      </div>
    </main>
  );
}
