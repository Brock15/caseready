"use client";

import Link from "next/link";
import { useState, useEffect, DragEvent, ChangeEvent } from "react";
import { PDFDocument } from "pdf-lib";

type OptionsState = {
  redactEmails: boolean;
  redactPhones: boolean;
  redactAddresses: boolean;
  redactNames: boolean;
  customPattern: string;
};

const defaultOptions: OptionsState = {
  redactEmails: true,
  redactPhones: true,
  redactAddresses: false,
  redactNames: false,
  customPattern: "",
};

const formatBytes = (bytes: number) => {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

export default function RedactPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [options, setOptions] = useState<OptionsState>(defaultOptions);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const loadPageCount = async (nextFile: File) => {
    try {
      const buffer = await nextFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer);
      setPageCount(pdfDoc.getPageCount());
    } catch (err) {
      console.warn("Unable to read page count", err);
      setPageCount(null);
    }
  };

  const handleFile = (incoming: File | null) => {
    if (!incoming) return;
    if (incoming.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    setError(null);
    setFile(incoming);
    setStatus(null);
    setDownloadUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPageCount(null);
    loadPageCount(incoming);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const incoming = event.dataTransfer?.files?.[0];
    handleFile(incoming || null);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleFilePicker = (event: ChangeEvent<HTMLInputElement>) => {
    const incoming = event.target.files?.[0] ?? null;
    handleFile(incoming);
    event.target.value = "";
  };

  const toggleOption = (key: keyof OptionsState) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Select a PDF to redact.");
      return;
    }
    setError(null);
    setStatus("Processing redaction…");
    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("options", JSON.stringify(options));

    try {
      const res = await fetch("/api/redact", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Redaction failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStatus("Redaction complete. Download your file below.");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const DISABLED = true;

  if (DISABLED) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">
            Preview — Under Development
          </span>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Stealth redaction is coming soon</h1>
          <p className="mt-2 text-sm text-slate-600">
            This feature is under development. The Exhibit Builder is fully operational.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-[#3FA9FF] to-[#0056D6] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
            >
              Go to Exhibit Builder
            </Link>
            <Link
              href="mailto:hello@caseready.io?subject=Redaction%20early%20access"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Request early access
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Need a redaction now? Email us and we&apos;ll process it for you.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="text-center mb-8">
          <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">
            Stealth Mode • PDF Redaction
          </span>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            Redact sensitive details in seconds
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Upload a PDF, choose what to hide, and download the redacted version securely.
          </p>
        </div>

        <div className="rounded-3xl bg-white shadow-xl border border-slate-100 p-6 sm:p-8 space-y-6">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}
          {status && !error && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 text-blue-800 px-4 py-3 text-sm">
              {status}
            </div>
          )}

          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`rounded-2xl border-2 border-dashed px-5 py-8 text-center transition ${
              isDragging ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50"
            }`}
          >
            <p className="text-sm font-semibold text-slate-800">
              Drag & drop a PDF or click to upload
            </p>
            <p className="text-xs text-slate-500 mt-1">Single PDF up to ~20MB</p>
            <div className="mt-4">
              <label className="inline-flex cursor-pointer items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110">
                Choose PDF
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFilePicker}
                />
              </label>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Your files are processed securely and are not stored on our servers.
            </p>
            {file && (
              <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
                <span className="font-semibold">{file.name}</span>
                <span className="text-xs text-slate-500">{formatBytes(file.size)}</span>
                {pageCount !== null && (
                  <span className="text-xs text-slate-500">{pageCount} pages</span>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <OptionRow
              label="Emails"
              description="Hide email addresses"
              checked={options.redactEmails}
              onChange={() => toggleOption("redactEmails")}
            />
            <OptionRow
              label="Phone numbers"
              description="Hide phone and fax numbers"
              checked={options.redactPhones}
              onChange={() => toggleOption("redactPhones")}
            />
            <OptionRow
              label="Street addresses"
              description="Hide common street address patterns"
              checked={options.redactAddresses}
              onChange={() => toggleOption("redactAddresses")}
            />
            <OptionRow
              label="Names (basic)"
              description="Hide simple first/last name formats"
              checked={options.redactNames}
              onChange={() => toggleOption("redactNames")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800">
              Custom regex (advanced)
            </label>
            <input
              type="text"
              placeholder="e.g. \\bCONFIDENTIAL\\b"
              value={options.customPattern}
              onChange={(event) =>
                setOptions((prev) => ({ ...prev, customPattern: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Regex is applied on normalized line text (lowercase). Leave blank to skip.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!file || isLoading}
              className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow ${
                !file || isLoading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:brightness-110"
              }`}
            >
              {isLoading ? "Redacting…" : "Redact PDF"}
            </button>
            {downloadUrl && (
              <a
                href={downloadUrl}
                download="redacted.pdf"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
              >
                Download redacted PDF
              </a>
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Notes & tuning</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Regex patterns live in <code>lib/redaction/redactPdf.ts</code>.</li>
              <li>Redactions cover entire matching lines; swap detection to plug in OCR/PII later.</li>
              <li>Rectangles are opaque black; adjust color or padding in <code>redactPdf</code>.</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

type OptionRowProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
};

function OptionRow({ label, description, checked, onChange }: OptionRowProps) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 shadow-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
      <span>
        <span className="font-semibold">{label}</span>
        <p className="text-xs text-slate-500">{description}</p>
      </span>
    </label>
  );
}
