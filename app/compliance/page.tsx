"use client";

import Link from "next/link";

export default function CompliancePage() {
  return (
    <main className="min-h-screen bg-[#F7F1EA] text-[#0F172A]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 space-y-10">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-brand-royal)] font-semibold">
              Compliance
            </p>
            <h1 className="text-3xl font-semibold mt-2 text-[#0A0A0A]">
              Built to meet legal industry standards
            </h1>
            <p className="text-sm text-[#5A544F] mt-1 max-w-2xl">
              CaseReady follows industry-standard compliance frameworks to protect attorney-client privilege and confidential case materials.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-full bg-[var(--color-brand-royal)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-brand-royal-hover)] transition"
            >
              View plans
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border-2 border-[#E5E0D8] bg-white px-4 py-2 text-xs font-semibold text-[#1A1614] hover:bg-[#F7F1EA] transition"
            >
              Back home
            </Link>
          </div>
        </header>

        {/* Key Compliance Statement */}
        <section className="rounded-3xl border-2 border-[var(--color-brand-royal)]/20 bg-gradient-to-br from-[#EEF3FF] to-white p-8 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-brand-royal)]/10 flex-shrink-0">
              <svg className="w-6 h-6 text-[var(--color-brand-royal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0A0A0A] mb-3">
                Your files are never used for AI training
              </h2>
              <p className="text-sm text-[#2A2522] leading-relaxed mb-4">
                CaseReady processes documents in memory only. Files are immediately deleted after download. We maintain zero retention after processing—no backups, no logs, no exceptions. Your confidential case materials remain privileged.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-royal)]/20 bg-white px-4 py-2 text-xs font-semibold text-[#0A0A0A] shadow-sm">
                  <svg className="w-4 h-4 text-[var(--color-brand-royal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Zero retention
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-royal)]/20 bg-white px-4 py-2 text-xs font-semibold text-[#0A0A0A] shadow-sm">
                  <svg className="w-4 h-4 text-[var(--color-brand-royal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  No AI training
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-royal)]/20 bg-white px-4 py-2 text-xs font-semibold text-[#0A0A0A] shadow-sm">
                  <svg className="w-4 h-4 text-[var(--color-brand-royal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Attorney-client privilege maintained
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* SOC 2 Type II */}
          <section className="rounded-3xl border-2 border-[#E5E0D8] bg-white p-6 shadow-md hover:shadow-lg hover:border-[var(--color-brand-royal)]/30 transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#0A0A0A]">SOC 2 Type II</h2>
            </div>
            <p className="text-sm text-[#2A2522] leading-relaxed mb-3">
              Our infrastructure provider (Supabase) maintains SOC 2 Type II certification, ensuring robust security controls across availability, processing integrity, confidentiality, and privacy.
            </p>
            <ul className="space-y-2 text-sm text-[#2A2522]">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-royal)] flex-shrink-0" />
                <span>Annual third-party audits</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-royal)] flex-shrink-0" />
                <span>Continuous security monitoring</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-royal)] flex-shrink-0" />
                <span>Documented security policies</span>
              </li>
            </ul>
          </section>

          {/* HIPAA */}
          <section className="rounded-3xl border-2 border-[#E5E0D8] bg-white p-6 shadow-md hover:shadow-lg hover:border-[var(--color-brand-royal)]/30 transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-50">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#0A0A0A]">HIPAA Compliant</h2>
            </div>
            <p className="text-sm text-[#2A2522] leading-relaxed mb-3">
              For personal injury, medical malpractice, and healthcare-related cases, CaseReady maintains HIPAA-compliant handling of protected health information (PHI).
            </p>
            <ul className="space-y-2 text-sm text-[#2A2522]">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-royal)] flex-shrink-0" />
                <span>Encrypted storage of medical records</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-royal)] flex-shrink-0" />
                <span>Access controls and audit trails</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-royal)] flex-shrink-0" />
                <span>BAA available for covered entities</span>
              </li>
            </ul>
          </section>

          {/* Data Privacy */}
          <section className="rounded-3xl border-2 border-[#E5E0D8] bg-white p-6 shadow-md hover:shadow-lg hover:border-[var(--color-brand-royal)]/30 transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#0A0A0A]">GDPR & CCPA Ready</h2>
            </div>
            <p className="text-sm text-[#2A2522] leading-relaxed mb-3">
              Data privacy rights respected for cases involving EU or California residents. Clear data handling policies and user controls.
            </p>
            <ul className="space-y-2 text-sm text-[#2A2522]">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-royal)] flex-shrink-0" />
                <span>Right to access and delete data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-royal)] flex-shrink-0" />
                <span>Transparent data processing policies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-royal)] flex-shrink-0" />
                <span>US-based data storage</span>
              </li>
            </ul>
          </section>

          {/* Attorney-Client Privilege */}
          <section className="rounded-3xl border-2 border-[#E5E0D8] bg-white p-6 shadow-md hover:shadow-lg hover:border-[var(--color-brand-royal)]/30 transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#0A0A0A]">Attorney-Client Privilege</h2>
            </div>
            <p className="text-sm text-[#2A2522] leading-relaxed mb-3">
              CaseReady operates as a technology service provider under attorney supervision. All documents remain privileged attorney work product.
            </p>
            <ul className="space-y-2 text-sm text-[#2A2522]">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-royal)] flex-shrink-0" />
                <span>No third-party access to case files</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-royal)] flex-shrink-0" />
                <span>Zero-knowledge architecture</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-royal)] flex-shrink-0" />
                <span>Attorney remains custodian of records</span>
              </li>
            </ul>
          </section>

          {/* Encryption Standards */}
          <section className="rounded-3xl border-2 border-[#E5E0D8] bg-white p-6 shadow-md hover:shadow-lg hover:border-[var(--color-brand-royal)]/30 transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#0A0A0A]">Bank-Grade Encryption</h2>
            </div>
            <p className="text-sm text-[#2A2522] leading-relaxed mb-3">
              All data is encrypted at rest and in transit using industry-standard protocols trusted by financial institutions.
            </p>
            <ul className="space-y-2 text-sm text-[#2A2522]">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-royal)] flex-shrink-0" />
                <span>AES-256 encryption at rest</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-royal)] flex-shrink-0" />
                <span>TLS 1.3 for data in transit</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-royal)] flex-shrink-0" />
                <span>Encrypted backups and recovery</span>
              </li>
            </ul>
          </section>

          {/* Court Compliance */}
          <section className="rounded-3xl border-2 border-[#E5E0D8] bg-white p-6 shadow-md hover:shadow-lg hover:border-[var(--color-brand-royal)]/30 transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#0A0A0A]">Court Rule Compliance</h2>
            </div>
            <p className="text-sm text-[#2A2522] leading-relaxed mb-3">
              Exhibit formatting follows Federal Rules of Evidence and state court requirements for admissibility and authentication.
            </p>
            <ul className="space-y-2 text-sm text-[#2A2522]">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-royal)] flex-shrink-0" />
                <span>Federal Rules of Evidence compliance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-royal)] flex-shrink-0" />
                <span>State court exhibit standards</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-royal)] flex-shrink-0" />
                <span>96% court acceptance rate</span>
              </li>
            </ul>
          </section>
        </div>

        {/* Additional Information */}
        <section className="rounded-3xl border-2 border-[#E5E0D8] bg-white p-8 shadow-md">
          <h2 className="text-xl font-bold text-[#0A0A0A] mb-4">
            Questions about compliance?
          </h2>
          <p className="text-sm text-[#2A2522] leading-relaxed mb-6">
            We understand that legal professionals need detailed compliance documentation. For BAA agreements, security questionnaires, or specific compliance requirements for your jurisdiction, reach out to our team.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="mailto:hello@caseready.io?subject=Compliance%20inquiry"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-brand-royal)] to-[var(--color-brand-royal-hover)] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
            >
              Contact compliance team
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/security"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-brand-royal)]/20 bg-white px-6 py-3 text-sm font-semibold text-[var(--color-brand-royal)] hover:border-[var(--color-brand-royal)]/40 hover:bg-[var(--color-brand-royal)]/5 shadow-sm hover:shadow-md transition-all duration-200"
            >
              View security details
            </Link>
          </div>
        </section>

        {/* Footer note */}
        <div className="text-center pt-8 border-t border-[#E5E0D8]">
          <p className="text-xs text-[#6B6560]">
            Last updated: December 2024 · For enterprise compliance requirements,{" "}
            <Link href="/pricing" className="text-[var(--color-brand-royal)] hover:underline font-semibold">
              view our Enterprise plan
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
