"use client";

import { useRef, useState, ChangeEvent } from "react";

type SelectedFile = {
  id: string;
  file: File;
};

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const handleSelectFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) return;

    setFiles((prev) => [
      ...prev,
      ...newFiles.map((f) => ({
        id: `${f.name}-${f.lastModified}-${Math.random()
          .toString(36)
          .slice(2)}`,
        file: f,
      })),
    ]);

    // allow selecting the same file again
    e.target.value = "";
  };

  const totalSizeBytes = files.reduce((sum, f) => sum + f.file.size, 0);
  const totalSizeMB = totalSizeBytes / (1024 * 1024);

  const handleGenerate = async () => {
    if (!files.length || isSubmitting) return;

    setIsSubmitting(true);
    setServerMessage(null);

    try {
      const formData = new FormData();
      files.forEach(({ file }) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/generate-exhibit", {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        if (contentType.includes("application/json")) {
          const data = await res.json();
          setServerMessage(data.message || "Something went wrong.");
        } else {
          setServerMessage("Something went wrong generating the PDF.");
        }
        return;
      }

      if (contentType.includes("application/pdf")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "caseready-exhibit.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        setServerMessage("Exhibit PDF generated and downloaded.");
      } else {
        setServerMessage("Unexpected response from server.");
      }
    } catch (err) {
      console.error(err);
      setServerMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#111827] flex flex-col">
      {/* Top bar */}
      <header className="w-full border-b border-black/5 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl flex items-center justify-between py-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Logo placeholder */}
            <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-[#3FA9FF] to-[#0056D6] shadow-md flex items-center justify-center">
              <span className="text-white font-bold text-xl">CR</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold tracking-tight text-lg">
                CaseReady
              </span>
              <span className="text-xs text-gray-500 hidden sm:block">
                Evidence made effortless.
              </span>
            </div>
          </div>

          <button className="hidden sm:inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
            Sign in
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center">
        <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-10 sm:py-16">
          <div className="grid gap-10 md:grid-cols-[1.2fr,1fr] items-start md:items-center">
            {/* Left side */}
            <section>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-4">
                Turn messy evidence into
                <span className="block text-[#0056D6]">
                  judge-ready exhibits.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-xl mb-6">
                Drag, drop, and let CaseReady handle the formatting. Bates
                numbers, exhibits, timelines—done in minutes instead of hours.
              </p>

              {/* Upload card */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 sm:p-8 text-center bg-gray-50/60">
                  <p className="text-sm font-medium text-gray-800 mb-2">
                    Drag & drop evidence files here
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Screenshots, PDFs, emails, photos — up to 100 pages.
                  </p>

                  {/* Hidden input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg,.heic,.tif,.tiff"
                  />

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      type="button"
                      onClick={handleSelectFiles}
                      className="inline-flex justify-center items-center rounded-full bg-gradient-to-r from-[#3FA9FF] to-[#0056D6] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 transition"
                    >
                      Select files
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={!files.length || isSubmitting}
                      className={`inline-flex justify-center items-center rounded-full border px-5 py-2.5 text-sm font-medium transition ${
                        files.length && !isSubmitting
                          ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {isSubmitting ? "Processing..." : "Generate Exhibit PDF"}
                    </button>
                  </div>

                  {/* File summary */}
                  <div className="mt-4 text-left text-xs text-gray-600">
                    {files.length === 0 ? (
                      <p className="text-center text-gray-400">
                        No files selected yet.
                      </p>
                    ) : (
                      <>
                        <p className="mb-1 font-medium">
                          {files.length} file
                          {files.length > 1 ? "s" : ""} selected ·{" "}
                          {totalSizeMB.toFixed(2)} MB total
                        </p>
                        <ul className="max-h-32 overflow-auto space-y-1 text-[11px]">
                          {files.map(({ id, file }) => (
                            <li
                              key={id}
                              className="flex justify-between gap-2 border-b border-gray-100 pb-1 last:border-b-0"
                            >
                              <span className="truncate">{file.name}</span>
                              <span className="whitespace-nowrap text-gray-400">
                                {(file.size / 1024).toFixed(0)} KB
                              </span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>

                  {/* Server response */}
                  {serverMessage && (
                    <p className="mt-3 text-[11px] text-gray-500">
                      {serverMessage}
                    </p>
                  )}

                  <p className="mt-3 text-[11px] text-gray-400">
                    End-to-end encrypted in transit. Files are processed
                    securely and never used for training.
                  </p>
                </div>
              </div>
            </section>

            {/* Right side */}
            <aside className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-sm text-gray-700">
                <h2 className="font-semibold text-gray-900 mb-2">
                  Built for busy attorneys.
                </h2>
                <p className="mb-2">
                  CaseReady was designed for solos and small firms drowning in
                  screenshots and PDFs. Save paralegal hours on every matter.
                </p>
                <p className="text-xs text-gray-500">
                  Coming soon: redactions, exhibit presets by jurisdiction, and
                  client upload links.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-[#0056D6] text-white p-5 text-sm shadow-sm">
                <p className="font-semibold mb-1">Launch offer</p>
                <p className="text-xs mb-2">
                  First 10 firms get unlimited matters for $19/mo for life.
                </p>
                <p className="text-[11px] text-blue-100">
                  2 free exports to try it. No credit card required.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <footer className="border-t border-black/5 bg-white/60">
        <div className="mx-auto max-w-5xl flex items-center justify-between py-3 px-4 sm:px-6 text-[11px] text-gray-500">
          <span>© {new Date().getFullYear()} CaseReady.io</span>
          <span>Privacy • Terms</span>
        </div>
      </footer>
    </main>
  );
}



