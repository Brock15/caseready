"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setStatusMessage(
        "Thanks! Check your inbox to confirm your email before signing in."
      );
      setEmail("");
      setPassword("");
    }

    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <header className="w-full border-b border-black/5 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-xl flex items-center justify-between py-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-[#3FA9FF] to-[#0056D6] shadow-md flex items-center justify-center">
              <span className="text-white font-bold text-xl">CR</span>
            </div>
            <span className="font-semibold tracking-tight text-lg text-gray-900">
              CaseReady
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Back home
          </Link>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <p className="text-xs uppercase tracking-wide text-[#0056D6] font-semibold">
              Early access
            </p>
            <h1 className="text-2xl font-semibold text-gray-900 mt-2">
              Claim your CaseReady seat.
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create an account to start generating exhibits. We&apos;ll email
              you to confirm before you sign in.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-[#0056D6] focus:outline-none"
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Password
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-[#0056D6] focus:outline-none"
                placeholder="At least 6 characters"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
                isSubmitting
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#3FA9FF] to-[#0056D6] hover:brightness-110"
              }`}
            >
              {isSubmitting ? "Creating your account..." : "Create account"}
            </button>
          </form>

          {statusMessage && (
            <p className="mt-4 text-sm text-green-600">{statusMessage}</p>
          )}

          {errorMessage && (
            <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
          )}

          <p className="mt-6 text-xs text-gray-500 text-center">
            Already on the list?{" "}
            <Link href="/" className="text-[#0056D6] font-medium">
              Sign in from the homepage
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
