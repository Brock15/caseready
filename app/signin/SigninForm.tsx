"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/createBrowserSupabaseClient";

export default function SigninForm() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOauthLoading, setIsOauthLoading] = useState(false);

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
      const redirectTo = searchParams.get("redirectedFrom") || "/dashboard";
      router.replace(redirectTo);
    }

    setIsSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    if (isOauthLoading) return;
    try {
      setIsOauthLoading(true);
      const redirectTo = searchParams.get("redirectedFrom") || "/dashboard";
      const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        redirectTo
      )}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          redirectTo: callbackUrl,
        },
      });
      if (error) {
        setErrorMessage(error.message);
        setIsOauthLoading(false);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to start Google sign-in."
      );
      setIsOauthLoading(false);
    }
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

          <div className="mt-6">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex-1 h-px bg-gray-200" />
              <span>or continue with</span>
              <span className="flex-1 h-px bg-gray-200" />
            </div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isOauthLoading}
              className={`mt-4 w-full inline-flex items-center justify-center gap-3 rounded-full border px-4 py-2.5 text-sm font-semibold ${
                isOauthLoading
                  ? "border-gray-200 text-gray-400"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white">
                <svg viewBox="0 0 48 48" className="h-4 w-4">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.72 1.22 9.22 3.6l6.85-6.85C35.9 2.46 30.37 0 24 0 14.64 0 6.51 5.38 2.56 13.21l7.98 6.21C12.57 13.01 17.86 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.5 24.5c0-1.57-.14-3.08-.4-4.5H24v9h12.7c-.55 2.96-2.24 5.48-4.76 7.2l7.44 5.77C43.78 37.37 46.5 31.39 46.5 24.5z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.54 28.04c-.48-1.43-.75-2.95-.75-4.54s.27-3.11.75-4.54l-7.98-6.21C1.09 15.8 0 20.27 0 24s1.09 8.2 2.56 11.25l7.98-6.21z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.37 0 11.73-2.1 15.64-5.7l-7.44-5.77c-2.06 1.39-4.71 2.2-8.2 2.2-6.14 0-11.43-3.52-13.46-8.5l-7.98 6.21C6.51 42.62 14.64 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
              </span>
              {isOauthLoading ? "Redirecting..." : "Continue with Google"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
