"use client";

import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="min-h-screen bg-[#F6F7FB] text-[#0F172A] flex items-center">
      <div className="mx-auto max-w-xl w-full px-4 sm:px-6 py-12 space-y-6 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-2xl font-bold shadow-sm">
          !
        </div>
        <h1 className="text-3xl font-semibold">Payment cancelled</h1>
        <p className="text-sm text-slate-600">
          Your Stripe checkout was cancelled. No charges were made. You can retry or continue using the free plan.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r bg-[#0056D6] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
          >
            Retry checkout
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
