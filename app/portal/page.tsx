"use client";

import Link from "next/link";

type IntakeItem = {
  id: string;
  name: string;
  status: "Pending" | "Received" | "Reviewed";
  uploaded: string;
};

const mockIntake: IntakeItem[] = [
  { id: "i1", name: "Client photos (phone export)", status: "Received", uploaded: "Today" },
  { id: "i2", name: "Signed engagement letter", status: "Reviewed", uploaded: "Yesterday" },
  { id: "i3", name: "Medical bills (PDF)", status: "Pending", uploaded: "—" },
];

export default function ClientPortalPreview() {
  return (
    <main className="min-h-screen bg-[#F6F7FB] text-[#0F172A]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#1A3DE3] font-semibold">
              Client portal (mock)
            </p>
            <h1 className="text-3xl font-semibold">Secure upload links for matters</h1>
            <p className="text-sm text-slate-600 mt-1">
              Preview of the upcoming client portal: invite clients, collect uploads, and monitor status per matter.
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
              href="/coming-soon"
              className="inline-flex items-center rounded-full bg-gradient-to-r bg-[#0056D6] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110"
            >
              Join beta list
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] items-start">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Portal link setup</h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-[#1A3DE3] border border-blue-100">
                Preview
              </span>
            </div>
            <div className="space-y-3">
              <label className="flex flex-col text-sm font-semibold text-slate-700">
                Matter name
                <input
                  type="text"
                  defaultValue="Doe v. Metro Transit"
                  className="mt-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-[#1A3DE3] focus:outline-none"
                  readOnly
                />
              </label>
              <label className="flex flex-col text-sm font-semibold text-slate-700">
                Portal URL
                <div className="mt-1 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                  <span>https://portal.caseready.io/m/abc123</span>
                  <span className="ml-auto rounded-full bg-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700">
                    Copy
                  </span>
                </div>
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-[#1A3DE3] focus:ring-[#1A3DE3]" />
                  Require email verification
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-[#1A3DE3] focus:ring-[#1A3DE3]" />
                  Auto-sort uploads into exhibits
                </label>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">What clients see</p>
              <p className="mt-1 text-xs text-slate-600">
                A simple upload page with drag-and-drop, progress bars, and automatic file renaming for exhibits.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Incoming uploads</h2>
              <span className="text-xs text-slate-500">Live mock feed</span>
            </div>
            <div className="space-y-2">
              {mockIntake.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">Uploaded: {item.uploaded}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      item.status === "Reviewed"
                        ? "bg-green-50 text-green-700 border border-green-100"
                        : item.status === "Received"
                        ? "bg-blue-50 text-blue-700 border border-blue-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Turn this into a live portal by wiring uploads to Supabase storage and the matters table.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
