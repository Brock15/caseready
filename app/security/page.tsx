"use client";

import Link from "next/link";

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#0F172A]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 space-y-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#0056D6] font-semibold">
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
              className="inline-flex items-center rounded-full bg-[#0056D6] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110"
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
            <h2 className="text-lg font-semibold text-[#0B1F4F]">Encryption & storage</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• TLS 1.2+ for all traffic; HSTS enforced.</li>
              <li>• Files live in your Supabase project storage with AES-256 at rest (per Supabase-managed storage).</li>
              <li>• Signed URLs for downloads from private buckets; links expire automatically.</li>
              <li>• Secrets isolated via environment variables; no keys in client code.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0B1F4F]">Access control & identity</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• Supabase Auth sessions with per-user tokens; MFA supported through your identity provider.</li>
              <li>• Row Level Security on the `matters` table keeps exhibits scoped to the owner (and explicit shares if enabled).</li>
              <li>• Least-privilege service access; no anonymous write paths to storage.</li>
              <li>• Audit-friendly metadata: uploads tied to user IDs and timestamps.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0B1F4F]">Processing guarantees</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• Exhibit generation runs in-memory; outputs stream back to you.</li>
              <li>• No model training or secondary use of your files, ever.</li>
              <li>• Logs exclude document contents; only operational events are captured.</li>
              <li>• PDF/image cleanup avoids external processors beyond sharp/pdf-lib.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0B1F4F]">Data retention & deletion</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• You own your data: delete matters to remove metadata; delete files from storage to remove PDFs.</li>
              <li>• Time-limited session tokens; revoke sessions on sign-out.</li>
              <li>• Backups are handled by your Supabase project policies; no hidden copies in CaseReady.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0B1F4F]">Operational safeguards</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• Environment isolation (dev vs prod credentials, separate storage buckets).</li>
              <li>• Error monitoring without payload data; PII minimized in logs.</li>
              <li>• Principle of least privilege for internal tooling and access.</li>
              <li>• Incident playbook with notification to impacted users if a material issue occurs.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0B1F4F]">Guidance for legal teams</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• Validate exports before filing; ensure page ranges and Bates numbers meet local rules.</li>
              <li>• Apply redactions prior to sharing; beta redaction tools are client-side only.</li>
              <li>• Avoid uploading privileged material you cannot store in your own cloud bucket.</li>
              <li>• Need a DPA? Reach out and we’ll provide one aligned to your jurisdiction.</li>
            </ul>
          </section>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm text-sm text-gray-700">
          <h2 className="text-lg font-semibold text-[#0B1F4F]">Questions or review requests?</h2>
          <p className="mt-2">
            We’re happy to walk your firm through our controls and help you configure private buckets, signed URLs, and access policies for your team.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="mailto:hello@caseready.io?subject=Security%20review%20request"
              className="inline-flex items-center rounded-full bg-[#0056D6] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110"
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
