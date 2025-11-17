"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useRef,
  useState,
  ChangeEvent,
  useEffect,
  useMemo,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/createBrowserSupabaseClient";

type SelectedFile = {
  id: string;
  file: File;
};

export default function Home() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [exportsUsed, setExportsUsed] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const isAuthenticated = Boolean(userId);
  const exportsLeft = Math.max(0, 2 - exportsUsed);

  useEffect(() => {
    let active = true;

    const applyUserState = (user: User | null) => {
      setUserEmail(user?.email ?? null);
      setUserId(user?.id ?? null);
      const nextExports =
        user?.user_metadata?.exportsUsed !== undefined
          ? Number(user.user_metadata.exportsUsed)
          : 0;
      setExportsUsed(Number.isFinite(nextExports) ? nextExports : 0);
    };

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      applyUserState(data.session?.user ?? null);
      setIsCheckingSession(false);
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!active) return;
      applyUserState(currentSession?.user ?? null);
      setIsCheckingSession(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
      router.replace("/signin");
    } catch (error) {
      console.error("Failed to sign out", error);
    } finally {
      setIsSigningOut(false);
    }
  };

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

    if (!isAuthenticated) {
      setServerMessage("Sign in to use your two free exports.");
      router.push("/signin?redirectedFrom=/");
      return;
    }

    if (exportsLeft <= 0) {
      setServerMessage(
        "You have used both free exports. Upgrade your plan to continue."
      );
      return;
    }

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

        const { data } = await supabase.auth.getUser();
        if (data.user) {
          const refreshedExports =
            data.user.user_metadata?.exportsUsed !== undefined
              ? Number(data.user.user_metadata.exportsUsed)
              : 0;
          setExportsUsed(
            Number.isFinite(refreshedExports) ? refreshedExports : 0
          );
        }
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
            <div className="h-12 w-12 rounded-2xl bg-white shadow-md flex items-center justify-center border border-gray-100">
              <NextImage
                src="/logo.svg"
                alt="CaseReady logo"
                width={48}
                height={48}
                className="h-10 w-10"
                priority
              />
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              document
                .getElementById("how-it-works")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            How it works
          </button>

          <Link
            href="/pricing"
            className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Pricing
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs text-gray-500">
                  {userEmail || "Account"}
                </span>
                <span className="text-[10px] text-gray-400">ID: {userId}</span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className={`inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 ${
                  isSigningOut ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/signin"
                className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                {isCheckingSession ? "Checking..." : "Sign in"}
              </Link>
              <Link
                href="/signup"
                className="hidden sm:inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Early access
              </Link>
            </>
          )}
        </div>
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

              <div className="rounded-xl border border-blue-100 bg-white/70 px-4 py-3 text-xs text-gray-600 mb-4">
                {isAuthenticated ? (
                  <>
                    <p className="font-semibold text-gray-900">
                      Free plan: {exportsLeft} exports left of 2
                    </p>
                    <p>
                      Need more? Reply to your welcome email and we&apos;ll
                      upgrade your workspace.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-900">
                      Free plan includes 2 exhibit exports.
                    </p>
                    <p>
                      Sign in when you&apos;re ready to generate and we&apos;ll
                      walk you through the free trial.
                    </p>
                  </>
                )}
              </div>

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
                      disabled={
                        !files.length ||
                        isSubmitting ||
                        (isAuthenticated && exportsLeft <= 0)
                      }
                      className={`inline-flex justify-center items-center rounded-full border px-5 py-2.5 text-sm font-medium transition ${
                        files.length &&
                        !isSubmitting &&
                        (!isAuthenticated || exportsLeft > 0)
                          ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {isSubmitting
                        ? "Processing..."
                        : isAuthenticated && exportsLeft <= 0
                        ? "Upgrade for more exports"
                        : "Generate Exhibit PDF"}
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

            </aside>
          </div>
        </div>
      </div>

      <section
        id="how-it-works"
        className="bg-white border-t border-black/5 scroll-mt-24"
      >
        <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-12 sm:py-16 space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-[#0056D6] font-semibold">
              How it works
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-2">
              Three quick steps from inbox chaos to court-ready exhibits.
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-3">
              Designed for solos and small teams—no complicated onboarding, just
              a fast path from raw files to polished PDFs.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            {[
              {
                title: "Upload evidence",
                body: "Drag up to 100 screenshots, PDFs, or photos at once. Everything stays encrypted in transit.",
              },
              {
                title: "Let CaseReady format",
                body: "We merge PDFs, resize images, add page numbers, and keep your files in order automatically.",
              },
              {
                title: "Download & file",
                body: "Get a single exhibit-ready PDF that drops straight into your judge’s preferred format.",
              },
            ].map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-gray-200 bg-gray-50/70 p-6 flex flex-col gap-3 shadow-sm"
              >
                <span className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#3FA9FF] to-[#0056D6] text-white font-semibold text-lg flex items-center justify-center">
                  {index + 1}
                </span>
                <h3 className="text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0056D6] text-white">
        <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-10 sm:py-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-blue-100 font-semibold">
              Pricing
            </p>
            <h3 className="text-2xl font-semibold mt-2">
              First 10 firms lock $29/mo forever.
            </h3>
            <p className="text-sm text-blue-100 mt-2 max-w-xl">
              Start free with two exports, then upgrade when your caseload calls
              for unlimited matters and priority access.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 text-sm font-medium">
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-blue-100">
                Free
              </p>
              <p className="text-xl font-semibold">$0</p>
              <p className="text-xs text-blue-100">2 exports included</p>
            </div>
            <div className="rounded-2xl bg-white text-[#0056D6] px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-[#0056D6]/70">
                Launch offer
              </p>
              <p className="text-xl font-semibold">$19</p>
              <p className="text-xs text-[#0056D6]/70">Unlimited matters</p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full bg-white text-[#0056D6] px-5 py-2.5 font-semibold hover:bg-blue-50 transition"
            >
              View plans
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/5 bg-white/60">
        <div className="mx-auto max-w-5xl flex items-center justify-between py-3 px-4 sm:px-6 text-[11px] text-gray-500">
          <span>© {new Date().getFullYear()} CaseReady.io</span>
          <span>Privacy • Terms</span>
        </div>
      </footer>
    </main>
  );
}
