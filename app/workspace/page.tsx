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
    <main className="min-h-screen bg-[#F6F7FB] text-[#0F172A]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#1A3DE3] font-semibold">
              Evidence workspace
            </p>
            <h1 className="text-3xl font-semibold">Mock workspace preview</h1>
            <p className="text-sm text-slate-600 mt-1">
              Notes, tasks, and exhibit status in one place. Switch to the builder to generate packets.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 shadow-sm"
            >
              ← Back to dashboard
            </Link>
            <Link
              href="/builder"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-[#3FA9FF] to-[#0056D6] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110"
            >
              Open exhibit builder
            </Link>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.2fr,0.8fr] items-start">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Notes & tasks</h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-[#1A3DE3] border border-blue-100">
                Mock data
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {mockNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{note.title}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      {note.tag}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{note.body}</p>
                  <p className="text-[11px] text-slate-500">Updated {note.updated}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Exhibit status</h2>
              <span className="text-xs text-slate-500">Preview</span>
            </div>
            <div className="space-y-2">
              {mockEvidence.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.label} • {item.type}
                    </p>
                    <p className="text-xs text-slate-500">{item.pages} pages</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      item.status === "Reviewed"
                        ? "bg-green-50 text-green-700 border border-green-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              This is a mock workspace. Integrate with your Supabase data to show real matters and exhibits.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
