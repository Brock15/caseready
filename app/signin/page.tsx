"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/createBrowserSupabaseClient";

export default function SigninPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <SigninPageContent />
    </Suspense>
  );
}

function SigninPageContent() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      const redirectTo = searchParams.get("redirectedFrom") || "/";
      router.replace(redirectTo);
    }

    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <header className="w-full border-b border-black/5 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-xl flex items-center justify-between py-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-md flex items-center justify-center border border-gray-100">
              <NextImage
                src="/logo.svg"
                alt="CaseReady logo"
                width={48}
                height={48}
                className="h-10 w-10"
                priority
              />
            </div>
            <span className="font-semibold tracking-tight text-lg text-gray-900">
              CaseReady
            </span>
          </Link>

          <Link
            href="/signup"
            className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Need an invite?
          </Link>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <p className="text-xs uppercase tracking-wide text-[#0056D6] font-semibold">
              Welcome back
            </p>
            <h1 className="text-2xl font-semibold text-gray-900 mt-2">
              Sign in to CaseReady.
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Use the email you confirmed to access your free exports.
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
                placeholder="Your password"
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
              {isSubmitting ? "Signing you in..." : "Sign in"}
            </button>
          </form>

          {errorMessage && (
            <p className="mt-4 text-sm text-red-600 text-center">
              {errorMessage}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
