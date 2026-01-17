"use client";

import Link from "next/link";
import NextImage from "next/image";

export default function RealEstateExample() {
  return (
    <div className="min-h-screen bg-[#F5F2ED]">
      {/* Header */}
      <header className="w-full border-b border-[#0F1419] bg-gradient-to-br from-[#1A202C] via-[#16324A] to-[#1A202C] backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-40 animate-shimmer"></div>

        <div className="mx-auto max-w-6xl flex items-center justify-between py-4 px-4 sm:px-6 relative z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-lg group-hover:shadow-xl flex items-center justify-center border border-[#F0EBE5] transition-all duration-300 group-hover:scale-105">
              <NextImage
                src="/logo.svg"
                alt="CaseReady logo"
                width={48}
                height={48}
                className="h-10 w-10"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold tracking-tight text-lg text-white group-hover:text-gray-100 transition-colors">
                CaseReady
              </span>
              <span className="text-xs text-gray-300 hidden sm:block group-hover:text-gray-200 transition-colors">
                Evidence made effortless.
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/examples"
              className="hidden md:inline-flex items-center rounded-full border-2 border-white/30 bg-[#16324A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#12293C] hover:border-white/50 shadow-sm hover:shadow-md transition-all duration-200"
            >
              All Examples
            </Link>
            <Link
              href="/signin"
              className="inline-flex items-center rounded-full border-2 border-white/30 bg-[#16324A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#12293C] hover:border-white/50 shadow-sm hover:shadow-md transition-all duration-200"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-12 space-y-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#6B6560]">
          <Link href="/examples" className="hover:text-[var(--color-brand-royal)] transition">
            Examples
          </Link>
          <span>/</span>
          <span className="text-[#0F1419] font-medium">Real Estate Litigation Evidence</span>
        </nav>

        {/* Hero Section */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 border border-blue-200 px-4 py-1.5">
            <span className="text-sm font-semibold text-blue-800">Civil</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-[#0F1419] tracking-tight">
            Real Estate Litigation Evidence
          </h1>

          <p className="text-lg text-[#6B6560] max-w-3xl leading-relaxed">
            Contracts, inspection reports, emails, photos, and financial records organized into a single evidence bundle with Bates numbering, redactions, and a professional cover sheet ready for filing.
          </p>
        </div>

        {/* Preview Image */}
        <div className="rounded-2xl border-2 border-[#E5E0D8] bg-white shadow-xl overflow-hidden">
          <NextImage
            src="/examples/real-estate-cover.png"
            alt="Real estate litigation evidence preview showing plaintiff exhibits with contract, inspection report, and redacted records"
            width={1200}
            height={800}
            className="w-full h-auto"
            priority
          />
        </div>

        {/* What's Included */}
        <div className="rounded-3xl border border-[#E5E0D8] bg-white p-8 sm:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-[#0F1419] mb-6">What's Included in This Example</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#0F1419] flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--color-brand-royal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Documents
              </h3>
              <ul className="space-y-2 text-sm text-[#6B6560]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-brand-royal)] mt-0.5">•</span>
                  <span>Contract & addenda (5 pages)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-brand-royal)] mt-0.5">•</span>
                  <span>Inspection report (3 pages)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-brand-royal)] mt-0.5">•</span>
                  <span>Email correspondence (7 pages)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-brand-royal)] mt-0.5">•</span>
                  <span>Financial records & invoices (5 pages)</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#0F1419] flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--color-brand-royal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Features Applied
              </h3>
              <ul className="space-y-2 text-sm text-[#6B6560]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-brand-royal)] mt-0.5">•</span>
                  <span>Auto-generated Bates numbers (A001-A020)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-brand-royal)] mt-0.5">•</span>
                  <span>Exhibit labels with page ranges</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-brand-royal)] mt-0.5">•</span>
                  <span>Redaction blocks for financial details</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-brand-royal)] mt-0.5">•</span>
                  <span>Cover page with table of contents</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="rounded-3xl border border-[#E5E0D8] bg-gradient-to-br from-white to-gray-50 p-8 sm:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-[#0F1419] mb-6">How This Was Built</h2>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-brand-royal)] text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="font-semibold text-[#0F1419] mb-1">Upload Case Materials</h3>
                <p className="text-sm text-[#6B6560]">
                  Added contract PDFs, inspection report, a photo set, email thread export, and accounting records.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-brand-royal)] text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="font-semibold text-[#0F1419] mb-1">Auto-Label & Redact</h3>
                <p className="text-sm text-[#6B6560]">
                  CaseReady detected dates, created exhibits A-D, and applied redaction blocks to sensitive financial data.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-brand-royal)] text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="font-semibold text-[#0F1419] mb-1">Export One PDF</h3>
                <p className="text-sm text-[#6B6560]">
                  Exported a single court-ready PDF with a cover sheet, index, Bates stamps, and consistent formatting.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="rounded-3xl border-2 border-[var(--color-brand-royal)]/20 bg-gradient-to-br from-[#F5F3FF] to-white p-8 sm:p-10 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-[#0F1419] mb-3">
            Ready to build your own exhibit packets?
          </h2>
          <p className="text-[#6B6560] mb-6 max-w-2xl mx-auto">
            Try CaseReady free with 2 exports per month. No credit card required.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 bg-[#16324A] px-8 py-3 text-base font-semibold text-white hover:bg-[#12293C] hover:border-white/50 shadow-md hover:shadow-lg transition-all duration-200"
            >
              Start Free Trial
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/examples"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-brand-royal)]/30 bg-white px-8 py-3 text-base font-semibold text-[var(--color-brand-royal)] hover:border-[var(--color-brand-royal)]/50 hover:bg-[var(--color-brand-royal)]/5 shadow-sm hover:shadow-md transition-all duration-200"
            >
              View More Examples
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E0D8] bg-white/50 mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#6B6560]">
              © 2025 CaseReady. Evidence made effortless.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm font-medium text-[#6B6560] hover:text-[var(--color-brand-royal)] transition">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm font-medium text-[#6B6560] hover:text-[var(--color-brand-royal)] transition">
                Terms
              </Link>
              <Link href="/security" className="text-sm font-medium text-[#6B6560] hover:text-[var(--color-brand-royal)] transition">
                Security
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
