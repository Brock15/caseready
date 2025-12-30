"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/createBrowserSupabaseClient";
import {
  FormatOptions,
  FormatPreset,
  mergeOptionsWithDefaults,
  normalizePreset,
} from "@/lib/formatting";
import { getUserPlan, type UserPlan } from "@/lib/userPlan";

type Matter = {
  id: string;
  name: string;
  pdf_url: string | null;
  status: string | null;
  pages: number | null;
  created_at: string;
  updated_at: string;
  format_preset?: FormatPreset | null;
  format_options?: Partial<FormatOptions> | null;
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
  file_url: string;
  file_size: number;
  status: "uploaded" | "processing" | "ready";
  created_at: string;
};

type TabType = "overview" | "notes" | "tasks" | "exhibits";

export default function MatterDetailPage() {
  const supabase = createBrowserSupabaseClient();
  const params = useParams();
  const router = useRouter();
  const [matter, setMatter] = useState<Matter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [downloadHref, setDownloadHref] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan>("free");
  const matterId = params?.id as string;

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all");

  // Exhibits state
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);

  useEffect(() => {
    const fetchMatter = async () => {
      try {
        setLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          router.replace("/signin?redirectedFrom=/matters/" + matterId);
          return;
        }
        setUserPlan(getUserPlan(session.user));
        const { data, error: fetchError } = await supabase
          .from("matters")
          .select("*")
          .eq("id", matterId)
          .eq("user_id", session.user.id)
          .single();
        if (fetchError || !data) {
          setError("Matter not found.");
          return;
        }
        const m = data as Matter;
        setMatter(m);
        setNameInput(m.name || "");
        if (m.pdf_url) {
          if (m.pdf_url.startsWith("http")) {
            setDownloadHref(m.pdf_url);
          } else {
            const { data: signed } = await supabase.storage
              .from("exhibits")
              .createSignedUrl(m.pdf_url, 60 * 60);
            if (signed?.signedUrl) setDownloadHref(signed.signedUrl);
          }
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load matter.");
      } finally {
        setLoading(false);
      }
    };
    fetchMatter();
  }, [matterId, supabase, router]);

  // Load notes
  useEffect(() => {
    const loadNotes = async () => {
      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("matter_id", matterId)
        .order("updated_at", { ascending: false });
      if (data) setNotes(data);
    };
    if (matterId) loadNotes();
  }, [matterId, supabase]);

  // Load tasks
  useEffect(() => {
    const loadTasks = async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("matter_id", matterId)
        .order("created_at", { ascending: false });
      if (data) setTasks(data);
    };
    if (matterId) loadTasks();
  }, [matterId, supabase]);

  // Load exhibits
  useEffect(() => {
    const loadExhibits = async () => {
      const { data } = await supabase
        .from("exhibits")
        .select("*")
        .eq("matter_id", matterId)
        .order("created_at", { ascending: false });
      if (data) setExhibits(data);
    };
    if (matterId) loadExhibits();
  }, [matterId, supabase]);

  const handleRename = async () => {
    if (!matter) return;
    const newName = nameInput.trim();
    if (!newName) return;
    const { error: updateError } = await supabase
      .from("matters")
      .update({ name: newName })
      .eq("id", matter.id);
    if (!updateError) {
      setMatter({ ...matter, name: newName, updated_at: new Date().toISOString() });
    }
  };

  // Note CRUD operations
  const handleCreateNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data, error } = await supabase
      .from("notes")
      .insert({
        matter_id: matterId,
        user_id: session.user.id,
        title: noteTitle,
        content: noteContent,
      })
      .select()
      .single();
    if (!error && data) {
      setNotes([data, ...notes]);
      setNoteTitle("");
      setNoteContent("");
    } else if (error) {
      console.error("Error creating note:", error);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNoteId || !noteTitle.trim() || !noteContent.trim()) return;
    const { error } = await supabase
      .from("notes")
      .update({ title: noteTitle, content: noteContent, updated_at: new Date().toISOString() })
      .eq("id", editingNoteId);
    if (!error) {
      setNotes(notes.map(n => n.id === editingNoteId
        ? { ...n, title: noteTitle, content: noteContent, updated_at: new Date().toISOString() }
        : n
      ));
      setEditingNoteId(null);
      setNoteTitle("");
      setNoteContent("");
    }
  };

  const handleDeleteNote = async (id: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (!error) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  const startEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
    setNoteTitle("");
    setNoteContent("");
  };

  // Task CRUD operations
  const handleCreateTask = async () => {
    if (!taskTitle.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        matter_id: matterId,
        user_id: session.user.id,
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        status: "pending",
        due_date: taskDueDate || null,
      })
      .select()
      .single();
    if (!error && data) {
      setTasks([data, ...tasks]);
      setTaskTitle("");
      setTaskDescription("");
      setTaskDueDate("");
      setTaskPriority("medium");
    } else if (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleUpdateTaskStatus = async (id: string, status: Task["status"]) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", id);
    if (!error) {
      setTasks(tasks.map(t => t.id === id ? { ...t, status } : t));
    }
  };

  const handleDeleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (!error) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const handleDeleteExhibit = async (id: string) => {
    const { error } = await supabase.from("exhibits").delete().eq("id", id);
    if (!error) {
      setExhibits(exhibits.filter(e => e.id !== id));
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F2ED] flex items-center justify-center">
        <p className="text-sm text-[#6B6560]">Loading matter workspace...</p>
      </main>
    );
  }

  if (error || !matter) {
    return (
      <main className="min-h-screen bg-[#F5F2ED] flex items-center justify-center">
        <div className="rounded-2xl border border-[#E5E0D8] bg-white px-6 py-5 shadow-sm text-center">
          <p className="text-sm text-[#1A1614]">{error || "Matter not found."}</p>
          <Link
            href="/dashboard"
            className="mt-3 inline-flex items-center rounded-full bg-[var(--color-brand-royal)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const filteredTasks = tasks.filter(t => taskFilter === "all" || t.status === taskFilter);

  return (
    <main className="min-h-screen bg-[#F5F2ED]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand-royal)]">
              Matter Workspace
            </p>
            <div className="flex items-center gap-2 mt-1">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="text-2xl font-semibold text-[#0F1419] bg-white border border-[#E5E0D8] rounded-xl px-3 py-1.5 focus:border-[var(--color-brand-royal)] focus:outline-none w-full md:w-auto"
              />
              <button
                type="button"
                onClick={handleRename}
                className="rounded-full bg-[var(--color-brand-royal)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition"
              >
                Save
              </button>
            </div>
            <p className="text-xs text-[#6B6560] mt-1">
              Created {new Date(matter.created_at).toLocaleString()} · Updated {new Date(matter.updated_at).toLocaleString()}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-semibold text-[#1A1614] hover:bg-[#F5F2ED] transition"
          >
            ← Back
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-2 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "overview"
                  ? "bg-[var(--color-brand-royal)] text-white"
                  : "text-[#6B6560] hover:bg-[#F5F2ED]"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("notes")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                activeTab === "notes"
                  ? "bg-[var(--color-brand-royal)] text-white"
                  : "text-[#6B6560] hover:bg-[#F5F2ED]"
              }`}
            >
              Notes
              {notes.length > 0 && (
                <span className={`inline-flex items-center justify-center h-5 min-w-5 rounded-full text-xs font-bold px-1.5 ${
                  activeTab === "notes" ? "bg-white/20 text-white" : "bg-[#E5E0D8] text-[#6B6560]"
                }`}>
                  {notes.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tasks")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                activeTab === "tasks"
                  ? "bg-[var(--color-brand-royal)] text-white"
                  : "text-[#6B6560] hover:bg-[#F5F2ED]"
              }`}
            >
              Tasks
              {tasks.filter(t => t.status !== "completed").length > 0 && (
                <span className={`inline-flex items-center justify-center h-5 min-w-5 rounded-full text-xs font-bold px-1.5 ${
                  activeTab === "tasks" ? "bg-white/20 text-white" : "bg-[#E5E0D8] text-[#6B6560]"
                }`}>
                  {tasks.filter(t => t.status !== "completed").length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("exhibits")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                activeTab === "exhibits"
                  ? "bg-[var(--color-brand-royal)] text-white"
                  : "text-[#6B6560] hover:bg-[#F5F2ED]"
              }`}
            >
              Exhibits
              {exhibits.length > 0 && (
                <span className={`inline-flex items-center justify-center h-5 min-w-5 rounded-full text-xs font-bold px-1.5 ${
                  activeTab === "exhibits" ? "bg-white/20 text-white" : "bg-[#E5E0D8] text-[#6B6560]"
                }`}>
                  {exhibits.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Matter Status Card */}
            <div className="rounded-3xl border border-[#E5E0D8] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#0F1419] mb-4">Matter Status</h3>
              <div className="flex items-center gap-3 mb-4">
                <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide">
                  {matter.status || "Ready"}
                </span>
                {matter.pages && (
                  <span className="rounded-full bg-[#E5E0D8] text-[#0F1419] px-3 py-1.5 text-xs font-semibold">
                    {matter.pages} pages
                  </span>
                )}
              </div>
              {downloadHref ? (
                <a
                  href={downloadHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-royal)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </a>
              ) : (
                <p className="text-sm text-[#6B6560]">No PDF linked to this matter.</p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6560]">Notes</p>
                  <svg className="w-5 h-5 text-[var(--color-brand-royal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-[#0F1419]">{notes.length}</p>
              </div>
              <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6560]">Active Tasks</p>
                  <svg className="w-5 h-5 text-[var(--color-brand-royal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-[#0F1419]">{tasks.filter(t => t.status !== "completed").length}</p>
              </div>
              <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B6560]">Exhibits</p>
                  <svg className="w-5 h-5 text-[var(--color-brand-royal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-[#0F1419]">{exhibits.length}</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-3xl border border-[#E5E0D8] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#0F1419] mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {notes.slice(0, 2).map(note => (
                  <div key={note.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#F5F2ED]">
                    <svg className="w-5 h-5 text-[var(--color-brand-royal)] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F1419]">{note.title}</p>
                      <p className="text-xs text-[#6B6560] mt-0.5">{new Date(note.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status !== "completed").slice(0, 2).map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#F5F2ED]">
                    <svg className="w-5 h-5 text-[var(--color-brand-royal)] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F1419]">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
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
                      </div>
                    </div>
                  </div>
                ))}
                {notes.length === 0 && tasks.filter(t => t.status !== "completed").length === 0 && (
                  <p className="text-sm text-[#6B6560] text-center py-4">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-6">
            {/* Create/Edit Note Form */}
            <div className="rounded-3xl border border-[#E5E0D8] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#0F1419] mb-4">
                {editingNoteId ? "Edit Note" : "Create New Note"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0F1419] mb-1.5">Title</label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Note title"
                    className="w-full px-4 py-2.5 border border-[#E5E0D8] rounded-xl focus:border-[var(--color-brand-royal)] focus:outline-none text-[#0F1419]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0F1419] mb-1.5">Content</label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Note content"
                    rows={6}
                    className="w-full px-4 py-2.5 border border-[#E5E0D8] rounded-xl focus:border-[var(--color-brand-royal)] focus:outline-none text-[#0F1419] resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={editingNoteId ? handleUpdateNote : handleCreateNote}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-royal)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition"
                  >
                    {editingNoteId ? "Update Note" : "Create Note"}
                  </button>
                  {editingNoteId && (
                    <button
                      type="button"
                      onClick={cancelEditNote}
                      className="inline-flex items-center gap-2 rounded-full border border-[#E5E0D8] bg-white px-5 py-2.5 text-sm font-semibold text-[#1A1614] hover:bg-[#F5F2ED] transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Notes List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#0F1419]">Your Notes ({notes.length})</h3>
              {notes.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#E5E0D8] bg-white p-12 text-center">
                  <svg className="w-12 h-12 mx-auto text-[#E5E0D8] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-base font-semibold text-[#0F1419]">No notes yet</p>
                  <p className="text-sm text-[#6B6560] mt-1">Create your first note to start tracking information about this matter.</p>
                </div>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h4 className="text-base font-semibold text-[#0F1419]">{note.title}</h4>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditNote(note)}
                          className="text-[var(--color-brand-royal)] hover:text-[var(--color-brand-royal-hover)] transition"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600 hover:text-red-700 transition"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-[#6B6560] whitespace-pre-wrap mb-3">{note.content}</p>
                    <p className="text-xs text-[#6B6560]">
                      Updated {new Date(note.updated_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="space-y-6">
            {/* Create Task Form */}
            <div className="rounded-3xl border border-[#E5E0D8] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#0F1419] mb-4">Create New Task</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0F1419] mb-1.5">Task Title</label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="w-full px-4 py-2.5 border border-[#E5E0D8] rounded-xl focus:border-[var(--color-brand-royal)] focus:outline-none text-[#0F1419]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0F1419] mb-1.5">Description</label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Additional details"
                    rows={3}
                    className="w-full px-4 py-2.5 border border-[#E5E0D8] rounded-xl focus:border-[var(--color-brand-royal)] focus:outline-none text-[#0F1419] resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0F1419] mb-1.5">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as "low" | "medium" | "high")}
                      className="w-full px-4 py-2.5 border border-[#E5E0D8] rounded-xl focus:border-[var(--color-brand-royal)] focus:outline-none text-[#0F1419]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F1419] mb-1.5">Due Date</label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-[#E5E0D8] rounded-xl focus:border-[var(--color-brand-royal)] focus:outline-none text-[#0F1419]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCreateTask}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-royal)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition"
                >
                  Create Task
                </button>
              </div>
            </div>

            {/* Task Filter */}
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-[#6B6560]">Filter:</p>
              <div className="flex gap-2">
                {(["all", "pending", "in_progress", "completed"] as const).map(filter => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setTaskFilter(filter)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      taskFilter === filter
                        ? "bg-[var(--color-brand-royal)] text-white"
                        : "bg-white border border-[#E5E0D8] text-[#6B6560] hover:bg-[#F5F2ED]"
                    }`}
                  >
                    {filter === "all" ? "All" : filter.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#0F1419]">
                Tasks ({filteredTasks.length})
              </h3>
              {filteredTasks.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#E5E0D8] bg-white p-12 text-center">
                  <svg className="w-12 h-12 mx-auto text-[#E5E0D8] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-base font-semibold text-[#0F1419]">No tasks found</p>
                  <p className="text-sm text-[#6B6560] mt-1">Create a task to get started.</p>
                </div>
              ) : (
                filteredTasks.map(task => (
                  <div key={task.id} className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-[#0F1419] mb-2">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-[#6B6560] mb-3">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            task.priority === "high" ? "bg-red-100 text-red-700" :
                            task.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {task.priority} priority
                          </span>
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as Task["status"])}
                            className={`text-xs px-2.5 py-1 rounded-full font-medium border-0 focus:outline-none cursor-pointer ${
                              task.status === "completed" ? "bg-green-100 text-green-700" :
                              task.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                          {task.due_date && (
                            <span className="text-xs text-[#6B6560]">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-700 transition"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "exhibits" && (
          <div className="space-y-6">
            {/* Exhibits Header */}
            <div className="rounded-3xl border border-[#E5E0D8] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#0F1419] mb-2">Exhibit Files</h3>
              <p className="text-sm text-[#6B6560] mb-4">
                Files associated with this matter are tracked here. Upload exhibits through the Exhibit Builder.
              </p>
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-royal)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Go to Exhibit Builder
              </Link>
            </div>

            {/* Exhibits List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#0F1419]">
                Tracked Files ({exhibits.length})
              </h3>
              {exhibits.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#E5E0D8] bg-white p-12 text-center">
                  <svg className="w-12 h-12 mx-auto text-[#E5E0D8] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-base font-semibold text-[#0F1419]">No exhibits yet</p>
                  <p className="text-sm text-[#6B6560] mt-1">
                    Upload files through the Exhibit Builder to see them tracked here.
                  </p>
                </div>
              ) : (
                exhibits.map(exhibit => (
                  <div key={exhibit.id} className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <svg className="w-8 h-8 text-[var(--color-brand-royal)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0F1419] truncate">{exhibit.file_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              exhibit.status === "ready" ? "bg-green-100 text-green-700" :
                              exhibit.status === "processing" ? "bg-blue-100 text-blue-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {exhibit.status}
                            </span>
                            <span className="text-xs text-[#6B6560]">
                              {(exhibit.file_size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <span className="text-xs text-[#6B6560]">
                              {new Date(exhibit.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteExhibit(exhibit.id)}
                        className="text-red-600 hover:text-red-700 transition flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
