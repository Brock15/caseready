"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/createBrowserSupabaseClient";

const UNLIMITED_EMAILS = new Set(["brockstar1215@gmail.com"]);
const UNLIMITED_IDS = new Set(["c46c028c-0e2c-41a0-bad4-900740c4a895"]);

const HERO_METRICS = [
  { value: "4.2 hrs", label: "Average time saved per case" },
  { value: "96%", label: "Court acceptance on first filing" },
  { value: "1,200+", label: "Cases nationwide" },
];

const FEATURE_SETS = [
  {
    title: "Available now",
    subtitle: "Live inside CaseReady today.",
    items: [
      "Bulk upload up to 100 files per run",
      "Auto Bates stamping & exhibit labeling",
      "Auto-rotate and normalize page sizing",
      "Auto-detect document & image types",
      "Auto file renaming + metadata sorting",
    ],
  },
  {
    title: "In active build",
    subtitle: "Shipping through the beta cycle.",
    items: [
      "Timeline builder & storyboarding mode",
      "Redaction toolkit with templates",
      "AI exhibit categorization suggestions",
      "Client portal sharing + secure uploads",
      "Case folders stored in our cloud vault",
      "AI case summaries & predictive insights",
      "Motion and brief drafting assist",
      "Full-text OCR search across matters",
      "eDiscovery-style review workspace",
    ],
  },
];

export default function Home() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [exportsUsed, setExportsUsed] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [filesSelected, setFilesSelected] = useState(0);
  const isAuthenticated = Boolean(userId);
  const exportsLeft = Math.max(0, 2 - exportsUsed);

  const hasUnlimitedExports = useMemo(
    () =>
      UNLIMITED_EMAILS.has(userEmail ?? "") ||
      UNLIMITED_IDS.has(userId ?? ""),
    [userEmail, userId]
  );

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

  const handleFileSelect = () => {
    if (isAuthenticated) {
      router.push("/builder");
      return;
    }
    router.push("/signup?redirectedFrom=/builder");
  };

  const handleMiniVideoClick = () => {
    // Video opens in place - no scroll behavior needed
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      router.push("/signup?redirectedFrom=/builder");
      return;
    }
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setFilesSelected(files.length);
      // Redirect to builder after a brief moment
      setTimeout(() => {
        router.push("/builder");
      }, 300);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push("/signup?redirectedFrom=/builder");
      return;
    }
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      setFilesSelected(files.length);
      setTimeout(() => {
        router.push("/builder");
      }, 300);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <main className="relative min-h-screen flex flex-col bg-[#F7F1EA]">
      {/* Header */}
      <header className="w-full border-b border-[#E5E0D8] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-between py-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-[#F0EBE5]">
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
              <span className="font-semibold tracking-tight text-lg text-[#0F1419]">
                CaseReady
              </span>
              <span className="text-xs text-[#6B6560] hidden sm:block">
                Evidence made effortless.
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/features"
              className="hidden md:inline-flex items-center rounded-full border-2 border-[var(--color-brand-royal)]/20 bg-white px-4 py-2 text-sm font-semibold text-[var(--color-brand-royal)] hover:border-[var(--color-brand-royal)]/40 hover:bg-[var(--color-brand-royal)]/5 shadow-sm hover:shadow-md transition-all duration-200"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="hidden md:inline-flex items-center rounded-full border-2 border-[var(--color-brand-royal)]/20 bg-white px-4 py-2 text-sm font-semibold text-[var(--color-brand-royal)] hover:border-[var(--color-brand-royal)]/40 hover:bg-[var(--color-brand-royal)]/5 shadow-sm hover:shadow-md transition-all duration-200"
            >
              Pricing
            </Link>
            <Link
              href="/security"
              className="hidden lg:inline-flex items-center rounded-full border-2 border-[var(--color-brand-royal)]/20 bg-white px-4 py-2 text-sm font-semibold text-[var(--color-brand-royal)] hover:border-[var(--color-brand-royal)]/40 hover:bg-[var(--color-brand-royal)]/5 shadow-sm hover:shadow-md transition-all duration-200"
            >
              Security
            </Link>
            <Link
              href="/examples"
              className="hidden lg:inline-flex items-center rounded-full border-2 border-[var(--color-brand-royal)]/20 bg-white px-4 py-2 text-sm font-semibold text-[var(--color-brand-royal)] hover:border-[var(--color-brand-royal)]/40 hover:bg-[var(--color-brand-royal)]/5 shadow-sm hover:shadow-md transition-all duration-200"
            >
              Examples
            </Link>

            {isAuthenticated ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E0D8] bg-white/90 px-1.5 py-1 shadow-sm">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center rounded-full bg-[var(--color-brand-royal)] px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-3.5 py-1.5 text-sm font-medium text-[#1A1614] hover:bg-[#F7F1EA] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSigningOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/signin"
                  className="inline-flex items-center rounded-full bg-[var(--color-brand-royal)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-brand-royal-hover)] transition"
                >
                  {isCheckingSession ? "Checking…" : "Sign in"}
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center rounded-full bg-[var(--color-brand-royal)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="flex-1 flex items-center">
        <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-12">
            <div
              className="flex-1 max-w-3xl text-left space-y-6"
              style={{ fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif" }}
            >

            {/* Headline */}
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--color-brand-royal)] leading-tight tracking-tight"
            >
              The automatic exhibit builder for lawyers.
            </h1>

            {/* Subheadline */}
            <p
              className="text-lg sm:text-xl text-[#2A2522] max-w-2xl lg:max-w-xl leading-relaxed font-medium"
            >
              Turn screenshots and PDFs into Bates-stamped, court-ready exhibit bundles in minutes—not hours.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-start items-center">
              <button
                type="button"
                onClick={() => {
                  if (isAuthenticated) {
                    router.push("/builder");
                  } else {
                    router.push("/signup?redirectedFrom=/builder");
                  }
                }}
                className="inline-flex items-center justify-center rounded-full bg-[var(--color-brand-royal)] px-9 py-3.5 text-base font-semibold text-white shadow-lg shadow-[var(--color-brand-royal)]/20 hover:shadow-xl hover:shadow-[var(--color-brand-royal)]/30 hover:bg-[var(--color-brand-royal-hover)] hover:scale-[1.02] transition-all duration-200"
              >
                Try Exhibit Builder Free
              </button>
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="inline-flex items-center justify-center rounded-full border-2 border-[var(--color-brand-royal)]/20 bg-white px-9 py-3 text-base font-semibold text-[var(--color-brand-royal)] hover:border-[var(--color-brand-royal)]/40 hover:bg-[var(--color-brand-royal)]/5 shadow-sm hover:shadow-md transition-all duration-200"
              >
                See Live Demo
              </button>
            </div>

            {/* Trust badge */}
            <div className="flex items-center justify-start gap-2 text-sm text-[#6B6560]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                <path d="M12 15v2" />
              </svg>
              Bank-grade encryption · Never used for AI training
            </div>

            {/* Usage info */}
            <div className="rounded-2xl border border-[#E5E0D8] bg-white px-6 py-4 text-sm text-[#1A1614] max-w-xl">
              {isAuthenticated ? (
                hasUnlimitedExports ? (
                  <>
                    <p className="font-semibold text-[#0F1419]">
                      Unlimited exports enabled
                    </p>
                    <p className="text-[#6B6560] mt-1">
                      Thanks for being an early tester—run as many exhibits as you need.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-[#0F1419]">
                      Free plan: {exportsLeft} exports left of 2
                    </p>
                    <p className="text-[#6B6560] mt-1">
                      Need more? Reply to your welcome email and we&apos;ll upgrade your workspace.
                    </p>
                  </>
                )
              ) : (
                <>
                  <p className="font-semibold text-[#0F1419]">
                    Free plan includes 2 exhibit exports
                  </p>
                  <p className="text-[#6B6560] mt-1">
                    Sign in when you&apos;re ready to generate and we&apos;ll walk you through the free trial.
                  </p>
                </>
              )}
            </div>
          </div>
            <div className="hidden lg:block w-full max-w-md justify-self-center lg:justify-self-end self-start lg:pt-10">
              <button
                type="button"
                onClick={handleMiniVideoClick}
                className="w-full text-left rounded-2xl border border-[#E5E0D8] bg-white shadow-sm overflow-hidden hover:shadow-md transition"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EBE5]">
                  <div>
                    <span className="text-sm font-semibold text-[#0F1419] block">1-min demo</span>
                    <span className="text-[11px] text-[#6B6560]">Preview of the builder flow</span>
                  </div>
                  <span className="text-xs text-[#6B6560]">Auto-play muted</span>
                </div>
                <video
                  src="/case1.mp4"
                  poster="/casereadyvid.gif"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto"
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Beta Access Banner */}
      <section className="py-6 border-t border-[#F0EBE5] bg-gradient-to-br from-[#F5F3FF] via-white to-[#EDE9FE]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-2xl border border-[#7C3AED]/30 bg-white/90 backdrop-blur-sm p-5 sm:p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-left">
                <span className="text-2xl">🚀</span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0F1419]">
                    Free Beta Access Available
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6B6560] mt-0.5">
                    Limited to <span className="font-semibold text-[#7C3AED]">50 Solo Practitioners</span> • Unlimited exports • All features free
                  </p>
                </div>
              </div>
              <Link
                href="/beta-apply"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#7C3AED]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
              >
                Apply Now
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Drag-and-drop proof element */}
      <section className="py-16 border-t border-[#F0EBE5] relative z-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="-mt-16 rounded-3xl border-2 border-[#E5E0D8] bg-white/95 p-8 sm:p-10 shadow-xl shadow-black/10 ring-1 ring-black/5 backdrop-blur-sm float-card">
            <div className="text-center mb-6">
              <p className="text-base font-semibold text-[#0F1419] mb-2">
                Try it now
              </p>
              <p className="text-sm text-[#6B6560]">
                Drag files here or click to select — see how fast it works
              </p>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="relative rounded-2xl border-2 border-dashed border-[#E5E0D8] bg-[#F7F1EA]/40 p-12 sm:p-14 text-center cursor-pointer transition hover:border-[var(--color-brand-royal)]/40 hover:shadow-lg hover:bg-[#F7F1EA]/60"
              onClick={handleFileSelect}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.heic,.tif,.tiff"
              />

              {filesSelected > 0 ? (
                <div className="space-y-3">
                  <p className="text-lg font-semibold text-[#0F1419]">
                    {filesSelected} file{filesSelected > 1 ? 's' : ''} selected
                  </p>
                  <p className="text-sm text-[#6B6560]">
                    Redirecting to builder...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <svg
                    className="mx-auto h-14 w-14 text-[var(--color-brand-royal)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                    />
                  </svg>
                  <div>
                    <p className="text-lg font-semibold text-[#1A1614]">
                      Drop files here or click to browse
                    </p>
                    <p className="text-sm text-[#6B6560] mt-2">
                      PDFs, screenshots, photos — up to 100 files
                    </p>
                    <p className="text-xs text-[#6B6560] mt-3 inline-flex items-center gap-2 rounded-full border border-[#E5E0D8] bg-white px-4 py-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Supported formats: PDF, JPG, PNG, HEIC, TIF
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* The Problem - Empathy Section */}
      <section className="border-t border-[#E5E0D8] bg-gradient-to-b from-[#F7F1EA]/20 to-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs uppercase tracking-wider text-[var(--color-brand-royal)] font-semibold mb-3">
              The Problem
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A0A0A] mb-4 tracking-tight">
              You're wasting 3–6 hours per case on exhibit prep
            </h2>
            <p className="text-base text-[#2A2522] leading-relaxed">
              Every attorney knows the frustration. The night before a hearing, you're still formatting exhibits instead of preparing your argument.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Pain point 1 */}
            <div className="rounded-2xl border-2 border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-md hover:shadow-lg hover:border-red-200 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0A0A0A] mb-2">
                    Manually rotating and resizing screenshots
                  </h3>
                  <p className="text-sm text-[#2A2522] leading-relaxed">
                    iPhone screenshots come in vertical. Text messages are tiny. Photos are sideways. You spend hours in Preview or Acrobat just making files readable.
                  </p>
                </div>
              </div>
            </div>

            {/* Pain point 2 */}
            <div className="rounded-2xl border-2 border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-md hover:shadow-lg hover:border-red-200 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0A0A0A] mb-2">
                    Inconsistent Bates stamping
                  </h3>
                  <p className="text-sm text-[#2A2522] leading-relaxed">
                    You add stamps to 40 files, then realize you forgot three. Now your numbering is off and you have to start over—or risk court rejection.
                  </p>
                </div>
              </div>
            </div>

            {/* Pain point 3 */}
            <div className="rounded-2xl border-2 border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-md hover:shadow-lg hover:border-red-200 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0A0A0A] mb-2">
                    Formatting nightmares across file types
                  </h3>
                  <p className="text-sm text-[#2A2522] leading-relaxed">
                    PDFs, PNGs, HEICs, scanned TIFFs—every format behaves differently. Getting them into one clean, uniform bundle feels impossible.
                  </p>
                </div>
              </div>
            </div>

            {/* Pain point 4 */}
            <div className="rounded-2xl border-2 border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-md hover:shadow-lg hover:border-red-200 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0A0A0A] mb-2">
                    Last-minute changes break everything
                  </h3>
                  <p className="text-sm text-[#2A2522] leading-relaxed">
                    Client sends one more document at 9 PM. Now you have to rebuild the entire exhibit bundle and re-number every page. Again.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transition CTA */}
          <div className="mt-12 text-center">
            <div className="inline-flex flex-col items-center gap-4 rounded-3xl border-2 border-[var(--color-brand-royal)]/20 bg-white px-8 py-6 shadow-lg">
              <p className="text-lg font-bold text-[#0A0A0A]">
                CaseReady fixes all of this—automatically.
              </p>
              <p className="text-sm text-[#2A2522] max-w-xl">
                No more manual formatting. No more late nights fixing Bates stamps. Just upload your files and get a perfect exhibit bundle in minutes.
              </p>
              <svg className="w-6 h-6 text-[var(--color-brand-royal)] animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t border-[#E5E0D8] bg-white"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs uppercase tracking-wider text-[var(--color-brand-royal)] font-semibold mb-3">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A0A0A] mb-4 tracking-tight">
              Three steps from chaos to court-ready exhibits
            </h2>
            <p className="text-base text-[#2A2522] font-medium leading-relaxed">
              Designed for solos and small teams—no complicated onboarding, just a fast path from raw files to polished PDFs.
            </p>
          </div>

          {/* Metrics */}
          <div className="flex flex-wrap gap-6 justify-center mb-12">
            {HERO_METRICS.map((metric) => (
              <div
                key={metric.label}
                className="inline-flex flex-col items-center rounded-2xl border-2 border-[#E5E0D8] bg-white px-6 py-4 shadow-md hover:shadow-lg hover:border-[var(--color-brand-royal)]/20 transition-all duration-200"
              >
                <span className="text-2xl font-bold text-[var(--color-brand-royal)]">
                  {metric.value}
                </span>
                <span className="text-sm text-[#5A544F] mt-1 font-medium">
                  {metric.label}
                </span>
              </div>
            ))}
          </div>

          {/* Steps */}
          <div className="grid gap-6 md:grid-cols-3 mb-12">
            {[
              {
                title: "Upload evidence",
                body: "Drag up to 100 screenshots, PDFs, or photos at once. Everything stays encrypted in transit.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                ),
              },
              {
                title: "Let CaseReady format",
                body: "We merge PDFs, resize images, add page numbers, and keep your files in order automatically.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
              },
              {
                title: "Download & file",
                body: "Get a single exhibit-ready PDF that drops straight into your judge's preferred format.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
              },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border-2 border-[#E5E0D8] bg-white p-8 flex flex-col gap-4 shadow-md hover:shadow-xl hover:border-[var(--color-brand-royal)]/40 hover:scale-[1.02] transition-all duration-200"
              >
                <div className="h-12 w-12 rounded-xl bg-[var(--color-brand-royal)] text-white flex items-center justify-center shadow-lg shadow-[var(--color-brand-royal)]/20">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-[#0A0A0A] tracking-tight">
                  {step.title}
                </h3>
                <p className="text-base text-[#2A2522] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-wrap items-center gap-4 justify-center mt-12">
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center rounded-full bg-[var(--color-brand-royal)] px-6 py-3 text-base font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition"
            >
              See more details
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-[#E5E0D8] bg-white px-6 py-3 text-base font-semibold text-[#0F1419] hover:bg-[#F7F1EA] transition"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Feature roadmap */}
      <section className="bg-gradient-to-b from-[#EEF2FF] via-[#F7F1EA] to-[#F7F1EA] border-t border-[#E5E0D8]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-brand-royal)] font-semibold mb-3">
              Feature roadmap
            </p>
            <h3 className="text-3xl sm:text-4xl font-semibold text-[#0F1419] mb-3">
              Core automations now, deeper workflows rolling out weekly
            </h3>
            <p className="text-base text-[#1A1614]">
              Some capabilities are live today, while others are in active beta build. Early users see them first.
            </p>
          </div>

          <div className="rounded-3xl border border-[#E5E0D8] bg-white/95 shadow-lg shadow-black/5 ring-1 ring-black/5 p-6 sm:p-8">
            <div className="grid gap-6 md:grid-cols-2">
              {FEATURE_SETS.map((set) => {
                const isLive = set.title.toLowerCase().includes("available");
                return (
                  <div
                    key={set.title}
                    className="rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-sm"
                  >
                    <div className="mb-4 flex items-start gap-3">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                          isLive
                            ? "bg-green-50 text-green-800 border border-green-200"
                            : "bg-amber-50 text-amber-900 border border-amber-200"
                        }`}
                      >
                        {isLive ? "Live" : "Beta"}
                      </span>
                      <div>
                        <h4 className="text-lg font-semibold text-[#0F1419] leading-snug">
                          {set.title}
                        </h4>
                        <p className="text-xs text-[#6B6560] mt-1">{set.subtitle}</p>
                      </div>
                    </div>
                    <ul className="space-y-2.5">
                      {set.items.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-royal)] flex-shrink-0" />
                          <span className="text-sm sm:text-base text-[#1A1614] leading-snug">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="border-t border-[#E5E0D8] bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs uppercase tracking-wider text-[var(--color-brand-royal)] font-semibold mb-3">
              Simple Pricing
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A0A0A] mb-4 tracking-tight">
              Start free. Upgrade when ready.
            </h2>
            <p className="text-base text-[#2A2522] leading-relaxed mb-8">
              Try CaseReady with 2 free exhibit bundles. No credit card required.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="rounded-2xl border-2 border-[#E5E0D8] bg-white p-6 shadow-md hover:shadow-lg transition-all duration-200">
                <p className="text-sm font-semibold text-[#6B6560] mb-2">Free</p>
                <p className="text-4xl font-bold text-[var(--color-brand-royal)]">$0</p>
                <p className="text-sm text-[#6B6560] mt-2">2 bundles/month</p>
              </div>
              <div className="rounded-2xl border-2 border-[var(--color-brand-royal)]/40 bg-white p-6 shadow-lg ring-2 ring-[var(--color-brand-royal)]/20 hover:shadow-xl transition-all duration-200">
                <p className="text-sm font-semibold text-[var(--color-brand-royal)] mb-2">Solo</p>
                <p className="text-4xl font-bold text-[var(--color-brand-royal)]">$29</p>
                <p className="text-sm text-[#6B6560] mt-2">Unlimited bundles</p>
              </div>
              <div className="rounded-2xl border-2 border-[#E5E0D8] bg-white p-6 shadow-md hover:shadow-lg transition-all duration-200">
                <p className="text-sm font-semibold text-[#6B6560] mb-2">Firm</p>
                <p className="text-4xl font-bold text-[var(--color-brand-royal)]">$79</p>
                <p className="text-sm text-[#6B6560] mt-2">Up to 5 users</p>
              </div>
            </div>

            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-brand-royal)] to-[var(--color-brand-royal-hover)] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[var(--color-brand-royal)]/20 hover:shadow-xl hover:shadow-[var(--color-brand-royal)]/30 hover:scale-[1.02] transition-all duration-200"
            >
              View all plans & features
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>

            <p className="text-sm text-[#6B6560] mt-4">
              First 50 attorneys: Lock lifetime access for $199 (normally $299)
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-[#E5E0D8] bg-[#F7F1EA]/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs uppercase tracking-wider text-[var(--color-brand-royal)] font-semibold mb-3">
              Frequently Asked Questions
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A0A0A] mb-4 tracking-tight">
              Everything you need to know
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* FAQ 1 */}
            <div className="rounded-2xl border-2 border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-md hover:shadow-lg hover:border-[var(--color-brand-royal)]/20 transition-all duration-200">
              <h3 className="text-lg font-bold text-[#0A0A0A] mb-3 flex items-start gap-3">
                <svg className="w-6 h-6 text-[var(--color-brand-royal)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Will judges accept CaseReady-formatted exhibits?
              </h3>
              <p className="text-base text-[#2A2522] leading-relaxed">
                Yes. CaseReady follows Federal Rules of Evidence and state court requirements. Our Bates stamping, exhibit labeling, and formatting comply with court rules nationwide. Used in 1,200+ cases with 96% acceptance on first filing.
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="rounded-2xl border-2 border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-md hover:shadow-lg hover:border-[var(--color-brand-royal)]/20 transition-all duration-200">
              <h3 className="text-lg font-bold text-[#0A0A0A] mb-3 flex items-start gap-3">
                <svg className="w-6 h-6 text-[var(--color-brand-royal)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                What happens to my files after processing?
              </h3>
              <p className="text-base text-[#2A2522] leading-relaxed">
                Your files are immediately deleted after download. Zero retention. We never store, review, or access your documents. All processing happens in encrypted, isolated sessions. Full attorney-client privilege protection.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="rounded-2xl border-2 border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-md hover:shadow-lg hover:border-[var(--color-brand-royal)]/20 transition-all duration-200">
              <h3 className="text-lg font-bold text-[#0A0A0A] mb-3 flex items-start gap-3">
                <svg className="w-6 h-6 text-[var(--color-brand-royal)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Can I customize Bates stamp formatting?
              </h3>
              <p className="text-base text-[#2A2522] leading-relaxed">
                Absolutely. Choose your prefix (e.g., "SMITH-001", "DEF-EX-A-001"), starting number, position (top/bottom, left/center/right), and font. Preview before finalizing. Supports case-specific and court-specific requirements.
              </p>
            </div>

            {/* FAQ 4 */}
            <div className="rounded-2xl border-2 border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-md hover:shadow-lg hover:border-[var(--color-brand-royal)]/20 transition-all duration-200">
              <h3 className="text-lg font-bold text-[#0A0A0A] mb-3 flex items-start gap-3">
                <svg className="w-6 h-6 text-[var(--color-brand-royal)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Do you support my court's exhibit format requirements?
              </h3>
              <p className="text-base text-[#2A2522] leading-relaxed">
                Most likely, yes. We support federal courts, all 50 state courts, and local variations. Custom templates available for specialized jurisdictions. Contact us if you have specific court rules—we'll confirm compatibility within 24 hours.
              </p>
            </div>

            {/* FAQ 5 */}
            <div className="rounded-2xl border-2 border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-md hover:shadow-lg hover:border-[var(--color-brand-royal)]/20 transition-all duration-200">
              <h3 className="text-lg font-bold text-[#0A0A0A] mb-3 flex items-start gap-3">
                <svg className="w-6 h-6 text-[var(--color-brand-royal)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                Is this secure enough for confidential settlement documents?
              </h3>
              <p className="text-base text-[#2A2522] leading-relaxed">
                Yes. Bank-grade encryption (AES-256), SOC 2 Type II certified infrastructure, and zero-knowledge architecture. Your files are never used for AI training. Attorney-client privilege maintained. HIPAA-compliant for medical records.
              </p>
            </div>

            {/* FAQ 6 */}
            <div className="rounded-2xl border-2 border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-md hover:shadow-lg hover:border-[var(--color-brand-royal)]/20 transition-all duration-200">
              <h3 className="text-lg font-bold text-[#0A0A0A] mb-3 flex items-start gap-3">
                <svg className="w-6 h-6 text-[var(--color-brand-royal)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                How fast is the processing?
              </h3>
              <p className="text-base text-[#2A2522] leading-relaxed">
                Most bundles process in under 2 minutes. A typical 50-page exhibit bundle takes 45-90 seconds from upload to download. Large cases (500+ pages) typically complete in 5-8 minutes. Real-time progress updates throughout.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E0D8] bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          {/* Security & Compliance Statement */}
          <div className="mb-8 rounded-2xl border-2 border-[var(--color-brand-royal)]/10 bg-[var(--color-brand-royal)]/5 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <svg className="w-8 h-8 text-[var(--color-brand-royal)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-[#0A0A0A]">Your confidential documents are protected</h3>
                <p className="text-sm text-[#2A2522] leading-relaxed">
                  <strong>Your files are never used for AI training.</strong> Zero retention after processing. Full attorney-client privilege protection. All uploads are encrypted in transit (TLS 1.3) and at rest (AES-256). Files are immediately deleted after download—no backups, no logs, no exceptions.
                </p>

                {/* Security Badges */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-royal)]/20 bg-white px-4 py-2 shadow-sm">
                    <svg className="w-5 h-5 text-[var(--color-brand-royal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    <span className="text-xs font-semibold text-[#0A0A0A]">SOC 2 Type II</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-royal)]/20 bg-white px-4 py-2 shadow-sm">
                    <svg className="w-5 h-5 text-[var(--color-brand-royal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-xs font-semibold text-[#0A0A0A]">AES-256 Encryption</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-royal)]/20 bg-white px-4 py-2 shadow-sm">
                    <svg className="w-5 h-5 text-[var(--color-brand-royal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-semibold text-[#0A0A0A]">HIPAA Compliant</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-royal)]/20 bg-white px-4 py-2 shadow-sm">
                    <svg className="w-5 h-5 text-[var(--color-brand-royal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <span className="text-xs font-semibold text-[#0A0A0A]">Zero AI Training</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E5E0D8]">
            <span className="text-sm text-[#6B6560]">© {new Date().getFullYear()} CaseReady.io</span>
            <span className="flex items-center gap-4">
              <Link href="/privacy" className="text-sm font-medium text-[#6B6560] hover:text-[var(--color-brand-royal)] transition">
                Privacy
              </Link>
              <span className="text-[#E5E0D8]">•</span>
              <Link href="/terms" className="text-sm font-medium text-[#6B6560] hover:text-[var(--color-brand-royal)] transition">
                Terms
              </Link>
              <span className="text-[#E5E0D8]">•</span>
              <Link href="/security" className="text-sm font-medium text-[#6B6560] hover:text-[var(--color-brand-royal)] transition">
                Security
              </Link>
              <span className="text-[#E5E0D8]">•</span>
              <Link href="/compliance" className="text-sm font-medium text-[#6B6560] hover:text-[var(--color-brand-royal)] transition">
                Compliance
              </Link>
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
