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
    <main className="min-h-screen bg-[#F5F2ED]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-2 border-b border-[#E5E0D8]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-brand-royal)] font-semibold">
              Client Portal
            </p>
            <h1 className="text-3xl font-semibold text-[#0F1419] tracking-tight mt-2">
              Secure upload links for client collaboration
            </h1>
            <p className="text-sm text-[#6B6560] mt-2 max-w-2xl">
              Create private upload portals for each matter. Clients upload directly to your secure storage—no email attachments, no file-size limits.
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
              href="/coming-soon"
              className="inline-flex items-center rounded-full bg-[var(--color-brand-royal)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-brand-royal-hover)] transition"
            >
              Join beta list
            </Link>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] items-start">
          {/* Portal setup card */}
          <section className="rounded-3xl border border-[#E5E0D8] bg-white p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#0F1419] tracking-tight">Portal link setup</h2>
              <span className="rounded-full bg-[var(--color-brand-royal)]/5 px-3 py-1 text-[11px] font-semibold text-[var(--color-brand-royal)] border border-[var(--color-brand-royal)]/10">
                Preview
              </span>
            </div>

            <div className="space-y-4">
              <label className="flex flex-col text-sm font-semibold text-[#0F1419]">
                Matter name
                <input
                  type="text"
                  defaultValue="Doe v. Metro Transit"
                  className="mt-1 rounded-2xl border border-[#E5E0D8] bg-white px-4 py-2.5 text-sm text-[#0F1419] focus:border-[var(--color-brand-royal)] focus:outline-none"
                  readOnly
                />
              </label>

              <div className="flex flex-col text-sm font-semibold text-[#0F1419]">
                <span className="mb-1">Portal URL</span>
                <div className="flex items-center gap-2 rounded-2xl border border-[#E5E0D8] bg-[#F5F2ED]/50 px-4 py-2.5 text-sm text-[#6B6560]">
                  <span className="flex-1">https://portal.caseready.io/m/abc123</span>
                  <button
                    type="button"
                    className="rounded-full bg-white border border-[#E5E0D8] px-3 py-1 text-[11px] font-semibold text-[#0F1419] hover:bg-[#F5F2ED] transition"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm font-medium text-[#0F1419] cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-[#E5E0D8] text-[var(--color-brand-royal)] focus:ring-[var(--color-brand-royal)]" />
                  Require email verification
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-[#0F1419] cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-[#E5E0D8] text-[var(--color-brand-royal)] focus:ring-[var(--color-brand-royal)]" />
                  Auto-sort uploads into exhibits
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5E0D8] bg-[#F5F2ED]/50 p-5 space-y-2">
              <p className="text-sm font-semibold text-[#0F1419]">What clients see</p>
              <p className="text-xs text-[#6B6560] leading-relaxed">
                A simple upload page with drag-and-drop, progress bars, and automatic file renaming for exhibits. No login required—just a secure link.
              </p>
            </div>
          </section>

          {/* Incoming uploads card */}
          <section className="rounded-3xl border border-[#E5E0D8] bg-white p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#0F1419] tracking-tight">Incoming uploads</h2>
              <span className="text-xs text-[#6B6560]">Live feed</span>
            </div>

            <div className="space-y-3">
              {mockIntake.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#E5E0D8] bg-white hover:border-[#0A1F3F]/20 hover:shadow-sm transition-all duration-200 overflow-hidden group"
                >
                  {/* Stripe */}
                  <div className="h-1 bg-gradient-to-r from-[var(--color-brand-royal)]/60 via-[var(--color-brand-royal)]/30 to-transparent" />

                  <div className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#0F1419] tracking-tight">{item.name}</p>
                        <p className="text-xs text-[#6B6560] mt-0.5">Uploaded: {item.uploaded}</p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${
                          item.status === "Reviewed"
                            ? "bg-[#0A1F3F]/5 text-[#0A1F3F] border border-[#0A1F3F]/10"
                            : item.status === "Received"
                            ? "bg-[var(--color-brand-royal)]/5 text-[var(--color-brand-royal)] border border-[var(--color-brand-royal)]/10"
                            : "bg-[#6B6560]/5 text-[#6B6560] border border-[#6B6560]/10"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-[#6B6560]">
              Wire this to Supabase storage and the matters table to create a live portal with real client uploads.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
