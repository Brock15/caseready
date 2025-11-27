"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#111827]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#0056D6] font-semibold">
              Privacy
            </p>
            <h1 className="text-3xl font-semibold mt-2">Privacy Policy</h1>
            <p className="text-sm text-gray-600 mt-1">
              How we handle your data at CaseReady.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            ← Back to home
          </Link>
        </header>

        <div className="space-y-6 text-sm leading-6 text-gray-800">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Data We Collect</h2>
            <p>Email, authentication details, and files you upload to generate exhibits. We do not ingest your files for training.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">How We Use Data</h2>
            <p>To provide the service, generate your exhibits, and maintain security. We do not sell your data.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Storage & Security</h2>
            <p>Files reside in your Supabase storage bucket with TLS in transit. See our <Link href="/security" className="text-[#0056D6] font-semibold hover:underline">Security</Link> page for details.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Your Choices</h2>
            <p>Delete matters to remove metadata; delete storage objects to remove PDFs. Contact us to close your account.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Contact</h2>
            <p>Questions? Email hello@caseready.io</p>
          </section>
        </div>
      </div>
    </main>
  );
}
