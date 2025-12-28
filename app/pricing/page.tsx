"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/createBrowserSupabaseClient";

const plansByTier = [
  {
    name: "Free",
    price: "$0",
    duration: "forever",
    badge: "Get started",
    audience: "Solo lawyers & small firms kicking the tires.",
    description:
      "Perfect for trying CaseReady on a couple of matters before you roll it out across the team.",
    perks: [
      "2 exhibit PDFs per month",
      "Up to 10 files per packet",
      "All common formats (PDF, images, screenshots)",
      "No credit card required",
    ],
    cta: { label: "Start for free", href: "/" },
    highlighted: false,
    note: "Best for testing on your next case.",
  },
  {
    name: "Solo",
    price: "$29",
    duration: "per month",
    originalPrice: "$39",
    badge: "Monthly",
    audience: "Solo practitioners who live in their inbox & scanner.",
    description:
      "Unlimited, judge-ready exhibit packets with Bates numbers and labels. Built to replace late-night PDF surgery.",
    perks: [
      "Unlimited exhibit PDFs",
      "Unlimited files per packet",
      "Exhibit labels (Ex. A, Ex. B…) and page stamping",
      "Bates numbering (e.g. CR-0001, 0002…)",
      "Higher-priority processing queue",
    ],
    cta: {
      label: "Start monthly",
      priceId: "price_1SfvgEAVvDE7fh9qEOJgP2kU",
    },
    highlighted: false,
    note: "Monthly, cancel anytime.",
  },
  {
    name: "Founding Lifetime",
    price: "$199",
    duration: "one-time, first 50 only",
    originalPrice: "$299",
    badge: "Founding Attorney – first 50",
    audience: "Solo practitioners who live in their inbox & scanner.",
    description:
      "Lifetime access to unlimited, judge-ready exhibit packets with Bates numbers and labels. Built to replace late-night PDF surgery.",
    perks: [
      "Unlimited exhibit PDFs forever",
      "Unlimited files per packet",
      "Exhibit labels (Ex. A, Ex. B…) and page stamping",
      "Bates numbering (e.g. CR-0001, 0002…)",
      "Higher-priority processing queue",
    ],
    cta: {
      label: "Lock lifetime offer",
      priceId: "price_1SgBd6AVvDE7fh9qhxkSYOyX",
    },
    highlighted: true,
    note: "Limited to the first 50 buyers. One-time payment, lifetime access.",
  },
  {
    name: "Firm",
    price: "$79",
    duration: "per month",
    badge: "Up to 5 users",
    audience: "Boutique litigation, family, immigration, and PI teams.",
    description:
      "Give your whole team the same clean, consistent exhibit packets—without burning paralegal time.",
    perks: [
      "Everything in Solo",
      "Up to 5 attorney or staff accounts",
      "Preferred processing window",
      "Shared exhibit presets (coming soon)",
      "Priority email support",
    ],
    cta: {
      label: "Start firm plan",
      priceId: "price_1SfvgWAVvDE7fh9qi8A0blg4",
    },
    highlighted: false,
    note: "Ideal for 2–10 person teams running active dockets.",
  },
];

const enterprisePlan = {
  name: "Enterprise",
  blurb: "For litigation groups, PI shops, and high-volume teams.",
  points: [
    "10+ users with role-based access",
    "SSO & advanced security controls",
    "Audit logs & retention policies",
    "Custom Bates/exhibit schemas by jurisdiction",
    "White-labeling and firm branding",
  ],
  cta: {
    label: "Schedule a demo",
    href: "mailto:hello@caseready.io?subject=Enterprise%20demo%20request",
  },
};

export default function PricingPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;

    const applyUserState = (email: string | null) => {
      if (!active) return;
      setUserEmail(email);
      setIsCheckingSession(false);
    };

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      applyUserState(data.session?.user?.email ?? null);
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUserState(session?.user?.email ?? null);
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
    } finally {
      setIsSigningOut(false);
    }
  };

  const startCheckout = async (priceId?: string) => {
    if (!priceId) {
      router.push("/pricing");
      return;
    }
    setCheckoutLoading((prev) => ({ ...prev, [priceId]: true }));
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ priceId, accessToken: token }),
        credentials: "include",
      });
      if (!res.ok) {
        let message = "Could not start checkout. Please try again.";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // ignore parse error
        }
        if (res.status === 401) {
          message = "Please sign in to continue.";
        }
        alert(message);
        return;
      }
      const checkout = await res.json();
      if (checkout?.url) {
        window.location.href = checkout.url;
      } else {
        alert("Could not start checkout. Please try again.");
      }
    } catch (err) {
      console.error("Checkout error", err);
      alert("Something went wrong starting checkout.");
    } finally {
      setCheckoutLoading((prev) => ({ ...prev, [priceId]: false }));
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F2ED] text-[#1A1614] flex flex-col">
      {/* Top nav */}
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

          <nav className="hidden md:flex items-center gap-3 text-xs font-semibold text-[#1A1614]">
            <Link
              href="/how-it-works"
              className="rounded-full border border-[#E5E0D8] bg-white px-3 py-1 hover:border-[var(--color-brand-royal)] hover:text-[var(--color-brand-royal)] transition"
            >
              How it works
            </Link>
            <Link
              href="/features#roadmap"
              className="rounded-full border border-[#E5E0D8] bg-white px-3 py-1 hover:border-[var(--color-brand-royal)] hover:text-[var(--color-brand-royal)] transition"
            >
              Roadmap
            </Link>
            <Link
              href="/pricing"
              className="rounded-full border border-transparent bg-[var(--color-brand-royal)] px-3 py-1 text-white hover:bg-[var(--color-brand-royal-hover)] transition"
            >
              Pricing
            </Link>
            <Link
              href="/security"
              className="rounded-full border border-[#E5E0D8] bg-white px-3 py-1 hover:border-[var(--color-brand-royal)] hover:text-[var(--color-brand-royal)] transition"
            >
              Security
            </Link>
          </nav>

          {userEmail ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-full bg-[var(--color-brand-royal)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className={`inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-medium text-[#1A1614] hover:bg-[#F5F2ED] transition ${
                  isSigningOut ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {isSigningOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/signin"
                className="inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-medium text-[#1A1614] hover:bg-[#F5F2ED] transition"
              >
                {isCheckingSession ? "Checking…" : "Sign in"}
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center rounded-full bg-[var(--color-brand-royal)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Pricing content */}
      <section className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20 space-y-12">
          {/* Hero copy */}
          <div className="text-center max-w-4xl mx-auto space-y-5 bg-gradient-to-r from-[#eaf2ff] via-white to-[#f7f2ff] rounded-3xl border border-white/60 shadow-sm px-6 py-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-brand-royal)] font-semibold">
              Pricing
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900">
              Simple, honest pricing for solos and litigation teams.
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Start free on your next matter. When CaseReady becomes part of
              your workflow, step into a Solo or Firm plan and stop doing
              late-night PDF surgery by hand.
            </p>
            <p className="text-[11px] sm:text-xs text-gray-500">
              All plans include bank-level encryption, US-based hosting, and
              files processed in memory only — never used for AI training.
            </p>
          </div>

          {/* Founding offer banner */}
          <div className="rounded-3xl border border-dashed border-[var(--color-brand-royal)]/60 bg-[#F1F7FF] px-4 py-5 sm:px-6 sm:py-6 text-xs sm:text-sm text-gray-800 text-center shadow-sm">
            <span className="inline-flex items-center justify-center rounded-full bg-[var(--color-brand-royal)] text-white text-[10px] font-semibold px-2 py-0.5 mr-2">
              Founding offer
            </span>
            First 50 attorneys can lock a{" "}
            <span className="font-semibold">$199 lifetime</span> license (normally{" "}
            <span className="line-through decoration-red-500/70">$299</span>). Or choose{" "}
            <span className="font-semibold">$29/mo</span> if you prefer monthly.
            One-time = lifetime access.
          </div>

          {/* Main plans */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plansByTier.map((plan) => {
              const isLifetime = plan.name === "Founding Lifetime";
              return (
                <div
                  key={plan.name}
                  id={plan.highlighted ? "founders" : undefined}
                  className={`relative rounded-3xl border p-6 sm:p-7 shadow-md flex flex-col gap-5 transition hover:-translate-y-1 hover:shadow-lg overflow-hidden ${
                    plan.highlighted
                      ? isLifetime
                        ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/25 bg-white/98"
                        : "border-[#0056D6] ring-2 ring-[#0056D6]/30 bg-white/95"
                      : "border-gray-200 bg-white/95"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex flex-col items-center text-center gap-1">
                      <p
                        className={`text-xs uppercase tracking-wide ${
                          isLifetime ? "text-gray-900 font-semibold" : "text-gray-500"
                        }`}
                      >
                        {plan.name}
                      </p>
                      {plan.badge && (
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-semibold ${
                            isLifetime ? "bg-[#D4AF37] text-[#0B0F1F]" : "bg-[var(--color-brand-royal)] text-white"
                          }`}
                        >
                          {plan.badge}
                        </span>
                      )}
                      <p className={`text-[11px] ${isLifetime ? "text-black" : "text-gray-400"}`}>
                        {plan.audience}
                      </p>
                    </div>

                    <div className="flex items-baseline justify-center gap-2">
                      <p
                        className={`text-3xl sm:text-4xl font-semibold ${
                          isLifetime ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {plan.price}
                      </p>
                      <span
                        className={`text-xs sm:text-sm font-normal ${
                          isLifetime ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        {plan.duration}
                      </span>
                      {"originalPrice" in plan && plan.originalPrice && (
                        <span
                          className={`text-[11px] line-through ml-auto ${
                            isLifetime ? "text-gray-400" : "text-gray-400"
                          }`}
                        >
                          {plan.originalPrice}
                        </span>
                      )}
                    </div>

                    <p className={`text-xs sm:text-sm text-center ${isLifetime ? "text-black" : "text-gray-600"}`}>
                      {plan.description}
                    </p>
                  </div>

                  <ul className={`space-y-2 text-xs sm:text-sm ${isLifetime ? "text-black" : "text-gray-700"}`}>
                    {plan.perks.map((perk) => (
                      <li
                        key={perk}
                        className={`flex items-start gap-2 ${isLifetime ? "text-black" : "text-gray-600"}`}
                      >
                        <span
                          className={`mt-1 h-1.5 w-1.5 rounded-full ${
                            isLifetime ? "bg-[#D4AF37]" : "bg-[var(--color-brand-royal)]"
                          }`}
                        />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto space-y-2">
                    {"priceId" in plan.cta && plan.cta.priceId ? (
                      <button
                        type="button"
                        onClick={() => startCheckout((plan.cta as any).priceId)}
                        disabled={checkoutLoading[(plan.cta as any).priceId]}
                        className={`inline-flex justify-center items-center w-full rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                          isLifetime
                            ? "bg-gradient-to-r from-[#F7DE95] via-[#EBC867] to-[#D8B240] text-[#0F172A] shadow-lg shadow-[#D4AF37]/30 hover:-translate-y-0.5"
                            : plan.highlighted
                            ? "bg-[var(--color-brand-royal)] text-white shadow-lg shadow-[var(--color-brand-royal)]/40 hover:-translate-y-0.5"
                            : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                        } ${checkoutLoading[(plan.cta as any).priceId] ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        {checkoutLoading[(plan.cta as any).priceId] ? "Redirecting…" : plan.cta.label}
                      </button>
                    ) : (
                      <Link
                        href={plan.cta.href || "/pricing"}
                        className={`inline-flex justify-center items-center w-full rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                          isLifetime
                            ? "bg-[#D4AF37] text-[#0B0F1F] shadow-lg shadow-[#D4AF37]/30 hover:-translate-y-0.5"
                            : plan.highlighted
                            ? "bg-[var(--color-brand-royal)] text-white shadow-lg shadow-[var(--color-brand-royal)]/40 hover:-translate-y-0.5"
                            : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {plan.cta.label}
                      </Link>
                    )}
                    {plan.note && (
                      <p
                        className={`text-[11px] text-center font-semibold ${
                          isLifetime ? "text-[#0B0F1F]" : "text-gray-700"
                        }`}
                      >
                        {plan.note}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enterprise section */}
          <div className="rounded-3xl border border-gray-200 bg-white px-6 py-6 sm:px-8 sm:py-7 flex flex-col md:flex-row gap-6 items-start md:items-center shadow-sm">
            <div className="flex-1 space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                Enterprise
              </p>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Need CaseReady across a larger litigation group?
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                For teams with 10+ users or specific security/compliance
                requirements, we&apos;ll tailor CaseReady to your stack.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs sm:text-sm text-gray-700">
                {enterprisePlan.points.map((point) => (
                  <li key={point} className="flex gap-2 items-start">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full md:w-auto">
              <Link
                href={enterprisePlan.cta.href}
                className="inline-flex justify-center items-center w-full md:w-auto rounded-full px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-black transition shadow"
              >
                {enterprisePlan.cta.label}
              </Link>
              <p className="mt-2 text-[11px] text-gray-500 text-center md:text-left">
                Volume pricing available for high-throughput teams.
              </p>
            </div>
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

            {/* FAQ 6 - Pricing specific */}
            <div className="rounded-2xl border-2 border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-md hover:shadow-lg hover:border-[var(--color-brand-royal)]/20 transition-all duration-200">
              <h3 className="text-lg font-bold text-[#0A0A0A] mb-3 flex items-start gap-3">
                <svg className="w-6 h-6 text-[var(--color-brand-royal)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-base text-[#2A2522] leading-relaxed">
                Yes. Monthly subscriptions can be canceled anytime—no contracts, no cancellation fees. You'll keep access through the end of your billing period. The Founding Lifetime plan is a one-time payment with no recurring charges.
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
