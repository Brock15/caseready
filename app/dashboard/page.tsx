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

const COMING_SOON_FEATURES = new Set(["timeline", "redact", "chat", "portal"]);

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
    href: "/redact",
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

const sidebarNav = [
  { id: "home", label: "Home", href: "/" },
  { id: "exhibits", label: "Exhibits", href: "/dashboard" },
  { id: "pricing", label: "Pricing", href: "/pricing" },
  { id: "account", label: "Account", href: "/dashboard#account" },
];

const sharedSeed = [
  { id: "share-1", name: "Northwind breach", owner: "A. Patel", access: "Editor" },
  { id: "share-2", name: "Foltz exhibits", owner: "C. Lawson", access: "Viewer" },
];

type ViewMode = "list" | "grid";

export default function DashboardClient({
  initialSession,
}: {
  initialSession: Session;
}) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(initialSession);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [activeFilter, setActiveFilter] = useState<"all" | "starred">("all");
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
  const [shared] = useState(sharedSeed);
  const [showPlans, setShowPlans] = useState(false);
  const [speedMode, setSpeedMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [labsToggles, setLabsToggles] = useState<Record<string, boolean>>({});
  const [loadingMatters, setLoadingMatters] = useState(false);
  const plan = String(session?.user?.user_metadata?.plan ?? "").toLowerCase();
const hasPremium =
  plan === "premium" ||
  session?.user?.user_metadata?.premiumAccess === true ||
  session?.user?.user_metadata?.hasUnlimitedExports === true ||
  session?.user?.email === "brockstar1215@gmail.com";
  const exportsUsed = Number(session?.user?.user_metadata?.exportsUsed ?? 0);
  const exportsLimit = 2;
  const exportsLeft = Math.max(0, exportsLimit - exportsUsed);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedFocus = localStorage.getItem("caseready:focusMode");
      if (savedFocus === "on") {
        setFocusMode(true);
      }
      const savedSpeed = localStorage.getItem("caseready:speedMode");
      if (savedSpeed === "on") {
        setSpeedMode(true);
      }
      const savedLabs = localStorage.getItem("caseready:labsToggles");
      if (savedLabs) {
        try {
          const parsed = JSON.parse(savedLabs);
          if (parsed && typeof parsed === "object") {
            setLabsToggles(parsed);
          }
        } catch {
          // ignore parse errors
        }
      }
    }

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
    if (typeof window === "undefined") return;
    localStorage.setItem("caseready:focusMode", focusMode ? "on" : "off");
    document.documentElement.dataset.focusMode = focusMode ? "true" : "false";
    window.dispatchEvent(
      new CustomEvent("caseready:focusModeChange", { detail: { value: focusMode } })
    );
  }, [focusMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("caseready:speedMode", speedMode ? "on" : "off");
  }, [speedMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("caseready:labsToggles", JSON.stringify(labsToggles));
  }, [labsToggles]);

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

  const filteredDocs = documents
    .filter((doc) => {
      if (activeFilter === "starred" && !doc.starred) return false;
      if (!search.trim()) return true;
      const target = `${doc.title} ${doc.tags.join(" ")}`.toLowerCase();
      return target.includes(search.toLowerCase());
    })
    .slice(0, speedMode ? 2 : documents.length);

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
    <div
      className={`min-h-screen flex ${
        focusMode ? "bg-[#020617] text-gray-100" : "bg-[#F6F7FB] text-gray-900"
      }`}
    >
      <aside
        className={`hidden lg:flex lg:w-64 xl:w-72 flex-col border-r border-black/5 ${
          focusMode ? "bg-[#0B1220]" : "bg-white/70"
        } backdrop-blur-sm`}
      >
        <div className="p-6 flex items-center gap-3">
          <div
            className={`h-12 w-12 rounded-2xl shadow flex items-center justify-center border ${
              focusMode ? "bg-[#111827] border-slate-800" : "bg-white border-gray-100"
            }`}
          >
            <NextImage src="/logo.svg" alt="CaseReady logo" width={40} height={40} />
          </div>
          <div>
            <p className={`text-sm font-semibold ${focusMode ? "text-white" : "text-gray-900"}`}>
              CaseReady
            </p>
            <p className={`text-xs ${focusMode ? "text-gray-400" : "text-gray-500"}`}>
              Beta dashboard
            </p>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-2">
          <div className="space-y-1">
            {sidebarNav.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                  focusMode
                    ? "text-gray-300 hover:bg-[#1E293B] hover:text-white"
                    : "text-gray-700 hover:bg-[#E9EFFD] hover:text-[#0F2F8F]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#0056D6]/60" />
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-3 rounded-2xl border border-black/5 bg-black/5 px-3 py-2 text-xs font-semibold text-gray-600 flex items-center justify-between">
            <span>CaseReady Labs</span>
            <span className="rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-[10px] uppercase tracking-wide">
              Beta
            </span>
          </div>
          <div className="space-y-1">
            {quickActions.map((item) => (
              <Link
                key={item.id}
                href="/coming-soon"
                className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                  focusMode
                    ? "text-gray-400 hover:bg-[#1E293B] hover:text-white"
                    : "text-gray-500 hover:bg-[#E9EFFD] hover:text-[#0F2F8F]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gray-400/60" />
                  {item.title}
                </span>
                <span className="rounded-full bg-gray-200 text-gray-700 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                  {item.badge}
                </span>
              </Link>
            ))}
          </div>
        </nav>
        <div className="mt-auto p-4 space-y-4">
          <div
            className={`rounded-2xl border p-4 text-sm ${
              focusMode
                ? "border-slate-700 bg-[#0F172A] text-slate-200"
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            <p
              className={`text-xs uppercase tracking-wide font-semibold ${
                focusMode ? "text-[#7DD3FC]" : "text-[#0056D6]"
              }`}
            >
              Exports
            </p>
            <div
              className={`mt-2 h-2 w-full rounded-full ${
                focusMode ? "bg-slate-800" : "bg-gray-100"
              }`}
            >
              <div
                className={`h-full rounded-full bg-gradient-to-r from-[#3FA9FF] to-[#0056D6] ${hasPremium ? "w-full" : ""}`}
                style={!hasPremium ? { width: `${Math.min(100, (exportsLeft / exportsLimit) * 100)}%` } : undefined}
              />
            </div>
            <p className={`mt-1 text-xs ${focusMode ? "text-gray-400" : "text-gray-500"}`}>
              {hasPremium
                ? "Unlimited exports on your plan."
                : `${exportsLeft} of ${exportsLimit} exports remaining`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className={`w-full rounded-full border px-4 py-2 text-sm font-semibold ${
              focusMode
                ? "border-slate-700 bg-[#0F172A] text-gray-100 hover:bg-[#111C2E]"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-10 py-6 space-y-8">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p
                className={`text-xs uppercase tracking-[0.3em] font-semibold ${
                  focusMode ? "text-[#7DD3FC]" : "text-[#0056D6]"
                }`}
              >
                Welcome back
              </p>
              <h1 className={`text-2xl sm:text-3xl font-semibold ${focusMode ? "text-white" : ""}`}>
                {session?.user?.user_metadata?.full_name
                  ? `Hi, ${session.user.user_metadata.full_name.split(" ")[0]}`
                  : "Your workspace"}
              </h1>
              <p className={`text-sm ${focusMode ? "text-gray-400" : "text-gray-500"}`}>
                Continue prepping exhibits or explore new automation tools.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0056D6] text-white text-sm font-semibold">
                {initials}
              </span>
            </div>
          </header>

          <section
            className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm hover:shadow-md transition"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0056D6]">Primary</p>
                <h2 className="text-xl font-semibold text-gray-900">📁 Create Exhibit Packet</h2>
                <p className="text-sm text-gray-600">
                  Upload screenshots → auto-sort → Bates stamp → export judge-ready PDF.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  router.push("/builder");
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#0056D6] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
              >
                Open Exhibit Builder
              </button>
            </div>
          </section>

          <section
            className={`rounded-3xl border border-gray-200 p-5 shadow-sm ${
              focusMode ? "bg-[#0B1220] text-gray-100" : "bg-white/80 text-gray-900"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-sm font-semibold ${focusMode ? "text-white" : "text-gray-900"}`}>
                  CaseReady Labs — Experimental Tools
                </h3>
                <p className={`text-xs ${focusMode ? "text-gray-400" : "text-gray-600"}`}>
                  Preview features in development. These will redirect to a coming-soon page.
                </p>
              </div>
              <span className="rounded-full bg-gray-200 text-gray-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                Beta
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => (
                <div
                  key={action.id}
                  className="group relative flex flex-col items-start rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left transition hover:border-[#0056D6]/40"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="rounded-full bg-gray-200 text-gray-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      {action.badge}
                    </span>
                    <label className="inline-flex items-center gap-2 text-[11px] font-semibold text-gray-600">
                      <span>Enable</span>
                      <button
                        type="button"
                        onClick={() =>
                          setLabsToggles((prev) => ({
                            ...prev,
                            [action.id]: !prev[action.id],
                          }))
                        }
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${
                          labsToggles[action.id]
                            ? "bg-[#0056D6]"
                            : "bg-gray-300"
                        }`}
                        aria-label={`Toggle ${action.title}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                            labsToggles[action.id] ? "translate-x-5" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </label>
                  </div>
                  <p
                    className={`mt-2 text-base font-semibold ${
                      labsToggles[action.id] ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {action.title}
                  </p>
                  <p className={`mt-1 text-sm ${labsToggles[action.id] ? "text-gray-700" : "text-gray-500/80"}`}>
                    {action.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => labsToggles[action.id] && router.push(action.href || "/coming-soon")}
                    disabled={!labsToggles[action.id]}
                    className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                      labsToggles[action.id]
                        ? "bg-[#0056D6] text-white shadow-sm hover:brightness-110"
                        : "bg-gray-200 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    {labsToggles[action.id] ? "Open beta tool" : "Enable to open"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div
              className={`rounded-3xl border p-5 shadow-sm ${
                focusMode ? "border-slate-800 bg-[#0B1220]/90 text-gray-100" : "border-gray-200 bg-white/80"
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div
                  className={`flex flex-wrap items-center gap-2 text-xs font-semibold ${
                    focusMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  <button
                    className={`rounded-full border px-3 py-1 ${
                      activeFilter === "all"
                        ? "border-[#3FA9FF] bg-[#EEF2FF] text-[#0056D6]"
                        : focusMode
                        ? "border-slate-700 bg-[#111C2E]"
                        : "border-gray-200 bg-white"
                    }`}
                    onClick={() => setActiveFilter("all")}
                  >
                    All
                  </button>
                  <button
                    className={`rounded-full border px-3 py-1 ${
                      activeFilter === "starred"
                        ? "border-[#3FA9FF] bg-[#EEF2FF] text-[#0056D6]"
                        : focusMode
                        ? "border-slate-700 bg-[#111C2E]"
                        : "border-gray-200 bg-white"
                    }`}
                    onClick={() => setActiveFilter("starred")}
                  >
                    Starred
                  </button>
                  <button className="rounded-full border border-gray-200 bg-white px-3 py-1">
                    Icon view
                  </button>
                </div>
                <div
                  className={`flex w-full max-w-xs items-center rounded-full border px-3 py-1.5 text-sm ${
                    focusMode
                      ? "border-slate-700 bg-[#0F172A] text-gray-200"
                      : "border-gray-200 bg-white text-gray-600"
                  }`}
                >
                  <span className={`mr-2 ${focusMode ? "text-gray-400" : "text-gray-400"}`}>
                    🔎
                  </span>
                  <input
                    type="text"
                    value={search}
                    placeholder="Search matters"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setSearch(event.target.value)
                    }
                    className={`w-full bg-transparent outline-none ${
                      focusMode ? "placeholder:text-gray-500" : "placeholder:text-gray-400"
                    }`}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {listMessage && (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-xs ${
                      focusMode
                        ? "border-slate-700 bg-[#0F172A]/60 text-gray-300"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}
                  >
                    {listMessage}
                  </div>
                )}
                {filteredDocs.length === 0 ? (
                  <div
                    key="empty-state"
                    className={`rounded-2xl border border-dashed p-6 text-center ${
                      focusMode
                        ? "text-gray-400 border-slate-700 bg-[#0F172A]/60"
                        : "text-gray-500 border-gray-200 bg-white/70"
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900">No exhibits yet</p>
                    <p className="text-xs mt-1 text-gray-500">
                      Create your first exhibit packet to see it listed here.
                    </p>
                    <Link
                      href="/builder"
                      className="mt-3 inline-flex items-center rounded-full bg-[#0056D6] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110"
                    >
                      Create exhibit packet
                    </Link>
                  </div>
                ) : (
                  filteredDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className={`relative flex flex-col gap-3 rounded-2xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
                        focusMode
                          ? "border-slate-800 bg-[#0F172A]"
                          : "border-gray-100 bg-white"
                      } hover:border-[#0056D6]/40 transition`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleStar(doc.id, !doc.starred)}
                        className={`absolute right-3 top-2 text-lg ${
                          doc.starred ? "text-yellow-500" : "text-gray-300 hover:text-yellow-500"
                        }`}
                        aria-label={doc.starred ? "Unstar matter" : "Star matter"}
                      >
                        {doc.starred ? "★" : "☆"}
                      </button>
                      <div>
                        <Link
                          href={`/matters/${doc.id}`}
                          className={`text-base font-semibold ${
                            focusMode ? "text-white" : "text-gray-900"
                          } hover:underline`}
                        >
                          {doc.title}
                        </Link>
                        <p className={`text-xs ${focusMode ? "text-gray-400" : "text-gray-500"}`}>
                          Updated {doc.updated} · Owner {doc.owner}
                        </p>
                        <div
                          className={`mt-2 flex flex-wrap gap-2 text-[11px] font-medium ${
                            focusMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {doc.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`rounded-full border px-2 py-0.5 ${
                                focusMode
                                  ? "border-slate-700 bg-[#111C2E]"
                                  : "border-gray-200 bg-gray-50"
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pt-6 sm:pt-0">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            doc.status === "Ready"
                              ? "bg-green-100 text-green-700"
                              : doc.status === "Draft"
                              ? "bg-amber-100 text-amber-800"
                              : focusMode
                              ? "bg-blue-900 text-blue-100"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {doc.status}
                        </span>
                        <Link
                          href={`/matters/${doc.id}`}
                          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Open
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteMatter(doc.id)}
                          className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4" id="stealth">
              <div
                className={`rounded-3xl border p-5 shadow-sm ${
                  focusMode ? "border-slate-800 bg-[#0B1220] text-gray-100" : "border-gray-200 bg-white/80 text-gray-700"
                }`}
              >
                <h3 className={`text-sm font-semibold ${focusMode ? "text-white" : "text-gray-900"}`}>
                  Shared with me
                </h3>
                <div
                  className={`mt-3 space-y-3 text-sm ${
                    focusMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {shared.length ? (
                    shared.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl border px-4 py-3 ${
                          focusMode
                            ? "border-slate-800 bg-[#111C2E]"
                            : "border-gray-100 bg-white"
                        }`}
                      >
                        <p className={`font-semibold ${focusMode ? "text-white" : "text-gray-900"}`}>
                          {item.name}
                        </p>
                        <p className={`text-xs ${focusMode ? "text-gray-400" : "text-gray-500"}`}>
                          {item.owner} · {item.access}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className={`text-xs ${focusMode ? "text-gray-400" : "text-gray-500"}`}>
                      No shared matters yet.
                    </p>
                  )}
                </div>
              </div>
              <div
                id="portal"
                className={`rounded-3xl border p-5 text-sm shadow-sm ${
                  focusMode ? "border-slate-800 bg-[#0F172A] text-gray-100" : "border-gray-200 bg-white/90 text-gray-700"
                }`}
              >
                <p className="text-sm font-semibold">Client portal preview</p>
                <p className={`text-xs mt-1 ${focusMode ? "text-gray-400" : "text-gray-500"}`}>
                  Send clients a secure link to drop photos, docs, and receive exhibit PDFs.
                </p>
                <ul className="mt-3 space-y-1 text-xs">
                  <li>• One-click secure uploads</li>
                  <li>• Status tracking per matter</li>
                  <li>• Optional watermarking</li>
                </ul>
              </div>
              <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-[#3FA9FF] to-[#0056D6] p-5 text-white shadow-sm">
                <p className="text-sm font-semibold">Need more exports?</p>
                <p className="text-xs text-white/80">
                  Upgrade to unlock unlimited matters, timeline builder, and AI
                  summaries.
                </p>
                <Link
                  href="/pricing"
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white hover:bg-white/25"
                >
                  View plans
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
      {showPlans && (
        <div
          className={`fixed inset-0 z-40 flex items-center justify-center px-4 ${
            focusMode ? "bg-black/70" : "bg-black/40"
          }`}
        >
          <div
            className={`w-full max-w-2xl rounded-3xl border p-6 shadow-xl ${
              focusMode ? "border-slate-800 bg-[#0B1220] text-gray-100" : "border-blue-100 bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className={`text-xs uppercase tracking-[0.3em] font-semibold ${
                    focusMode ? "text-[#7DD3FC]" : "text-[#0056D6]"
                  }`}
                >
                  Upgrade to unlock
                </p>
                <h2
                  className={`text-2xl font-semibold mt-1 ${
                    focusMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Timeline builder, chat, and stealth tools
                </h2>
                <p className={`text-sm mt-2 ${focusMode ? "text-gray-300" : "text-gray-600"}`}>
                  Jump to the founders plans or keep exploring the free exhibit generator.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPlans(false)}
                className={`text-gray-400 hover:text-gray-600 ${
                  focusMode ? "text-gray-500 hover:text-gray-300" : ""
                }`}
              >
                ✕
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
              <div
                className={`rounded-2xl border p-4 ${
                  focusMode
                    ? "border-slate-800 bg-[#0F172A] text-gray-100"
                    : "border-gray-200 bg-gray-50 text-gray-600"
                }`}
              >
                <p className={`text-xs font-semibold uppercase ${focusMode ? "text-gray-400" : "text-gray-500"}`}>
                  Free plan
                </p>
                <p className={`text-2xl font-semibold mt-1 ${focusMode ? "text-white" : "text-gray-900"}`}>
                  $0
                </p>
                <p className={`text-xs ${focusMode ? "text-gray-400" : "text-gray-500"}`}>
                  2 exhibit exports
                </p>
                <ul className="mt-4 space-y-2">
                  <li>✔ Exhibit generator</li>
                  <li>✔ Bates stamping</li>
                  <li>✔ Auto-rotate images</li>
                  <li>— Premium actions locked</li>
                </ul>
              </div>
              <div
                className={`rounded-2xl border p-4 shadow-sm ${
                  focusMode
                    ? "border-blue-500 bg-[#111C2E] text-gray-100"
                    : "border-[#0056D6] bg-white text-gray-600"
                }`}
              >
                <p className={`text-xs font-semibold uppercase ${focusMode ? "text-[#7DD3FC]" : "text-[#0056D6]"}`}>
                  Founding launch
                </p>
                <p className={`text-2xl font-semibold mt-1 ${focusMode ? "text-white" : "text-gray-900"}`}>
                  $29
                </p>
                <p className={`text-xs ${focusMode ? "text-gray-400" : "text-gray-500"}`}>
                  Unlimited exhibits + AI tools
                </p>
                <ul className="mt-4 space-y-2">
                  <li>✔ Unlimited document runs</li>
                  <li>✔ Timeline builder & chat</li>
                  <li>✔ Redaction + portal</li>
                  <li>✔ AI summaries & OCR</li>
                </ul>
                <Link
                  href="/pricing"
                  className={`mt-4 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold ${
                    focusMode ? "bg-[#3FA9FF] text-[#0B1220] hover:brightness-110" : "bg-[#0056D6] text-white hover:brightness-110"
                  }`}
                >
                  View detailed plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
