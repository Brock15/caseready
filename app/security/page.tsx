"use client";

import Link from "next/link";

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#111827]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#0056D6] font-semibold">
              Security
            </p>
            <h1 className="text-3xl font-semibold mt-2">How CaseReady protects your data</h1>
            <p className="text-sm text-gray-600 mt-1">
              Encryption, access controls, and operational safeguards for legal workflows.
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
            <h2 className="text-lg font-semibold">Encryption</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Transport: All data in transit is protected with TLS.</li>
              <li>Storage: Files are stored in your designated Supabase storage bucket. Access is controlled via auth/ACLs.</li>
              <li>Optional signed URLs: Downloads use time-limited signed URLs when buckets are private.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Processing & Isolation</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Exhibit processing runs in-memory; no training on your data.</li>
              <li>Uploads are tied to your authenticated account; RLS limits matter access to owners (and explicit shares if enabled).</li>
              <li>Logs exclude document contents; only operational metadata is retained.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Access Controls</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Auth: Supabase authentication with per-user session tokens.</li>
              <li>RLS: Row Level Security restricts matters to the owning user (and shared users if sharing is configured).</li>
              <li>Least privilege: Only authenticated users can upload, download, or delete their exhibits.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Data Retention</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You control your files. Delete matters to remove their metadata; delete storage objects to remove PDFs.</li>
              <li>No secondary use: Files are never used for AI training.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Operational Practices</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Monitoring and alerts on errors; no client content is stored in logs.</li>
              <li>Separation of environments (dev vs. prod credentials).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Your Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Review all outputs for accuracy and compliance with court rules.</li>
              <li>Ensure you have rights to upload and process any content.</li>
              <li>Use proper redactions before filing sensitive materials.</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
