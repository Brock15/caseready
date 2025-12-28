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
  { value: "22k+", label: "Pages cleaned this month" },
  { value: "45 min", label: "Avg. bundle time saved" },
  { value: "98%", label: "Court-ready formatting score" },
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
    document.getElementById("full-demo")?.scrollIntoView({ behavior: "smooth" });
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
              className="hidden md:inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-semibold text-[#1A1614] hover:bg-[#F7F1EA] transition"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="hidden md:inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-semibold text-[#1A1614] hover:bg-[#F7F1EA] transition"
            >
              Pricing
            </Link>
            <Link
              href="/security"
              className="hidden lg:inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-semibold text-[#1A1614] hover:bg-[#F7F1EA] transition"
            >
              Security
            </Link>
            <Link
              href="/how-it-works"
              className="hidden lg:inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-semibold text-[#1A1614] hover:bg-[#F7F1EA] transition"
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
              className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#0F1419] leading-tight tracking-tight"
            >
              The automatic exhibit builder for lawyers.
            </h1>

            {/* Subheadline */}
            <p
              className="text-lg sm:text-xl text-[#1A1614] max-w-2xl lg:max-w-xl leading-relaxed"
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
                className="inline-flex items-center justify-center rounded-full bg-[var(--color-brand-royal)] px-9 py-3.5 text-base font-semibold text-white shadow-sm hover:shadow-md hover:bg-[var(--color-brand-royal-hover)] transition"
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
                className="inline-flex items-center justify-center rounded-full border border-[#E5E0D8] bg-white px-9 py-3 text-base font-semibold text-[#1A1614] hover:bg-[#F7F1EA] transition"
              >
                Watch workflow →
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

      {/* Drag-and-drop proof element */}
      <section className="py-12 border-t border-[#F0EBE5] relative z-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="-mt-12 rounded-3xl border border-[#E5E0D8] bg-white/95 p-6 sm:p-7 shadow-lg shadow-black/10 ring-1 ring-black/5 backdrop-blur-sm float-card">
            <div className="text-center mb-4">
              <p className="text-sm font-semibold text-[#0F1419] mb-1">
                Try it now
              </p>
              <p className="text-xs text-[#6B6560]">
                Drag files here or click to select — see how fast it works
              </p>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="relative rounded-xl border-2 border-dashed border-[#E5E0D8] bg-[#F7F1EA]/40 p-8 sm:p-9 text-center cursor-pointer transition hover:border-[#D8D2C8] hover:shadow-md"
              onClick={handleFileSelect}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg"
              />

              {filesSelected > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[#0F1419]">
                    {filesSelected} file{filesSelected > 1 ? 's' : ''} selected
                  </p>
                  <p className="text-xs text-[#6B6560]">
                    Redirecting to builder...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <svg
                    className="mx-auto h-10 w-10 text-[#9B948A]"
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
                    <p className="text-sm font-medium text-[#1A1614]">
                      Drop files here or click to browse
                    </p>
                    <p className="text-xs text-[#6B6560] mt-1">
                      PDFs, screenshots, photos — up to 100 files
                    </p>
                  </div>
                </div>
              )}
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
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#0F1419] mb-4">
              Three steps from chaos to court-ready exhibits
            </h2>
            <p className="text-base text-[#1A1614]">
              Designed for solos and small teams—no complicated onboarding, just a fast path from raw files to polished PDFs.
            </p>
          </div>

          {/* Metrics */}
          <div className="flex flex-wrap gap-6 justify-center mb-12">
            {HERO_METRICS.map((metric) => (
              <div
                key={metric.label}
                className="inline-flex flex-col items-center rounded-2xl border border-[#E5E0D8] bg-white px-6 py-4"
              >
                <span className="text-2xl font-semibold text-[#0A1F3F]">
                  {metric.value}
                </span>
                <span className="text-sm text-[#6B6560] mt-1">
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
                className="rounded-2xl border border-[#E5E0D8] bg-white p-8 flex flex-col gap-4 hover:border-[var(--color-brand-royal)] transition"
              >
                <div className="h-12 w-12 rounded-xl bg-[var(--color-brand-royal)] text-white flex items-center justify-center">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#0F1419]">
                  {step.title}
                </h3>
                <p className="text-base text-[#1A1614]">{step.body}</p>
              </div>
            ))}
          </div>

          {/* Video preview */}
          <div id="full-demo" className="rounded-3xl border border-[#E5E0D8] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-semibold text-[#0F1419]">
                Full workflow preview
              </p>
              <span className="rounded-full border border-[#E5E0D8] bg-[#F7F1EA] px-3 py-1 text-xs font-semibold text-[#1A1614]">
                2 min demo
              </span>
            </div>
            <div className="rounded-2xl overflow-hidden border border-[#F0EBE5]">
              <video
                src="/case1.mp4"
                poster="/casereadyvid.gif"
                autoPlay
                loop
                muted
                playsInline
                controls
                className="w-full h-auto"
              />
            </div>
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

      {/* Footer */}
      <footer className="border-t border-[#E5E0D8] bg-white">
        <div className="mx-auto max-w-6xl flex items-center justify-between py-4 px-4 sm:px-6 text-sm text-[#6B6560]">
          <span>© {new Date().getFullYear()} CaseReady.io</span>
          <span className="flex items-center gap-3">
            <Link href="/privacy" className="hover:text-[#0F1419] transition">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-[#0F1419] transition">
              Terms
            </Link>
            <span>•</span>
            <Link href="/security" className="hover:text-[#0F1419] transition">
              Security
            </Link>
          </span>
        </div>
      </footer>
    </main>
  );
}
