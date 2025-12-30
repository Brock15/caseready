"use client";

import Link from "next/link";
import { useState, useEffect, DragEvent, ChangeEvent } from "react";
import { PDFDocument, rgb } from "pdf-lib";

type OptionsState = {
  redactEmails: boolean;
  redactPhones: boolean;
  redactSSN: boolean;
  redactAddresses: boolean;
  redactNames: boolean;
  customPattern: string;
};

const defaultOptions: OptionsState = {
  redactEmails: true,
  redactPhones: true,
  redactSSN: true,
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

    try {
      // Dynamically import PDF.js to avoid SSR issues with DOMMatrix
      const pdfjsLib = await import("pdfjs-dist");

      // Set up worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      // Load the PDF with both libraries
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      // Load with PDF.js for text extraction
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfJsDoc = await loadingTask.promise;

      // Build regex patterns based on selected options
      const patterns: RegExp[] = [];

      if (options.redactEmails) {
        patterns.push(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
      }

      if (options.redactPhones) {
        patterns.push(/\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g);
        patterns.push(/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g);
      }

      if (options.redactSSN) {
        // Match SSN formats: 123-45-6789, 123 45 6789, or 123456789
        patterns.push(/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g);
      }

      if (options.redactAddresses) {
        patterns.push(/\b\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct)\b/gi);
      }

      if (options.redactNames) {
        patterns.push(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g);
      }

      if (options.customPattern && options.customPattern.trim()) {
        try {
          patterns.push(new RegExp(options.customPattern, "gi"));
        } catch (regexErr) {
          console.warn("Invalid custom regex pattern", regexErr);
        }
      }

      // Collect redaction areas per page
      const redactionsByPage: Map<number, Array<{x: number, y: number, width: number, height: number}>> = new Map();

      // Process each page to find matches
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const page = pages[pageIndex];
        const { height } = page.getSize();
        const pageRedactions: Array<{x: number, y: number, width: number, height: number}> = [];

        try {
          // Extract text content using PDF.js
          const pdfJsPage = await pdfJsDoc.getPage(pageIndex + 1);
          const textContent = await pdfJsPage.getTextContent();

          // Process each text item and find matches
          textContent.items.forEach((item: any) => {
            const text = item.str;
            if (!text) return;

            // Check each pattern against this text item
            patterns.forEach((pattern) => {
              // Reset pattern lastIndex for global regex
              pattern.lastIndex = 0;

              // Check if entire text item matches
              const matches = text.match(pattern);
              if (matches && matches.length > 0) {
                // This text item contains a match - redact it
                const transform = item.transform;

                // Extract position from transform matrix
                const x = transform[4];
                const y = transform[5];
                const textWidth = item.width;
                const textHeight = item.height || 12;

                // Both PDF.js and pdf-lib use bottom-left origin
                // Y coordinate from PDF.js is already correct for pdf-lib
                pageRedactions.push({
                  x: x - 1, // Small padding
                  y: y - 1,
                  width: textWidth + 2,
                  height: textHeight + 3,
                });
              }
            });
          });

          redactionsByPage.set(pageIndex, pageRedactions);
        } catch (pageErr) {
          console.warn(`Error processing page ${pageIndex + 1}`, pageErr);
        }
      }

      // Draw all redactions
      redactionsByPage.forEach((redactions, pageIndex) => {
        const page = pages[pageIndex];
        redactions.forEach(rect => {
          page.drawRectangle({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            color: rgb(0, 0, 0),
          });
        });
      });

      // Save the redacted PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
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

  const DISABLED = false;

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
              className="inline-flex items-center rounded-full bg-gradient-to-r bg-[#0056D6] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
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
    <main className="min-h-screen bg-[#F5F2ED]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-2 border-b border-[#E5E0D8]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-brand-royal)] font-semibold">
              Stealth Redaction
            </p>
            <h1 className="text-3xl font-semibold text-[#0F1419] tracking-tight mt-2">
              Secure client-side PDF redaction
            </h1>
            <p className="text-sm text-[#6B6560] mt-2 max-w-2xl">
              Remove sensitive information from legal documents. All processing happens in your browser—nothing is stored or sent to our servers.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-xs font-semibold text-[#1A1614] hover:bg-[#F5F2ED] transition"
            >
              ← Dashboard
            </Link>
          </div>
        </header>

        {/* Main upload card */}
        <section className="rounded-3xl border border-[#E5E0D8] bg-white p-8 shadow-sm space-y-6">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}
          {status && !error && (
            <div className="rounded-2xl border border-[var(--color-brand-royal)]/20 bg-[var(--color-brand-royal)]/5 text-[#0A1F3F] px-4 py-3 text-sm font-medium">
              {status}
            </div>
          )}

          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-all ${
              isDragging ? "border-[var(--color-brand-royal)] bg-[var(--color-brand-royal)]/5" : "border-[#E5E0D8] bg-[#F5F2ED]/50"
            }`}
          >
            <p className="text-sm font-semibold text-[#0F1419]">
              Drag & drop a PDF or click to upload
            </p>
            <p className="text-xs text-[#6B6560] mt-1">Single PDF up to ~20MB</p>
            <div className="mt-4">
              <label className="inline-flex cursor-pointer items-center rounded-full bg-[var(--color-brand-royal)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-brand-royal-hover)] transition">
                Choose PDF
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFilePicker}
                />
              </label>
            </div>
            <p className="mt-3 text-[11px] text-[#6B6560]">
              Your files are processed securely and are not stored on our servers.
            </p>
            {file && (
              <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-[#E5E0D8] bg-white px-4 py-2 text-sm text-[#0F1419] shadow-sm">
                <span className="font-semibold">{file.name}</span>
                <span className="text-xs text-[#6B6560]">{formatBytes(file.size)}</span>
                {pageCount !== null && (
                  <span className="text-xs text-[#6B6560]">{pageCount} pages</span>
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
              label="Social Security Numbers"
              description="Hide SSN in various formats"
              checked={options.redactSSN}
              onChange={() => toggleOption("redactSSN")}
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
            <label className="text-sm font-semibold text-[#0F1419]">
              Custom regex (advanced)
            </label>
            <input
              type="text"
              placeholder="e.g. \\bCONFIDENTIAL\\b"
              value={options.customPattern}
              onChange={(event) =>
                setOptions((prev) => ({ ...prev, customPattern: event.target.value }))
              }
              className="w-full rounded-2xl border border-[#E5E0D8] bg-white px-4 py-2.5 text-sm text-[#0F1419] focus:border-[var(--color-brand-royal)] focus:outline-none"
            />
            <p className="text-[11px] text-[#6B6560]">
              Regex is applied on normalized line text (lowercase). Leave blank to skip.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!file || isLoading}
              className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition ${
                !file || isLoading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[var(--color-brand-royal)] hover:bg-[var(--color-brand-royal-hover)]"
              }`}
            >
              {isLoading ? "Redacting…" : "Redact PDF"}
            </button>
            {downloadUrl && (
              <a
                href={downloadUrl}
                download="redacted.pdf"
                className="inline-flex items-center justify-center rounded-full border border-[#E5E0D8] bg-white px-6 py-3 text-sm font-semibold text-[#0F1419] shadow-sm hover:bg-[#F5F2ED] transition"
              >
                Download redacted PDF
              </a>
            )}
          </div>

          <div className="rounded-2xl border border-[#E5E0D8] bg-[#F5F2ED]/50 px-4 py-3 text-xs text-[#6B6560]">
            <p className="font-semibold text-[#0F1419]">How it works</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>All processing happens in your browser using PDF.js and pdf-lib</li>
              <li>Text is extracted and matched against regex patterns you select</li>
              <li>Black rectangles are drawn over matches to permanently redact content</li>
              <li>Your original file never leaves your computer—completely private and secure</li>
            </ul>
          </div>
        </section>
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
    <label className="flex items-start gap-3 rounded-2xl border border-[#E5E0D8] bg-[#F5F2ED]/50 px-4 py-3 text-sm text-[#0F1419] shadow-sm cursor-pointer hover:border-[var(--color-brand-royal)]/30 transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 rounded border-[#E5E0D8] text-[var(--color-brand-royal)] focus:ring-[var(--color-brand-royal)]"
      />
      <span>
        <span className="font-semibold">{label}</span>
        <p className="text-xs text-[#6B6560]">{description}</p>
      </span>
    </label>
  );
}
