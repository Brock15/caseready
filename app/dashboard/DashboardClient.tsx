"use client";

import Link from "next/link";
import NextImage from "next/image";
import { useMemo, useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/createBrowserSupabaseClient";
import type { Session } from "@supabase/supabase-js";

type QuickAction = {
  id: string;
  label: string;
  title: string;
  description: string;
  colors: string;
  href?: string;
  premium?: boolean;
};

const quickActions: QuickAction[] = [
  {
    id: "prepare",
    label: "Prepare",
    title: "Draft Exhibit",
    description: "Merge, label, and Bates stamp in minutes.",
    colors: "from-[#3FA9FF] via-[#4D7CFE] to-[#1D3EAF]",
  },
  {
    id: "timeline",
    label: "Timeline",
    title: "Build Timeline",
    description: "Drop events to build courtroom timelines.",
    colors: "from-[#FF9A5E] via-[#FF6F6F] to-[#E348A2]",
    premium: true,
  },
  {
    id: "chat",
    label: "Notes",
    title: "Evidence Chat",
    description: "Summaries, memos, and tasking assistants.",
    colors: "from-[#FFB5D2] via-[#F383F1] to-[#BC6CFF]",
    premium: true,
  },
  {
    id: "stealth",
    label: "Redact",
    title: "Stealth Mode",
    description: "Batch redaction & upload-ready prep.",
    colors: "from-[#CAB5FF] via-[#A48AFF] to-[#6752FF]",
    href: "/stealth",
    premium: true,
  },
];

const sidebarNav = [
  { id: "generator", label: "PDF Generator", href: "/" },
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "timeline", label: "Timelines", href: "/dashboard#timeline-tools" },
  { id: "redactions", label: "Redactions", href: "/dashboard#stealth" },
  { id: "portal", label: "Client Portal", href: "/dashboard#portal" },
];

const documentsSeed = [
  {
    id: "doc-1",
    title: "Acme v. Smith - Hearing Prep",
    updated: "2 hours ago",
    owner: "You",
    status: "Draft",
    tags: ["PDF", "12 exhibits"],
  },
  {
    id: "doc-2",
    title: "Mendez - Deposition bundle",
    updated: "Yesterday",
    owner: "You",
    status: "Ready",
    tags: ["Images", "34 files"],
  },
  {
    id: "doc-3",
    title: "AlphaCo timeline",
    updated: "Nov 10",
    owner: "Shared",
    status: "In Review",
    tags: ["Timeline", "Client"],
  },
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
  const [documents] = useState(documentsSeed);
  const [shared] = useState(sharedSeed);
  const [showPlans, setShowPlans] = useState(false);
  const [speedMode, setSpeedMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const plan = String(session?.user?.user_metadata?.plan ?? "").toLowerCase();
  const hasPremium =
    plan === "premium" ||
    session?.user?.user_metadata?.premiumAccess === true ||
    session?.user?.user_metadata?.hasUnlimitedExports === true ||
    session?.user?.email === "brockstar1215@gmail.com";

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/signin");
  };

  const filteredDocs = documents
    .filter((doc) => {
      if (activeFilter === "starred" && doc.status !== "Ready") return false;
      if (!search.trim()) return true;
      const target = `${doc.title} ${doc.tags.join(" ")}`.toLowerCase();
      return target.includes(search.toLowerCase());
    })
    .slice(0, speedMode ? 2 : documents.length);

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
        <nav className="flex-1 px-3 space-y-1">
          {sidebarNav.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                focusMode
                  ? "text-gray-300 hover:bg-[#1E293B] hover:text-white"
                  : "text-gray-600 hover:bg-[#EEF2FF] hover:text-[#1F3BB3]"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-[#0056D6]/40" />
              {item.label}
            </Link>
          ))}
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
              Daily credits
            </p>
            <div
              className={`mt-2 h-2 w-full rounded-full ${
                focusMode ? "bg-slate-800" : "bg-gray-100"
              }`}
            >
              <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#3FA9FF] to-[#0056D6]" />
            </div>
            <p className={`mt-1 text-xs ${focusMode ? "text-gray-400" : "text-gray-500"}`}>
              7/10 available
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
              <button
                type="button"
                onClick={() => setSpeedMode((prev) => !prev)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  speedMode
                    ? "border-[#3FA9FF] bg-[#EEF2FF] text-[#0056D6]"
                    : focusMode
                    ? "border-slate-700 bg-[#0F172A] text-gray-200"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                ⚡ Speed mode
              </button>
              <button
                type="button"
                onClick={() => setFocusMode((prev) => !prev)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  focusMode
                    ? "border-[#111827] bg-[#111827] text-white"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                🌙 Focus
              </button>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0056D6] text-white text-sm font-semibold">
                {initials}
              </span>
            </div>
          </header>

          <section
            id="timeline-tools"
            className={`rounded-3xl border border-blue-100 p-5 shadow-sm ${
              focusMode ? "bg-[#0F172A] text-white" : "bg-white/80 text-gray-900"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2
                className={`text-lg font-semibold ${
                  focusMode ? "text-white" : "text-gray-900"
                }`}
              >
                Quick actions
              </h2>
              {speedMode && (
                <p className="text-xs uppercase tracking-wide text-white/70">
                  Speed mode showing top actions
                </p>
              )}
            </div>
            <div
              className={`grid gap-4 ${
                speedMode ? "md:grid-cols-1 xl:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-4"
              }`}
            >
              {quickActions.map((action, index) => {
                if (speedMode && index > 1) return null;
                const isLocked = action.premium && !hasPremium;
                const cardClasses = `relative rounded-2xl bg-gradient-to-br ${action.colors} text-left text-white p-4 shadow-sm hover:scale-[1.02] transition`;
                const content = (
                  <>
                    {action.premium && (
                      <span className="absolute right-3 top-3 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Premium
                      </span>
                    )}
                    <p className="text-xs uppercase tracking-wide font-semibold">
                      {action.label}
                    </p>
                    <p className="mt-2 text-xl font-bold">{action.title}</p>
                    <p className="mt-1 text-sm opacity-90">{action.description}</p>
                    {isLocked && (
                      <span className="mt-3 inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold text-white">
                        Upgrade to unlock
                      </span>
                    )}
                  </>
                );

                if (isLocked) {
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => setShowPlans(true)}
                      className={cardClasses}
                    >
                      {content}
                    </button>
                  );
                }

                const handleActionClick = () => {
                  if (typeof window === "undefined") return;
                  if (action.id === "prepare") {
                    if (window.location.pathname === "/") {
                      const target = document.getElementById("drop-zone");
                      target?.scrollIntoView({ behavior: "smooth", block: "start" });
                    } else {
                      router.push("/#drop-zone");
                    }
                  } else if (action.href) {
                    router.push(action.href);
                  }
                };

                return (
                  <button
                    key={action.id}
                    className={cardClasses}
                    type="button"
                    onClick={handleActionClick}
                  >
                    {content}
                  </button>
                );
              })}
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
                  {filteredDocs.length === 0 ? (
                    <p
                      className={`text-sm border border-dashed rounded-2xl p-6 text-center ${
                        focusMode
                          ? "text-gray-400 border-slate-700 bg-[#0F172A]/60"
                          : "text-gray-500 border-gray-200"
                      }`}
                    >
                      No documents found. Upload exhibits or search again.
                    </p>
                  ) : (
                  filteredDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
                        focusMode
                          ? "border-slate-800 bg-[#0F172A]"
                          : "border-gray-100 bg-white"
                      }`}
                    >
                      <div>
                        <p
                          className={`text-base font-semibold ${
                            focusMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {doc.title}
                        </p>
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
                      <div className="flex items-center gap-3">
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
                        <button className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                          Open
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
