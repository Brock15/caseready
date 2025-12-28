"use client";

import Link from "next/link";

type Note = {
  id: string;
  title: string;
  body: string;
  tag: string;
  updated: string;
};

const mockNotes: Note[] = [
  {
    id: "n1",
    title: "Summary of Exhibits A–D",
    body: "Key facts + cites to deposition pages 12–18. Highlight Exhibit C for the motion.",
    tag: "Summary",
    updated: "Today",
  },
  {
    id: "n2",
    title: "Tasks for hearing",
    body: "Print timeline packet, verify Bates range CR_0001–0048, prep slip sheets.",
    tag: "Tasks",
    updated: "Yesterday",
  },
  {
    id: "n3",
    title: "Client questions",
    body: "Confirm date of service for notice; add screenshots from phone export.",
    tag: "Client",
    updated: "2d ago",
  },
];

const mockEvidence = [
  { label: "Ex. A", type: "PDF", pages: 12, status: "Reviewed" },
  { label: "Ex. B", type: "Image", pages: 3, status: "Needs notes" },
  { label: "Ex. C", type: "Email", pages: 8, status: "Reviewed" },
];

export default function EvidenceWorkspacePage() {
  return (
    <main className="min-h-screen bg-[#F5F2ED]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-2 border-b border-[#E5E0D8]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-brand-royal)] font-semibold">
              Evidence workspace
            </p>
            <h1 className="text-3xl font-semibold text-[#0F1419] tracking-tight mt-2">
              Notes, tasks, and exhibit tracking
            </h1>
            <p className="text-sm text-[#6B6560] mt-2 max-w-2xl">
              Keep all evidence notes and task lists in one place. Switch to the builder to generate court-ready exhibit packets.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-xs font-semibold text-[#1A1614] hover:bg-[#F5F2ED] transition"
            >
              ← Dashboard
            </Link>
            <Link
              href="/builder"
              className="inline-flex items-center rounded-full bg-[var(--color-brand-royal)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-brand-royal-hover)] transition"
            >
              Exhibit builder
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] items-start">
          <div className="rounded-3xl border border-[#E5E0D8] bg-white p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#0F1419] tracking-tight">Notes & tasks</h2>
              <span className="rounded-full bg-[var(--color-brand-royal)]/5 px-3 py-1 text-[11px] font-semibold text-[var(--color-brand-royal)] border border-[var(--color-brand-royal)]/10">
                Preview
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {mockNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-[#E5E0D8] bg-white hover:border-[#0A1F3F]/20 hover:shadow-sm transition-all duration-200 overflow-hidden group"
                >
                  {/* Stripe */}
                  <div className="h-1 bg-gradient-to-r from-[var(--color-brand-royal)]/60 via-[var(--color-brand-royal)]/30 to-transparent" />

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#0F1419] tracking-tight">{note.title}</p>
                      <span className="rounded-full bg-[#6B6560]/5 px-2 py-0.5 text-[11px] font-medium text-[#6B6560] border border-[#6B6560]/10">
                        {note.tag}
                      </span>
                    </div>
                    <p className="text-sm text-[#6B6560]">{note.body}</p>
                    <p className="text-[11px] text-[#6B6560]/70">Updated {note.updated}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#E5E0D8] bg-white p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#0F1419] tracking-tight">Exhibit status</h2>
              <span className="text-xs text-[#6B6560]">Live feed</span>
            </div>
            <div className="space-y-3">
              {mockEvidence.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[#E5E0D8] bg-white hover:border-[#0A1F3F]/20 hover:shadow-sm transition-all duration-200 overflow-hidden group"
                >
                  {/* Stripe */}
                  <div className="h-1 bg-gradient-to-r from-[var(--color-brand-royal)]/60 via-[var(--color-brand-royal)]/30 to-transparent" />

                  <div className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-semibold text-[#0F1419] tracking-tight">
                        {item.label} • {item.type}
                      </p>
                      <p className="text-xs text-[#6B6560] mt-0.5">{item.pages} pages</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${
                        item.status === "Reviewed"
                          ? "bg-[#0A1F3F]/5 text-[#0A1F3F] border border-[#0A1F3F]/10"
                          : "bg-[var(--color-brand-royal)]/5 text-[var(--color-brand-royal)] border border-[var(--color-brand-royal)]/10"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#6B6560]">
              Wire this to Supabase to display real matters and exhibit metadata from your database.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
