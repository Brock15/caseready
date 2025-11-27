"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#111827]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#0056D6] font-semibold">
              Terms of Service
            </p>
            <h1 className="text-3xl font-semibold mt-2">CaseReady Terms & Conditions</h1>
            <p className="text-sm text-gray-600 mt-1">
              Effective as of {new Date().getFullYear()}.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            ← Back to home
          </Link>
        </header>

        <div className="space-y-6 text-sm leading-6 text-gray-800">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">1. Your Agreement</h2>
            <p>
              By accessing or using CaseReady, you agree to these Terms of Service. If you do not agree, you may not use the service. These terms govern all use of the CaseReady Exhibit Builder, dashboard, and related features.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">2. No Legal Advice</h2>
            <p>
              CaseReady is a tooling platform only. We do not provide legal advice, representation, or any guarantee of outcomes in court. You are solely responsible for reviewing all outputs for accuracy and compliance with applicable rules, deadlines, and filing requirements.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">3. Use of Service & Uploads</h2>
            <p>
              You must have the rights to upload any content you process. You will not upload confidential or protected information unless you have the legal right to do so. You remain responsible for the contents and for ensuring that documents are properly redacted before filing.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">4. Warranty Disclaimer</h2>
            <p>
              CaseReady is provided “as is” and “as available.” We disclaim all warranties, whether express or implied, including merchantability, fitness for a particular purpose, and non-infringement. Outputs may contain errors; you must verify all materials.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">5. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, CaseReady and its owners, employees, and affiliates are not liable for any indirect, incidental, special, consequential, punitive, or exemplary damages, or for loss of data, profits, or business opportunities, arising from your use of the service, even if advised of the possibility of such damages. Our total liability for any claim is limited to the amount you paid for the service in the 3 months preceding the claim or $100, whichever is less.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">6. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold CaseReady harmless from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys’ fees) arising out of your use of the service, your content, or your violation of these terms or any applicable law.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">7. Security & Data Handling</h2>
            <p>
              We use encrypted transport (TLS) for data in transit. Exhibits are processed in memory and stored in your account’s designated storage. You remain responsible for backing up and managing your files. For more on our security posture, visit the{" "}
              <Link href="/security" className="text-[#0056D6] font-semibold hover:underline">
                Security page
              </Link>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">8. Termination</h2>
            <p>
              We may suspend or terminate access at any time for misuse, security risk, or non-payment. You may stop using the service at any time. Provisions on warranty disclaimers, limitation of liability, and indemnification survive termination.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">9. Changes to Terms</h2>
            <p>
              We may update these terms occasionally. Continued use after an update constitutes acceptance of the new terms. We encourage you to review them periodically.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">10. Governing Law</h2>
            <p>
              These terms are governed by the laws of your primary place of business unless otherwise required by applicable law. Any disputes will be resolved in a venue of our choosing, subject to applicable law.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
