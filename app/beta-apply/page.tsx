"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/createBrowserSupabaseClient";

export default function BetaApplyPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    practiceArea: "",
    firmSize: "solo",
    casesPerMonth: "",
    currentProcess: "",
    whyCaseReady: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to signup if not authenticated
        router.push("/signup");
        return;
      }

      // Pre-fill email from authenticated user
      setFormData(prev => ({
        ...prev,
        email: user.email || "",
      }));

      setIsLoading(false);
    };

    checkAuth();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Send to API endpoint that will apply beta access to authenticated user
      const res = await fetch("/api/beta-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit application");
      }

      const data = await res.json();

      // Redirect to dashboard with success message
      router.push("/dashboard?beta_approved=true");
    } catch (err) {
      console.error("Beta application error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F5F2ED] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#E5E0D8] border-t-[var(--color-brand-royal)]" />
          <p className="text-sm text-[#6B6560] mt-4">Loading...</p>
        </div>
      </main>
    );
  }

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

          <Link
            href="/pricing"
            className="inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-medium text-[#1A1614] hover:bg-[#F5F2ED] transition"
          >
            ← Back to Pricing
          </Link>
        </div>
      </header>

      {/* Form Content */}
      <section className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-2 mb-4">
              <span className="text-4xl">🚀</span>
              <span className="inline-flex items-center justify-center rounded-full bg-[#7C3AED] text-white text-xs font-bold px-3 py-1.5 uppercase tracking-wider">
                Limited Beta
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0F1419] mb-3">
              Apply for Free Beta Access
            </h1>
            <p className="text-base sm:text-lg text-[#6B6560] max-w-2xl mx-auto">
              Limited to 50 solo practitioners in Personal Injury, Criminal Defense, or Divorce.
              Get instant access to all features—no credit card required.
            </p>
          </div>

          {/* Form */}
          <div className="rounded-3xl border-2 border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#0F1419]">Contact Information</h3>

                <div>
                  <label className="block text-sm font-medium text-[#0F1419] mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-[#E5E0D8] bg-white px-4 py-3 text-sm text-[#0F1419] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F1419] mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    className="w-full rounded-lg border border-[#E5E0D8] bg-gray-100 px-4 py-3 text-sm text-[#6B6560] cursor-not-allowed"
                    placeholder="john@lawfirm.com"
                  />
                  <p className="text-xs text-[#6B6560] mt-1">
                    Using your account email
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F1419] mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-[#E5E0D8] bg-white px-4 py-3 text-sm text-[#0F1419] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* Practice Info */}
              <div className="space-y-4 border-t border-[#E5E0D8] pt-6">
                <h3 className="text-lg font-semibold text-[#0F1419]">Practice Information</h3>

                <div>
                  <label className="block text-sm font-medium text-[#0F1419] mb-2">
                    Practice Area <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="practiceArea"
                    value={formData.practiceArea}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-[#E5E0D8] bg-white px-4 py-3 text-sm text-[#0F1419] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                  >
                    <option value="">Select your primary practice area</option>
                    <option value="personal_injury">Personal Injury</option>
                    <option value="criminal_defense">Criminal Defense</option>
                    <option value="divorce">Divorce / Family Law</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F1419] mb-2">
                    Firm Size <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="firmSize"
                    value={formData.firmSize}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-[#E5E0D8] bg-white px-4 py-3 text-sm text-[#0F1419] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                  >
                    <option value="solo">Solo Practitioner</option>
                    <option value="small">2-10 Attorneys</option>
                    <option value="large">10+ Attorneys</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F1419] mb-2">
                    How many cases do you handle per month? <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="casesPerMonth"
                    value={formData.casesPerMonth}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-[#E5E0D8] bg-white px-4 py-3 text-sm text-[#0F1419] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                    placeholder="e.g., 5-10 active cases"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F1419] mb-2">
                    How do you currently organize exhibits for trial? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="currentProcess"
                    value={formData.currentProcess}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full rounded-lg border border-[#E5E0D8] bg-white px-4 py-3 text-sm text-[#0F1419] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                    placeholder="Tell us about your current process..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F1419] mb-2">
                    Why do you want to try CaseReady? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="whyCaseReady"
                    value={formData.whyCaseReady}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full rounded-lg border border-[#E5E0D8] bg-white px-4 py-3 text-sm text-[#0F1419] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                    placeholder="What are you hoping to achieve with CaseReady?"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="border-t border-[#E5E0D8] pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] px-8 py-4 text-base font-bold text-white shadow-xl shadow-[#7C3AED]/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Get Instant Access
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-[#6B6560] mt-4">
                  By submitting, you agree to our{" "}
                  <Link href="/terms" className="text-[#7C3AED] hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-[#7C3AED] hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Benefits */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 text-center">
              <div className="text-2xl mb-2">⚡</div>
              <p className="text-sm font-semibold text-[#0F1419]">Instant Approval</p>
              <p className="text-xs text-[#6B6560] mt-1">Get access immediately</p>
            </div>
            <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 text-center">
              <div className="text-2xl mb-2">💳</div>
              <p className="text-sm font-semibold text-[#0F1419]">No Credit Card</p>
              <p className="text-xs text-[#6B6560] mt-1">100% free during beta</p>
            </div>
            <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 text-center">
              <div className="text-2xl mb-2">🔓</div>
              <p className="text-sm font-semibold text-[#0F1419]">Full Access</p>
              <p className="text-xs text-[#6B6560] mt-1">All features unlocked</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
