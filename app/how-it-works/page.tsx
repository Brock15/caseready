"use client";

import Link from "next/link";

type Step = {
  title: string;
  detail: string;
};

const steps: Step[] = [
  {
    title: "Upload in bulk",
    detail: "Drop up to 100 PDFs, photos, or screenshots. TLS in transit; files stay inside your Supabase project—no third-party model training.",
  },
  {
    title: "Auto-format",
    detail: "CaseReady merges, sizes, and stamps with Bates + exhibit stickers. Optional cover/index templates keep judges and clerks happy.",
  },
  {
    title: "Export + share",
    detail: "Download a single, court-ready PDF. Signed URLs keep links short-lived; redact locally before sharing anything privileged.",
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
            <p className="text-xs uppercase tracking-[0.3em] text-[#0056D6] font-semibold">
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
              className="inline-flex items-center rounded-full bg-[#0056D6] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110"
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
            {steps.map((step, idx) => (
              <div
                key={step.title}
                className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br bg-[#0056D6] text-white font-semibold text-base shadow-sm">
                  {idx + 1}
                </span>
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
              <p className="text-xs uppercase tracking-[0.2em] text-[#0056D6] font-semibold">Video walkthrough</p>
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
              <p className="text-xs uppercase tracking-[0.2em] text-[#0056D6] font-semibold">Next steps</p>
              <h2 className="text-xl font-semibold text-[#0F172A]">Ready to try it on your matter?</h2>
              <p className="text-sm text-gray-700">
                Upload your exhibits, let CaseReady format them, and export a single PDF. Upgrade when you need unlimited runs.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-full bg-[#0056D6] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
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
