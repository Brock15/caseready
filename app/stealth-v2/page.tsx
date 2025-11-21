"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/createBrowserSupabaseClient";

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];

export default function StealthPageV2() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("Sensitive names, addresses, account numbers");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0];
    if (!next) return;
    if (!ACCEPTED_TYPES.includes(next.type)) {
      setStatus("Unsupported file type. Upload a PDF or image.");
      return;
    }
    setFile(next);
    setStatus(null);
  };

  const handleSubmit = async () => {
    if (!file || !prompt.trim() || isProcessing) {
      setStatus("Upload a file and describe what to redact.");
      return;
    }
    try {
      setIsProcessing(true);
      setStatus("Analyzing document with Stealth Mode …");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prompt", prompt);
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        formData.append("token", data.session.access_token);
      }
      const res = await fetch("/api/redact", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        setStatus("Could not build redacted PDF. Try again.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.name.replace(/\.pdf$/i, "") + "_redacted.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("Redacted PDF downloaded.");
    } catch (error) {
      console.error(error);
      setStatus("Unexpected error. Try again soon.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F5F1] text-[#111827]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-[#0056D6] font-semibold">
              Stealth mode v2
            </p>
            <h1 className="text-3xl font-semibold">AI-powered redactions without leaving CaseReady.</h1>
            <p className="text-sm text-gray-500 max-w-2xl">
              Describe what must be removed, drop in a PDF or image, and Stealth Mode prepares a judge-ready redacted packet.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            ← Back to dashboard
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="surface-card rounded-3xl border border-white/70 p-6 space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              What should be redacted?
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-[#0056D6] focus:outline-none"
                placeholder="Names, social security numbers, account numbers, medical details …"
              />
            </label>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Upload PDF or image</label>
              <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-white/80 px-6 py-10 text-center text-sm text-gray-500 hover:border-[#0056D6] cursor-pointer">
                <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" />
                {file ? (
                  <>
                    <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">⬆️</span>
                    <p>Drag & drop or click to upload.</p>
                    <p className="text-xs text-gray-400">PDF, PNG, JPG up to 15MB.</p>
                  </>
                )}
              </label>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!file || isProcessing}
              className={`w-full rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm ${
                !file || isProcessing
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#3FA9FF] to-[#0056D6] hover:brightness-110"
              }`}
            >
              {isProcessing ? "Redacting…" : "Run Stealth Mode"}
            </button>

            {status && <p className="text-xs text-gray-500">{status}</p>}
          </div>

          <div className="surface-card rounded-3xl border border-white/70 p-6 space-y-4 text-sm text-gray-600">
            <h2 className="text-lg font-semibold text-gray-900">How it works</h2>
            <ol className="list-decimal pl-4 space-y-2">
              <li>Describe the categories (names, dates of birth, addresses, etc.).</li>
              <li>Drop in your PDF or images—Stealth Mode scans every page.</li>
              <li>We return a redacted PDF you can file immediately.</li>
            </ol>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
              Today’s preview uses on-device heuristics. Full semantic AI redaction ships later this beta.
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl border border-gray-100 bg-white px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-[#0056D6] font-semibold">Security</p>
                <p>Processing stays in memory, nothing stored.</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-[#0056D6] font-semibold">Logs</p>
                <p>We keep audit trails so you can show judges exactly what ran.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
