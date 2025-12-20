"use client";

import Link from "next/link";

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#0F172A]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 space-y-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-brand-royal)] font-semibold">
              Security
            </p>
            <h1 className="text-3xl font-semibold mt-2">Built for attorneys who need client-safe workflows</h1>
            <p className="text-sm text-gray-600 mt-1 max-w-2xl">
              Encryption everywhere, strict access controls, and clear data handling so you can brief judges and clients with confidence.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-full bg-[var(--color-brand-royal)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-brand-royal-hover)] transition"
            >
              View plans
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back home
            </Link>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[#0B1F4F]">Encryption & storage</h2>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• TLS 1.2+ for all traffic; HSTS enforced.</li>
              <li>• Files live in your Supabase project storage with AES-256 at rest (per Supabase-managed storage).</li>
              <li>• Signed URLs for downloads from private buckets; links expire automatically.</li>
              <li>• Secrets isolated via environment variables; no keys in client code.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-50">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[#0B1F4F]">Access control & identity</h2>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• Supabase Auth sessions with per-user tokens; MFA supported through your identity provider.</li>
              <li>• Row Level Security on the `matters` table keeps exhibits scoped to the owner (and explicit shares if enabled).</li>
              <li>• Least-privilege service access; no anonymous write paths to storage.</li>
              <li>• Audit-friendly metadata: uploads tied to user IDs and timestamps.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[#0B1F4F]">Processing guarantees</h2>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• Exhibit generation runs in-memory; outputs stream back to you.</li>
              <li>• No model training or secondary use of your files, ever.</li>
              <li>• Logs exclude document contents; only operational events are captured.</li>
              <li>• PDF/image cleanup avoids external processors beyond sharp/pdf-lib.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[#0B1F4F]">Data retention & deletion</h2>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• You own your data: delete matters to remove metadata; delete files from storage to remove PDFs.</li>
              <li>• Time-limited session tokens; revoke sessions on sign-out.</li>
              <li>• Backups are handled by your Supabase project policies; no hidden copies in CaseReady.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[#0B1F4F]">Operational safeguards</h2>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• Environment isolation (dev vs prod credentials, separate storage buckets).</li>
              <li>• Error monitoring without payload data; PII minimized in logs.</li>
              <li>• Principle of least privilege for internal tooling and access.</li>
              <li>• Incident playbook with notification to impacted users if a material issue occurs.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[#0B1F4F]">Guidance for legal teams</h2>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• Validate exports before filing; ensure page ranges and Bates numbers meet local rules.</li>
              <li>• Apply redactions prior to sharing; beta redaction tools are client-side only.</li>
              <li>• Avoid uploading privileged material you cannot store in your own cloud bucket.</li>
              <li>• Need a DPA? Reach out and we’ll provide one aligned to your jurisdiction.</li>
            </ul>
          </section>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm text-sm text-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#0B1F4F]">Questions or review requests?</h2>
          </div>
          <p className="mt-2">
            We're happy to walk your firm through our controls and help you configure private buckets, signed URLs, and access policies for your team.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="mailto:hello@caseready.io?subject=Security%20review%20request"
              className="inline-flex items-center rounded-full bg-[var(--color-brand-royal)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-brand-royal-hover)] transition"
            >
              Email us
            </Link>
            <Link
              href="/features#roadmap"
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              See roadmap
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
