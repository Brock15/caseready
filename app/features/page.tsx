"use client";

import Link from "next/link";

type RoadmapItem = {
  title: string;
  detail: string;
  status: "Now" | "Beta" | "Next" | "Later";
};

const roadmap: RoadmapItem[] = [
  {
    title: "Exhibit builder",
    detail: "Bulk upload up to 100 files, Bates stamp, label exhibits, merge, and export judge-ready packets.",
    status: "Now",
  },
  {
    title: "Auto cleanup",
    detail: "Auto-rotate (optional), normalize sizing, color-coded stickers, cover pages, and indexes.",
    status: "Now",
  },
  {
    title: "Timeline builder",
    detail: "Draft litigation timelines from filings and notes; export to PDF decks and exhibits.",
    status: "Beta",
  },
  {
    title: "Stealth redaction",
    detail: "Client-side PDF redaction templates with audit-friendly logs and reversible previews.",
    status: "Beta",
  },
  {
    title: "Evidence workspace",
    detail: "Lightweight notes, summaries, and tasking on matters with AI-assisted highlights.",
    status: "Beta",
  },
  {
    title: "Client portal",
    detail: "Secure upload links for clients; per-matter intake with automatic file renaming and sorting.",
    status: "Beta",
  },
  {
    title: "OCR + search",
    detail: "Full-text OCR across uploaded PDFs, with hit-highlighting inside the exhibit builder.",
    status: "Next",
  },
  {
    title: "AI exhibit suggestions",
    detail: "Suggest exhibit groupings, labels, and descriptions based on content and detected dates.",
    status: "Next",
  },
  {
    title: "Motion/brief assist",
    detail: "Generate draft sections from your record with citations back to your exhibits and timelines.",
    status: "Later",
  },
  {
    title: "Team workspaces",
    detail: "Role-based access, shared matters, and approval workflows for paralegals and attorneys.",
    status: "Later",
  },
];

const statusStyles: Record<RoadmapItem["status"], string> = {
  Now: "bg-green-100 text-green-800 border border-green-200",
  Beta: "bg-amber-100 text-amber-900 border border-amber-200",
  Next: "bg-blue-100 text-blue-800 border border-blue-200",
  Later: "bg-gray-100 text-gray-700 border border-gray-200",
};

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[#F5F2ED] text-[#0F172A]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 space-y-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-brand-royal)] font-semibold">
              Features & Roadmap
            </p>
            <h1 className="text-3xl font-semibold mt-2">What&apos;s live, what&apos;s in beta, and what&apos;s next</h1>
            <p className="text-sm text-gray-600 mt-1 max-w-2xl">
              A transparent view of the tools we ship for attorneys. Everything here is designed for courtroom-ready outputs, not demos.
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
              href="/dashboard"
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Try the builder
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0B1F4F]">Beta tools you can try now</h2>
          <p className="mt-2 text-sm text-gray-700">
            Turn on the &quot;CaseReady Labs&quot; switches in the dashboard to preview these client-safe betas:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li>• Timeline builder: assemble courtroom timelines and export PDF decks.</li>
            <li>• Stealth redaction: client-side redactions with reusable templates.</li>
            <li>• Evidence workspace: summaries and notes per matter with AI assists.</li>
            <li>• Client portal: secure upload links; auto-sort and rename incoming files.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0B1F4F]">Roadmap</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {roadmap.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm hover:border-[var(--color-brand-royal)]/50 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-[#0F172A]">{item.title}</h3>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyles[item.status]}`}>
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-700">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0B1F4F]">How we ship</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li>• Court-first: outputs match filing requirements (page numbers, Bates ranges, exhibit stickers).</li>
            <li>• Privacy-first: no training on your data; betas stay client-side or in your Supabase project.</li>
            <li>• Iterative releases: weekly drops based on attorney feedback from live matters.</li>
            <li>• Opt-in experiments: Labs features stay behind toggles until you&apos;re ready.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/security"
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Read security
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-full bg-[var(--color-brand-royal)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-brand-royal-hover)] transition"
            >
              Upgrade
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
