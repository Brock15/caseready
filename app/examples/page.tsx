"use client";

import Link from "next/link";
import NextImage from "next/image";

type Example = {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  href: string;
  badge?: string;
};

const examples: Example[] = [
  {
    id: "criminal-defense",
    title: "Criminal Defense Trial Exhibits",
    description:
      "Police reports, body-cam stills, discovery PDFs, and witness statements compiled into a court-ready exhibit packet with clean indexing.",
    category: "Criminal Defense",
    badge: "High volume",
    image: "/examples/criminal-defense-cover.png",
    href: "/examples/criminal-defense",
  },
  {
    id: "real-estate",
    title: "Real Estate Litigation Evidence",
    description:
      "Contracts, inspection reports, emails, photos, and financial records organized into a single evidence bundle with Bates numbering.",
    category: "Civil",
    badge: "Civil",
    image: "/examples/real-estate-cover.png",
    href: "/examples/real-estate",
  },
  {
    id: "immigration",
    title: "Immigration & Asylum Filing Packet",
    description:
      "Passports, affidavits, country condition reports, and supporting documents compiled into a USCIS-ready PDF.",
    category: "Immigration",
    image: "/examples/immigration-cover.png",
    href: "/examples/immigration",
  },
];

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-[#F5F2ED]">
      {/* Header */}
      <header className="w-full border-b border-[#E5E0D8] bg-[#F5F2ED]">
        <div className="mx-auto max-w-6xl flex items-center justify-between py-6 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-sm group-hover:shadow-md flex items-center justify-center border border-[#E5E0D8] transition-all duration-300 group-hover:scale-105">
              <NextImage
                src="/logo.svg"
                alt="CaseReady logo"
                width={48}
                height={48}
                className="h-10 w-10"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold tracking-tight text-lg text-[#0F1419] group-hover:text-[#0F1419] transition-colors">
                CaseReady
              </span>
              <span className="text-xs text-[#6B6560] hidden sm:block group-hover:text-[#6B6560] transition-colors">
                Evidence made effortless.
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/features"
              className="hidden md:inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-semibold text-[#0F1419] hover:border-[#D8D2C8] hover:bg-[#FDFCFB] shadow-sm hover:shadow-md transition-all duration-200"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="hidden md:inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-semibold text-[#0F1419] hover:border-[#D8D2C8] hover:bg-[#FDFCFB] shadow-sm hover:shadow-md transition-all duration-200"
            >
              Pricing
            </Link>
            <Link
              href="/signin"
              className="inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-semibold text-[#0F1419] hover:border-[#D8D2C8] hover:bg-[#FDFCFB] shadow-sm hover:shadow-md transition-all duration-200"
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
              className="rounded-3xl border border-[#E5E0D8] bg-white hover:border-[#D8D2C8] hover:shadow-lg transition-all duration-200 overflow-hidden group"
            >
              <div className="p-4 pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-full bg-[#F5F2ED] px-3 py-1 text-[11px] font-semibold text-[#0F1419] border border-[#E5E0D8]">
                    {example.category}
                  </span>
                  {example.badge && (
                    <span className="inline-flex items-center rounded-full bg-[#EAF2EC] px-2 py-0.5 text-[11px] font-medium text-[#2F5D3B] border border-[#D8E7DD]">
                      {example.badge}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="rounded-2xl border border-[#E5E0D8] bg-[#F8F6F2] overflow-hidden shadow-sm">
                  <NextImage
                    src={example.image}
                    alt={`${example.title} cover`}
                    width={800}
                    height={520}
                    className="w-full h-auto"
                  />
                </div>
              </div>

              <div className="px-6 pb-6 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#0F1419] tracking-tight">
                    {example.title}
                  </h3>
                  <p className="text-sm text-[#6B6560] leading-relaxed">
                    {example.description}
                  </p>
                </div>

                <Link
                  href={example.href}
                  className="inline-flex items-center gap-2 rounded-full bg-[#16324A] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all duration-200 hover:bg-[#12293C]"
                >
                  View example
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
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
