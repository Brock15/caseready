"use client";

import Link from "next/link";
import NextImage from "next/image";
import { useMemo, useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/createBrowserSupabaseClient";
import type { Session } from "@supabase/supabase-js";

type QuickAction = {
  id: string;
  title: string;
  description: string;
  badge: string;
  href?: string;
};

const COMING_SOON_FEATURES = new Set(["chat", "portal"]);

const quickActions: QuickAction[] = [
  {
    id: "timeline",
    title: "Timeline Builder",
    description: "Build courtroom timelines from events and filings.",
    badge: "Beta",
    href: "/timeline",
  },
  {
    id: "redact",
    title: "Stealth Redaction",
    description: "Batch remove sensitive info from PDFs.",
    badge: "Beta",
    href: "/stealth",
  },
  {
    id: "chat",
    title: "Evidence Workspace",
    description: "Summaries, notes, and tasking on matters.",
    badge: "Preview",
    href: "/workspace",
  },
  {
    id: "portal",
    title: "Client Portal",
    description: "Collect uploads with secure client links.",
    badge: "Coming Soon",
    href: "/portal",
  },
];

export default function DashboardClient({
  initialSession,
}: {
  initialSession: Session;
}) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(initialSession);
  const [search, setSearch] = useState("");
  const [documents, setDocuments] = useState<
    {
      id: string;
      title: string;
      updated: string;
      owner: string;
      status: string;
      tags: string[];
      pdf_url?: string | null;
      starred?: boolean;
    }[]
  >([]);
  const [listMessage, setListMessage] = useState<string | null>(null);
  const [loadingMatters, setLoadingMatters] = useState(false);
  const [showLabsExpanded, setShowLabsExpanded] = useState(false);

  const plan = String(session?.user?.user_metadata?.plan ?? "").toLowerCase();
  const hasPremium =
    plan === "premium" ||
    session?.user?.user_metadata?.premiumAccess === true ||
    session?.user?.user_metadata?.hasUnlimitedExports === true ||
    session?.user?.email === "brockstar1215@gmail.com";
  const planLabel =
    hasPremium || plan === "premium"
      ? "Premium"
      : plan
      ? plan.charAt(0).toUpperCase() + plan.slice(1)
      : "Free";
  const exportsUsed = Number(session?.user?.user_metadata?.exportsUsed ?? 0);
  const exportsLimit = 2;
  const exportsLeft = Math.max(0, exportsLimit - exportsUsed);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (!currentSession) {
        router.replace("/signin?redirectedFrom=/dashboard");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  useEffect(() => {
    const loadMatters = async () => {
      setLoadingMatters(true);
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        setDocuments([]);
        setListMessage("Sign in to see your matters.");
        setLoadingMatters(false);
        return;
      }
      const { data, error } = await supabase
        .from("matters")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .order("updated_at", { ascending: false });
      if (!error && Array.isArray(data)) {
        setDocuments(
          data.map((m) => ({
            id: m.id,
            title: m.name || "Untitled matter",
            updated: new Date(m.updated_at).toLocaleString(),
            owner: "You",
            status: m.status ? m.status[0].toUpperCase() + m.status.slice(1) : "Ready",
            tags: ["Exhibit Packet"],
            pdf_url: m.pdf_url,
            starred: m.starred || false,
          }))
        );
        setListMessage(null);
      } else {
        setDocuments([]);
        setListMessage("Could not load matters. Check Supabase table and policies.");
      }
      setLoadingMatters(false);
    };
    loadMatters();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/signin");
  };

  const filteredDocs = documents.filter((doc) => {
    if (!search.trim()) return true;
    const target = `${doc.title} ${doc.tags.join(" ")}`.toLowerCase();
    return target.includes(search.toLowerCase());
  });
  const starredDocs = filteredDocs.filter((doc) => doc.starred);
  const unstarredDocs = filteredDocs.filter((doc) => !doc.starred);

  const handleDeleteMatter = async (id: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) return;
    const { error } = await supabase
      .from("matters")
      .delete()
      .eq("id", id)
      .eq("user_id", sessionData.session.user.id);
    if (!error) {
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } else {
      setListMessage("Delete failed. Check RLS/policies on matters.");
    }
  };

  const toggleStar = async (id: string, nextValue: boolean) => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) return;
    const { error } = await supabase
      .from("matters")
      .update({ starred: nextValue })
      .eq("id", id)
      .eq("user_id", sessionData.session.user.id);
    if (!error) {
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? { ...doc, starred: nextValue } : doc))
      );
    } else {
      setListMessage(`Could not update star. Check policies/columns. ${error.message ?? ""}`);
    }
  };

  const initials =
    session?.user?.email?.slice(0, 1).toUpperCase() ||
    session?.user?.user_metadata?.full_name?.slice(0, 1) ||
    "C";

  return (
    <div className="min-h-screen bg-[#F5F2ED]">
      {/* Header */}
      <header className="w-full border-b border-[#E5E0D8] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-between py-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-[#F0EBE5]">
              <NextImage src="/logo.svg" alt="CaseReady logo" width={40} height={40} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F1419]">CaseReady</p>
              <p className="text-xs text-[#6B6560]">Beta dashboard</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {!hasPremium ? (
              <Link
                href="/pricing"
                className="hidden md:inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-medium text-[#1A1614] hover:border-[var(--color-brand-royal)] hover:text-[var(--color-brand-royal)] transition"
              >
                Upgrade
              </Link>
            ) : (
              <span className="hidden md:inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-brand-royal)]">
                Premium active
              </span>
            )}
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-royal)] text-white text-sm font-semibold">
                {initials}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-medium text-[#1A1614] hover:bg-[#F5F2ED] transition"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-semibold text-[#0F1419]">
            {session?.user?.user_metadata?.full_name
              ? `Hi, ${session.user.user_metadata.full_name.split(" ")[0]}`
              : "Your workspace"}
          </h1>
          <p className="text-base text-[#6B6560] mt-1">
            Continue prepping exhibits or explore new automation tools.
          </p>
        </div>

        {/* Primary action - Create Exhibit Packet */}
        <section className="rounded-3xl border border-[#E5E0D8] bg-white p-8 shadow-sm hover:shadow-md transition">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📁</span>
                <h2 className="text-2xl font-semibold text-[#0F1419]">
                  Create Exhibit Packet
                </h2>
              </div>
              <p className="text-base text-[#1A1614] mb-4">
                Upload screenshots → auto-sort → Bates stamp → export judge-ready PDF.
              </p>
              <div className="flex items-center gap-3 text-sm text-[#6B6560]">
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {hasPremium ? "Unlimited exports" : `${exportsLeft} of ${exportsLimit} exports remaining`}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push("/builder")}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-royal)] px-8 py-4 text-base font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition shadow-sm"
            >
              Open Exhibit Builder
            </button>
          </div>
        </section>

        {/* Recent Matters */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#0F1419]">Recent Matters</h2>
            <div className="flex items-center rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm">
              <span className="mr-2 text-[#6B6560]">🔎</span>
              <input
                type="text"
                value={search}
                placeholder="Search matters"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setSearch(event.target.value)
                }
                className="w-full bg-transparent outline-none text-[#1A1614] placeholder:text-[#6B6560]"
              />
            </div>
          </div>

          <div className="space-y-5">
            {listMessage && (
              <div className="rounded-2xl border border-[#E5E0D8] bg-white px-4 py-3 text-sm text-[#6B6560]">
                {listMessage}
              </div>
            )}
            {filteredDocs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#E5E0D8] bg-white p-12 text-center">
                <p className="text-base font-semibold text-[#0F1419]">No exhibits yet</p>
                <p className="text-sm text-[#6B6560] mt-1">
                  Create your first exhibit packet to see it listed here.
                </p>
                <Link
                  href="/builder"
                  className="mt-4 inline-flex items-center rounded-full bg-[var(--color-brand-royal)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition"
                >
                  Create exhibit packet
                </Link>
              </div>
            ) : (
              <>
                {starredDocs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#0F1419]">Starred</h3>
                      <span className="text-xs text-[#6B6560]">{starredDocs.length} item(s)</span>
                    </div>
                    {starredDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="relative flex flex-col md:flex-row gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-6 hover:border-[var(--color-brand-royal)] transition"
                      >
                        <button
                          type="button"
                          onClick={() => toggleStar(doc.id, !doc.starred)}
                          className={`absolute right-4 top-4 text-xl ${
                            doc.starred ? "text-yellow-500" : "text-gray-300 hover:text-yellow-500"
                          }`}
                          aria-label={doc.starred ? "Unstar matter" : "Star matter"}
                        >
                          {doc.starred ? "★" : "☆"}
                        </button>
                        <div className="flex-1">
                          <Link
                            href={`/matters/${doc.id}`}
                            className="text-lg font-semibold text-[#0F1419] hover:text-[var(--color-brand-royal)] transition"
                          >
                            {doc.title}
                          </Link>
                          <p className="text-sm text-[#6B6560] mt-1">
                            Updated {doc.updated} · Owner {doc.owner}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {doc.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-[#E5E0D8] bg-[#F5F2ED] px-3 py-1 text-xs font-medium text-[#1A1614]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              doc.status === "Ready"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : doc.status === "Draft"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-blue-50 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {doc.status}
                          </span>
                          <Link
                            href={`/matters/${doc.id}`}
                            className="inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-3 py-1 text-xs font-semibold text-[#1A1614] hover:bg-[#F5F2ED] transition"
                          >
                            Open
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteMatter(doc.id)}
                            className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {unstarredDocs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#0F1419]">
                        {starredDocs.length > 0 ? "All matters" : "Matters"}
                      </h3>
                      <span className="text-xs text-[#6B6560]">{unstarredDocs.length} item(s)</span>
                    </div>
                    {unstarredDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="relative flex flex-col md:flex-row gap-4 rounded-2xl border border-[#E5E0D8] bg-white p-6 hover:border-[var(--color-brand-royal)] transition"
                      >
                        <button
                          type="button"
                          onClick={() => toggleStar(doc.id, !doc.starred)}
                          className={`absolute right-4 top-4 text-xl ${
                            doc.starred ? "text-yellow-500" : "text-gray-300 hover:text-yellow-500"
                          }`}
                          aria-label={doc.starred ? "Unstar matter" : "Star matter"}
                        >
                          {doc.starred ? "★" : "☆"}
                        </button>
                        <div className="flex-1">
                          <Link
                            href={`/matters/${doc.id}`}
                            className="text-lg font-semibold text-[#0F1419] hover:text-[var(--color-brand-royal)] transition"
                          >
                            {doc.title}
                          </Link>
                          <p className="text-sm text-[#6B6560] mt-1">
                            Updated {doc.updated} · Owner {doc.owner}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {doc.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-[#E5E0D8] bg-[#F5F2ED] px-3 py-1 text-xs font-medium text-[#1A1614]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              doc.status === "Ready"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : doc.status === "Draft"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-blue-50 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {doc.status}
                          </span>
                          <Link
                            href={`/matters/${doc.id}`}
                            className="inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-3 py-1 text-xs font-semibold text-[#1A1614] hover:bg-[#F5F2ED] transition"
                          >
                            Open
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteMatter(doc.id)}
                            className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* CaseReady Labs */}
        <section className="rounded-3xl border border-[#E5E0D8] bg-white p-6">
          <button
            type="button"
            onClick={() => setShowLabsExpanded(!showLabsExpanded)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-[#0F1419]">
                CaseReady Labs (Beta)
              </h3>
              <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-semibold border border-amber-200">
                Experimental
              </span>
            </div>
            <span className="text-[#6B6560] text-xl">
              {showLabsExpanded ? "−" : "+"}
            </span>
          </button>

          {showLabsExpanded && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  key={action.id}
                  href={action.href || "/coming-soon"}
                  className="group rounded-2xl border border-[#E5E0D8] bg-[#F5F2ED] p-5 hover:border-[var(--color-brand-royal)] transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded-full bg-white border border-[#E5E0D8] px-3 py-1 text-xs font-semibold text-[#1A1614]">
                      {action.badge}
                    </span>
                  </div>
                  <p className="text-base font-semibold text-[#0F1419] mb-1">
                    {action.title}
                  </p>
                  <p className="text-sm text-[#6B6560]">
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Account info */}
        <section className="rounded-3xl border border-[#E5E0D8] bg-white p-6">
          <h3 className="text-lg font-semibold text-[#0F1419] mb-4">Account</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#6B6560]">Email</span>
              <span className="font-medium text-[#1A1614]">{session?.user?.email || "Signed in user"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B6560]">Current plan</span>
              <span className="font-semibold text-[#0F1419]">{planLabel}</span>
            </div>
            <div className="pt-3 border-t border-[#F0EBE5]">
              {hasPremium ? (
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-full rounded-full bg-[var(--color-brand-royal)] px-6 py-3 text-sm font-semibold text-white"
                  disabled
                >
                  Premium active
                </button>
              ) : (
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center w-full rounded-full bg-[var(--color-brand-royal)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition"
                >
                  Upgrade to Premium
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
