"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/createBrowserSupabaseClient";

type Matter = {
  id: string;
  name: string;
  status: string | null;
  updated_at: string;
};

type Note = {
  id: string;
  matter_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type Task = {
  id: string;
  matter_id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  created_at: string;
};

type Exhibit = {
  id: string;
  matter_id: string;
  file_name: string;
  file_size: number;
  status: "uploaded" | "processing" | "ready";
  created_at: string;
};

export default function EvidenceWorkspacePage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();
  const [matters, setMatters] = useState<Matter[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatterId, setSelectedMatterId] = useState<string | "all">("all");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/signin?redirectedFrom=/workspace");
        return;
      }

      // Load all matters
      const { data: mattersData } = await supabase
        .from("matters")
        .select("id, name, status, updated_at")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false });

      if (mattersData) setMatters(mattersData);

      // Load all notes
      const { data: notesData } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false });

      if (notesData) setNotes(notesData);

      // Load all tasks
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (tasksData) setTasks(tasksData);

      // Load all exhibits
      const { data: exhibitsData } = await supabase
        .from("exhibits")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (exhibitsData) setExhibits(exhibitsData);

      setLoading(false);
    };

    loadData();
  }, [supabase, router]);

  const filteredNotes = selectedMatterId === "all"
    ? notes
    : notes.filter(n => n.matter_id === selectedMatterId);

  const filteredTasks = selectedMatterId === "all"
    ? tasks
    : tasks.filter(t => t.matter_id === selectedMatterId);

  const filteredExhibits = selectedMatterId === "all"
    ? exhibits
    : exhibits.filter(e => e.matter_id === selectedMatterId);

  const activeTasks = filteredTasks.filter(t => t.status !== "completed");

  const getMatterName = (matterId: string) => {
    return matters.find(m => m.id === matterId)?.name || "Unknown Matter";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F2ED] flex items-center justify-center">
        <p className="text-sm text-[#6B6560]">Loading workspace...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F2ED]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-2 border-b border-[#E5E0D8]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-brand-royal)] font-semibold">
              Evidence workspace
            </p>
            <h1 className="text-3xl font-semibold text-[#0F1419] tracking-tight mt-2">
              All matters at a glance
            </h1>
            <p className="text-sm text-[#6B6560] mt-2 max-w-2xl">
              View notes, tasks, and exhibits across all your matters. Click a matter to drill down.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-xs font-semibold text-[#1A1614] hover:bg-[#F5F2ED] transition"
            >
              ← Dashboard
            </Link>
            <Link
              href="/builder"
              className="inline-flex items-center rounded-full bg-[var(--color-brand-royal)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-brand-royal-hover)] transition"
            >
              Exhibit builder
            </Link>
          </div>
        </header>

        {/* Matter Filter */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setSelectedMatterId("all")}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              selectedMatterId === "all"
                ? "bg-[var(--color-brand-royal)] text-white"
                : "bg-white border border-[#E5E0D8] text-[#6B6560] hover:bg-[#F5F2ED]"
            }`}
          >
            All Matters ({matters.length})
          </button>
          {matters.map(matter => (
            <button
              key={matter.id}
              type="button"
              onClick={() => setSelectedMatterId(matter.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                selectedMatterId === matter.id
                  ? "bg-[var(--color-brand-royal)] text-white"
                  : "bg-white border border-[#E5E0D8] text-[#6B6560] hover:bg-[#F5F2ED]"
              }`}
            >
              {matter.name}
            </button>
          ))}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6560]">Matters</p>
              <svg className="w-5 h-5 text-[var(--color-brand-royal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-[#0F1419]">{matters.length}</p>
          </div>
          <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6560]">Notes</p>
              <svg className="w-5 h-5 text-[var(--color-brand-royal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-[#0F1419]">{filteredNotes.length}</p>
          </div>
          <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6560]">Active Tasks</p>
              <svg className="w-5 h-5 text-[var(--color-brand-royal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-[#0F1419]">{activeTasks.length}</p>
          </div>
          <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6560]">Exhibits</p>
              <svg className="w-5 h-5 text-[var(--color-brand-royal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-[#0F1419]">{filteredExhibits.length}</p>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] items-start">
          {/* Notes & Tasks */}
          <div className="space-y-6">
            {/* Recent Notes */}
            <div className="rounded-3xl border border-[#E5E0D8] bg-white p-8 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#0F1419] tracking-tight">
                  Recent Notes ({filteredNotes.length})
                </h2>
              </div>
              {filteredNotes.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto text-[#E5E0D8] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-semibold text-[#0F1419]">No notes yet</p>
                  <p className="text-xs text-[#6B6560] mt-1">Create notes in your matter workspaces</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredNotes.slice(0, 6).map((note) => (
                    <Link
                      key={note.id}
                      href={`/matters/${note.matter_id}`}
                      className="rounded-2xl border border-[#E5E0D8] bg-white hover:border-[#0A1F3F]/20 hover:shadow-sm transition-all duration-200 overflow-hidden group"
                    >
                      <div className="h-1 bg-gradient-to-r from-[var(--color-brand-royal)]/60 via-[var(--color-brand-royal)]/30 to-transparent" />
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-[#0F1419] tracking-tight line-clamp-1">{note.title}</p>
                        </div>
                        <p className="text-xs text-[#6B6560] line-clamp-2">{note.content}</p>
                        <div className="flex items-center justify-between text-[11px] text-[#6B6560]/70">
                          <span className="truncate">{getMatterName(note.matter_id)}</span>
                          <span>{formatTimeAgo(note.updated_at)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Active Tasks */}
            <div className="rounded-3xl border border-[#E5E0D8] bg-white p-8 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#0F1419] tracking-tight">
                  Active Tasks ({activeTasks.length})
                </h2>
              </div>
              {activeTasks.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto text-[#E5E0D8] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm font-semibold text-[#0F1419]">No active tasks</p>
                  <p className="text-xs text-[#6B6560] mt-1">Create tasks in your matter workspaces</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeTasks.slice(0, 8).map((task) => (
                    <Link
                      key={task.id}
                      href={`/matters/${task.matter_id}`}
                      className="rounded-2xl border border-[#E5E0D8] bg-white hover:border-[#0A1F3F]/20 hover:shadow-sm transition-all duration-200 overflow-hidden group"
                    >
                      <div className="h-1 bg-gradient-to-r from-[var(--color-brand-royal)]/60 via-[var(--color-brand-royal)]/30 to-transparent" />
                      <div className="p-4 space-y-2">
                        <p className="text-sm font-semibold text-[#0F1419] tracking-tight">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-[#6B6560] line-clamp-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            task.priority === "high" ? "bg-red-100 text-red-700" :
                            task.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {task.priority}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            task.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {task.status.replace("_", " ")}
                          </span>
                          <span className="text-xs text-[#6B6560] truncate">{getMatterName(task.matter_id)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Exhibits Status */}
          <div className="rounded-3xl border border-[#E5E0D8] bg-white p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#0F1419] tracking-tight">
                Exhibit Files ({filteredExhibits.length})
              </h2>
            </div>
            {filteredExhibits.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-[#E5E0D8] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-semibold text-[#0F1419]">No exhibits yet</p>
                <p className="text-xs text-[#6B6560] mt-1">Upload files through the Exhibit Builder</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExhibits.slice(0, 10).map((exhibit) => (
                  <Link
                    key={exhibit.id}
                    href={`/matters/${exhibit.matter_id}`}
                    className="rounded-2xl border border-[#E5E0D8] bg-white hover:border-[#0A1F3F]/20 hover:shadow-sm transition-all duration-200 overflow-hidden group"
                  >
                    <div className="h-1 bg-gradient-to-r from-[var(--color-brand-royal)]/60 via-[var(--color-brand-royal)]/30 to-transparent" />
                    <div className="flex items-center justify-between p-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0F1419] tracking-tight truncate">
                          {exhibit.file_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-[#6B6560]">{(exhibit.file_size / 1024 / 1024).toFixed(2)} MB</p>
                          <span className="text-xs text-[#6B6560] truncate">{getMatterName(exhibit.matter_id)}</span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ml-2 ${
                        exhibit.status === "ready" ? "bg-green-100 text-green-700" :
                        exhibit.status === "processing" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {exhibit.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
