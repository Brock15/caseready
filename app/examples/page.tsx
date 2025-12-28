"use client";

import Link from "next/link";
import NextImage from "next/image";

type Example = {
  id: string;
  title: string;
  description: string;
  category: string;
  badge?: string;
};

const examples: Example[] = [
  {
    id: "1",
    title: "Personal Injury Case Bundle",
    description: "Complete exhibit packet with medical records, accident photos, and witness statements. Auto-sorted by date with custom cover page.",
    category: "Personal Injury",
    badge: "Popular",
  },
  {
    id: "2",
    title: "Employment Dispute Evidence",
    description: "Email chains, contracts, and HR documentation compiled with redactions and professional formatting.",
    category: "Employment Law",
  },
  {
    id: "3",
    title: "Family Court Documentation",
    description: "Financial records, text messages, and supporting documents organized chronologically with exhibit labels.",
    category: "Family Law",
  },
];

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-[#F5F2ED]">
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
              href="/signin"
              className="inline-flex items-center rounded-full bg-[var(--color-brand-royal)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-brand-royal-hover)] transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-12 space-y-8">
        {/* Hero section */}
        <div className="pb-2 border-b border-[#E5E0D8]">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-brand-royal)] font-semibold">
            Case Examples
          </p>
          <h1 className="text-3xl font-semibold text-[#0F1419] tracking-tight mt-2">
            See CaseReady in action
          </h1>
          <p className="text-sm text-[#6B6560] mt-2 max-w-2xl">
            Real-world examples of how attorneys use CaseReady to organize evidence, create exhibit packets, and streamline case preparation.
          </p>
        </div>

        {/* Examples grid */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {examples.map((example) => (
            <div
              key={example.id}
              className="rounded-3xl border border-[#E5E0D8] bg-white hover:border-[var(--color-brand-royal)]/30 hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              {/* Top stripe */}
              <div className="h-1 bg-gradient-to-r from-[var(--color-brand-royal)]/60 via-[var(--color-brand-royal)]/30 to-transparent" />

              <div className="p-6 space-y-4">
                {/* Badge and category */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-full bg-[var(--color-brand-royal)]/5 px-3 py-1 text-[11px] font-semibold text-[var(--color-brand-royal)] border border-[var(--color-brand-royal)]/10">
                    {example.category}
                  </span>
                  {example.badge && (
                    <span className="inline-flex items-center rounded-full bg-[#F5F2ED] px-2 py-0.5 text-[11px] font-medium text-[#6B6560] border border-[#E5E0D8]">
                      {example.badge}
                    </span>
                  )}
                </div>

                {/* Title and description */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#0F1419] tracking-tight">
                    {example.title}
                  </h3>
                  <p className="text-sm text-[#6B6560] leading-relaxed">
                    {example.description}
                  </p>
                </div>

                {/* View button */}
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-brand-royal)] to-[var(--color-brand-royal-hover)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                >
                  View example
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* Coming soon section */}
        <section className="rounded-3xl border-2 border-dashed border-[#E5E0D8] bg-white p-10 text-center">
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-brand-royal)]/5 border border-[var(--color-brand-royal)]/10">
              <svg
                className="w-8 h-8 text-[var(--color-brand-royal)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-[#0F1419] tracking-tight">
              More examples coming soon
            </h2>
            <p className="text-sm text-[#6B6560] leading-relaxed">
              We're building a comprehensive library of case examples across different practice areas. Check back soon for detailed walkthroughs, before-and-after comparisons, and best practices.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-brand-royal)] to-[var(--color-brand-royal-hover)] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
              >
                Try it yourself
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-brand-royal)]/20 bg-white px-6 py-3 text-sm font-semibold text-[var(--color-brand-royal)] hover:border-[var(--color-brand-royal)]/40 hover:bg-[var(--color-brand-royal)]/5 shadow-sm hover:shadow-md transition-all duration-200"
              >
                View features
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E0D8] bg-white/50 mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#6B6560]">
              © 2025 CaseReady. Evidence made effortless.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-sm font-medium text-[#6B6560] hover:text-[var(--color-brand-royal)] transition"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm font-medium text-[#6B6560] hover:text-[var(--color-brand-royal)] transition"
              >
                Terms
              </Link>
              <Link
                href="/security"
                className="text-sm font-medium text-[#6B6560] hover:text-[var(--color-brand-royal)] transition"
              >
                Security
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
