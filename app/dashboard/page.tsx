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
  initialSession?: Session | null;
} = {}) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(initialSession || null);
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
  const [showCreateMatter, setShowCreateMatter] = useState(false);
  const [newMatterName, setNewMatterName] = useState("");

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

  // Load initial session if not provided
  useEffect(() => {
    if (!initialSession) {
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        if (currentSession) {
          setSession(currentSession);
        } else {
          router.replace("/signin?redirectedFrom=/dashboard");
        }
      });
    }
  }, [initialSession, router, supabase]);

  // Listen for auth changes
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

  const handleCreateMatter = async () => {
    if (!newMatterName.trim()) return;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) return;

    const { data, error } = await supabase
      .from("matters")
      .insert({
        user_id: sessionData.session.user.id,
        name: newMatterName.trim(),
        status: "draft",
      })
      .select()
      .single();

    if (!error && data) {
      // Navigate to the new matter's workspace
      router.push(`/matters/${data.id}`);
    } else {
      console.error("Error creating matter:", error);
      setListMessage(`Could not create matter. ${error?.message ?? ""}`);
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
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-12 space-y-8">
        {/* Welcome */}
        <div className="pb-2 border-b border-[#E5E0D8]">
          <h1 className="text-3xl font-semibold text-[#0F1419] tracking-tight">
            {session?.user?.user_metadata?.full_name
              ? `Welcome back, ${session.user.user_metadata.full_name.split(" ")[0]}`
              : "Your workspace"}
          </h1>
          <p className="text-sm text-[#6B6560] mt-2 flex items-center gap-2">
            <span>{documents.length} active {documents.length === 1 ? 'matter' : 'matters'}</span>
          </p>
        </div>

        {/* Primary action - Create Exhibit Packet */}
        <section className="rounded-3xl border-2 border-[#0A1F3F]/10 bg-gradient-to-br from-white via-white to-[#F7F1EA]/30 p-10 shadow-md hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">📁</span>
                <h2 className="text-2xl font-semibold text-[#0F1419] tracking-tight">
                  Create Exhibit Packet
                </h2>
              </div>
              <p className="text-base text-[#6B6560] mb-4 max-w-xl leading-relaxed">
                Upload exhibits, apply Bates stamps, and export court-ready PDFs with automatic formatting and indexing.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A1F3F]/5 border border-[#0A1F3F]/10">
                <svg className="w-4 h-4 text-[#0A1F3F]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                </svg>
                <span className="text-sm font-medium text-[#0A1F3F]">
                  {hasPremium ? "Unlimited exports" : `${exportsLeft} free exports remaining`}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push("/builder")}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-royal)] px-10 py-4 text-base font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition-all shadow-lg shadow-[var(--color-brand-royal)]/20 hover:shadow-xl hover:shadow-[var(--color-brand-royal)]/30 hover:-translate-y-0.5"
            >
              Open Exhibit Builder
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </section>

        {/* Recent Matters */}
        <section>
          <div className="flex items-center justify-between mb-6 gap-3">
            <h2 className="text-lg font-semibold text-[#0F1419] tracking-tight">Recent Matters</h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowCreateMatter(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-royal)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Matter
              </button>
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
                        className="rounded-2xl border border-[#E5E0D8] bg-white hover:border-[#0A1F3F]/20 hover:shadow-sm transition-all duration-200 overflow-hidden group"
                      >
                        {/* Header stripe */}
                        <div className="h-1 bg-gradient-to-r from-[var(--color-brand-royal)]/60 via-[var(--color-brand-royal)]/30 to-transparent" />

                        <div className="p-6">
                          {/* Title row */}
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <h3 className="text-lg font-semibold text-[#0F1419] tracking-tight leading-tight">
                              {doc.title}
                            </h3>
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                              doc.status === "Ready"
                                ? "bg-[#0A1F3F]/5 text-[#0A1F3F] border border-[#0A1F3F]/10"
                                : "bg-[#6B6560]/5 text-[#6B6560] border border-[#6B6560]/10"
                            }`}>
                              {doc.status === "Ready" ? "Ready" : "Draft"}
                            </span>
                          </div>

                          {/* Metadata grid */}
                          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4 pb-4 border-b border-[#E5E0D8]">
                            <div>
                              <dt className="text-xs uppercase tracking-wider text-[#6B6560]/80 font-medium mb-0.5">
                                Updated
                              </dt>
                              <dd className="text-[#0F1419] font-medium">
                                {doc.updated}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase tracking-wider text-[#6B6560]/80 font-medium mb-0.5">
                                Owner
                              </dt>
                              <dd className="text-[#0F1419] font-medium">
                                {doc.owner}
                              </dd>
                            </div>
                          </dl>

                          {/* Action row */}
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/matters/${doc.id}`}
                              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-royal)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition shadow-sm"
                            >
                              Open matter
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDeleteMatter(doc.id)}
                              className="inline-flex items-center gap-2 rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-medium text-[#6B6560] hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
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
                        className="rounded-2xl border border-[#E5E0D8] bg-white hover:border-[#0A1F3F]/20 hover:shadow-sm transition-all duration-200 overflow-hidden group"
                      >
                        {/* Header stripe */}
                        <div className="h-1 bg-gradient-to-r from-[var(--color-brand-royal)]/60 via-[var(--color-brand-royal)]/30 to-transparent" />

                        <div className="p-6">
                          {/* Title row */}
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <h3 className="text-lg font-semibold text-[#0F1419] tracking-tight leading-tight">
                              {doc.title}
                            </h3>
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                              doc.status === "Ready"
                                ? "bg-[#0A1F3F]/5 text-[#0A1F3F] border border-[#0A1F3F]/10"
                                : "bg-[#6B6560]/5 text-[#6B6560] border border-[#6B6560]/10"
                            }`}>
                              {doc.status === "Ready" ? "Ready" : "Draft"}
                            </span>
                          </div>

                          {/* Metadata grid */}
                          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4 pb-4 border-b border-[#E5E0D8]">
                            <div>
                              <dt className="text-xs uppercase tracking-wider text-[#6B6560]/80 font-medium mb-0.5">
                                Updated
                              </dt>
                              <dd className="text-[#0F1419] font-medium">
                                {doc.updated}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase tracking-wider text-[#6B6560]/80 font-medium mb-0.5">
                                Owner
                              </dt>
                              <dd className="text-[#0F1419] font-medium">
                                {doc.owner}
                              </dd>
                            </div>
                          </dl>

                          {/* Action row */}
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/matters/${doc.id}`}
                              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-royal)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition shadow-sm"
                            >
                              Open matter
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDeleteMatter(doc.id)}
                              className="inline-flex items-center gap-2 rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-medium text-[#6B6560] hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
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
        <section className="rounded-3xl border border-[#E5E0D8] bg-white p-8 hover:shadow-sm transition-shadow">
          <button
            type="button"
            onClick={() => setShowLabsExpanded(!showLabsExpanded)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-brand-royal)]/5 border border-[var(--color-brand-royal)]/10 group-hover:bg-[var(--color-brand-royal)]/10 transition">
                <svg className="w-5 h-5 text-[var(--color-brand-royal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-[#0F1419] tracking-tight">
                  CaseReady Labs
                </h3>
                <p className="text-xs text-[#6B6560] mt-0.5">
                  Early access features
                </p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-[#6B6560] transition-transform ${showLabsExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showLabsExpanded && (
            <>
              <div className="mt-6 mb-5 p-4 rounded-2xl bg-[#0A1F3F]/[0.02] border border-[#0A1F3F]/5">
                <p className="text-xs text-[#6B6560] leading-relaxed">
                  These tools are production-ready but actively refined based on attorney feedback.
                  Your data remains secure and never used for training.
                </p>
              </div>

              <div className="space-y-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.id}
                    href={action.href || "/coming-soon"}
                    className="block rounded-2xl border border-[#E5E0D8] bg-white p-5 hover:border-[var(--color-brand-royal)]/30 hover:bg-[#F7F1EA]/30 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-base font-semibold text-[#0F1419] mb-1 group-hover:text-[var(--color-brand-royal)] transition tracking-tight">
                          {action.title}
                        </h4>
                        <p className="text-sm text-[#6B6560] leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-[#E5E0D8] group-hover:text-[var(--color-brand-royal)] transition flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Account info */}
        <section className="rounded-3xl border border-[#E5E0D8] bg-white p-8">
          <h3 className="text-lg font-semibold text-[#0F1419] tracking-tight mb-4">Account</h3>
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

      {/* Create New Matter Modal */}
      {showCreateMatter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-[#E5E0D8] shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[#0F1419] tracking-tight">Create New Matter</h3>
              <button
                type="button"
                onClick={() => {
                  setShowCreateMatter(false);
                  setNewMatterName("");
                }}
                className="text-[#6B6560] hover:text-[#0F1419] transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="matter-name" className="block text-sm font-medium text-[#0F1419] mb-2">
                  Matter Name
                </label>
                <input
                  id="matter-name"
                  type="text"
                  value={newMatterName}
                  onChange={(e) => setNewMatterName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newMatterName.trim()) {
                      handleCreateMatter();
                    }
                  }}
                  placeholder="e.g., Smith v. Johnson"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E0D8] bg-white text-[#0F1419] placeholder:text-[#6B6560] focus:outline-none focus:border-[var(--color-brand-royal)] focus:ring-2 focus:ring-[var(--color-brand-royal)]/20 transition"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCreateMatter}
                  disabled={!newMatterName.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-brand-royal)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Matter
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateMatter(false);
                    setNewMatterName("");
                  }}
                  className="px-6 py-3 rounded-full border border-[#E5E0D8] bg-white text-sm font-medium text-[#6B6560] hover:bg-[#F5F2ED] transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
