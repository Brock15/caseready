"use client";

import Link from "next/link";

type Step = {
  title: string;
  detail: string;
  icon: React.ReactNode;
};

const steps: Step[] = [
  {
    title: "Upload in bulk",
    detail: "Drop up to 100 PDFs, photos, or screenshots. TLS in transit; files stay inside your Supabase project—no third-party model training.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
  },
  {
    title: "Auto-format",
    detail: "CaseReady merges, sizes, and stamps with Bates + exhibit stickers. Optional cover/index templates keep judges and clerks happy.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "Export + share",
    detail: "Download a single, court-ready PDF. Signed URLs keep links short-lived; redact locally before sharing anything privileged.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

const callouts = [
  {
    title: "What’s happening under the hood?",
    body: "Server-side sharp/pdf-lib handle sizing, stamping, and merging. Processing is in-memory; outputs stream back without training on your data.",
  },
  {
    title: "Attorney-ready defaults",
    body: "Bates prefix, exhibit stickers, page numbers, and optional cover/index keep filings consistent. Slip sheets and color-coded stickers for firm-branded plans.",
  },
  {
    title: "Safe handling",
    body: "Stay within your Supabase project with signed URLs for private buckets. No payloads in logs. Redactions remain client-side in beta.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#F6F7FB] text-[#0F172A]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 space-y-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-brand-royal)] font-semibold">
              How it works
            </p>
            <h1 className="text-3xl font-semibold mt-2">From messy uploads to court-ready exhibits</h1>
            <p className="text-sm text-gray-600 mt-2 max-w-2xl">
              A clean, attorney-proof flow: drop files, let CaseReady format, then export a single PDF with Bates, stickers, and optional cover/index.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-full bg-[var(--color-brand-royal)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-brand-royal-hover)] transition"
            >
              View pricing
            </Link>
            <Link
              href="/features#roadmap"
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              View roadmap
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0B1F4F]">Step-by-step</h2>
          <p className="mt-2 text-sm text-gray-700">
            Judge-ready defaults out of the box. Toggle branding, sticker positions, and index/cover options per matter.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-royal)] text-white shadow-sm">
                  {step.icon}
                </div>
                <h3 className="mt-3 text-base font-semibold text-[#0F172A]">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-700">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-[#0B1F4F]">Built for legal workflows</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Bates ranges and exhibit stickers stay consistent across matters; cover/index are optional per plan.</li>
            <li>• Page numbers on every page, even after merges and slip sheets.</li>
            <li>• Client-safe: files live in your Supabase storage; signed URLs expire; no payloads in logs.</li>
            <li>• Redactions remain client-side in beta; we never train on your documents.</li>
          </ul>
          <div className="grid gap-3 md:grid-cols-3">
            {callouts.map((item) => (
              <div key={item.title} className="rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-[#0F172A]">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-700">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-brand-royal)] font-semibold">Video walkthrough</p>
              <h2 className="text-xl font-semibold text-[#0F172A]">See the full flow in action</h2>
              <p className="text-sm text-gray-700 mt-1">
                Upload → auto-format → Bates + stickers → export. Swap this source with your preferred hosted video or keep /public/case1.mp4.
              </p>
            </div>
            <span className="hidden sm:inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-[#0F2F8F] border border-blue-100">
              Autoplays on load
            </span>
          </div>
          <div className="mt-4 rounded-3xl overflow-hidden border border-gray-200 shadow-lg bg-black/90">
            <video
              src="/case1.mp4"
              poster="/placeholder-video-poster.jpg"
              autoPlay
              loop
              muted
              playsInline
              controls
              className="w-full h-[420px] object-cover"
            />
          </div>
        </section>

        <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-brand-royal)] font-semibold">Next steps</p>
              <h2 className="text-xl font-semibold text-[#0F172A]">Ready to try it on your matter?</h2>
              <p className="text-sm text-gray-700">
                Upload your exhibits, let CaseReady format them, and export a single PDF. Upgrade when you need unlimited runs.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-full bg-[var(--color-brand-royal)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-brand-royal-hover)] transition"
              >
                Go to dashboard
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                View pricing
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
