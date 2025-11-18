"use client";

import { useState, useMemo, ChangeEvent, FormEvent } from "react";

type TimelineEvent = {
  id: string;
  date: string;
  time?: string;
  title: string;
  description?: string;
  tag?: string;
};

const createId = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_EVENTS: TimelineEvent[] = [
  {
    id: createId(),
    date: "2024-03-14",
    time: "09:00",
    title: "Client intake call",
    description: "Initial facts + document list",
    tag: "Client",
  },
  {
    id: createId(),
    date: "2024-04-02",
    title: "Email from opposing counsel",
    description: "Produced revised contract draft",
    tag: "Opposing",
  },
  {
    id: createId(),
    date: "2024-04-18",
    time: "14:30",
    title: "Police report filed",
    description: "Officer Jenkins, SPD",
    tag: "Agency",
  },
];

const sortEvents = (list: TimelineEvent[], order: "asc" | "desc") => {
  const sorted = [...list].sort((a, b) => {
    const aKey = `${a.date} ${a.time ?? "00:00"}`;
    const bKey = `${b.date} ${b.time ?? "00:00"}`;
    return order === "asc"
      ? aKey.localeCompare(bKey)
      : bKey.localeCompare(aKey);
  });
  return sorted;
};

export default function TimelineBuilderPage() {
  const [events, setEvents] = useState<TimelineEvent[]>(DEFAULT_EVENTS);
  const [timelineName, setTimelineName] = useState("CaseReady Timeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isExporting, setIsExporting] = useState(false);

  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    events.forEach((event) => {
      if (event.tag) tags.add(event.tag);
    });
    return Array.from(tags);
  }, [events]);

  const filteredEvents = useMemo(() => {
    const sorted = sortEvents(events, sortOrder);
    return sorted.filter((event) => {
      const matchesTag =
        tagFilter === "all" || event.tag?.toLowerCase() === tagFilter;
      const searchTarget = `${event.title} ${event.description ?? ""}`.toLowerCase();
      const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());
      return matchesTag && matchesSearch;
    });
  }, [events, searchQuery, tagFilter, sortOrder]);

  const groupedEvents = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    filteredEvents.forEach((event) => {
      if (!groups[event.date]) groups[event.date] = [];
      groups[event.date].push(event);
    });
    return groups;
  }, [filteredEvents]);

  const handleEventChange = (
    id: string,
    field: keyof TimelineEvent,
    value: string
  ) => {
    setEvents((prev) =>
      prev.map((event) => (event.id === id ? { ...event, [field]: value } : event))
    );
  };

  const handleAddEvent = () => {
    setEvents((prev) => [
      ...prev,
      {
        id: createId(),
        date: new Date().toISOString().slice(0, 10),
        time: "",
        title: "Untitled event",
        description: "",
        tag: "",
      },
    ]);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const handleExport = async (event: FormEvent) => {
    event.preventDefault();
    if (!events.length || isExporting) return;
    try {
      setIsExporting(true);
      const res = await fetch("/api/timeline-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timelineName, events }),
      });

      if (!res.ok) {
        console.error(await res.text());
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${timelineName || "timeline"}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export timeline", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111827]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 space-y-8">
        <section className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#0056D6] font-semibold">
            Timeline builder
          </p>
          <h1 className="text-3xl font-semibold">Turn exhibits into a judge-ready chronology.</h1>
          <p className="text-sm text-gray-500">
            Jot down key events, apply quick filters, and export a polished PDF for court filings.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
          <form
            onSubmit={handleExport}
            className="surface-card rounded-3xl border border-white/70 p-6 space-y-5"
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Timeline name
              </label>
              <input
                type="text"
                value={timelineName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setTimelineName(e.target.value)
                }
                className="w-full rounded-2xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm focus:border-[#0056D6] focus:outline-none"
                placeholder="Hearing chronology"
              />
            </div>

            <div className="flex flex-wrap gap-3 text-xs font-semibold text-gray-600">
              <div className="flex items-center gap-2">
                <label className="text-gray-500">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1"
                  placeholder="Keywords"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-gray-500">Tag</label>
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1"
                >
                  <option value="all">All</option>
                  {tagOptions.map((tag) => (
                    <option key={tag} value={tag.toLowerCase()}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-gray-500">Sort</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1"
                >
                  <option value="asc">Oldest → Newest</option>
                  <option value="desc">Newest → Oldest</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 max-h-[28rem] overflow-auto pr-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-gray-200 bg-white/80 p-4 space-y-3 shadow-sm"
                >
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                    <label className="flex-1 min-w-[140px]">
                      Date
                      <input
                        type="date"
                        value={event.date}
                        onChange={(e) => handleEventChange(event.id, "date", e.target.value)}
                        className="mt-1 w-full rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5"
                      />
                    </label>
                    <label className="w-32">
                      Time
                      <input
                        type="time"
                        value={event.time ?? ""}
                        onChange={(e) => handleEventChange(event.id, "time", e.target.value)}
                        className="mt-1 w-full rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5"
                      />
                    </label>
                    <label className="flex-1 min-w-[140px]">
                      Tag/source
                      <input
                        type="text"
                        value={event.tag ?? ""}
                        onChange={(e) => handleEventChange(event.id, "tag", e.target.value)}
                        className="mt-1 w-full rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5"
                        placeholder="Client, Opposing…"
                      />
                    </label>
                  </div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Title
                    <input
                      type="text"
                      value={event.title}
                      onChange={(e) => handleEventChange(event.id, "title", e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 focus:border-[#0056D6] focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm text-gray-700">
                    Description
                    <textarea
                      value={event.description ?? ""}
                      onChange={(e) =>
                        handleEventChange(event.id, "description", e.target.value)
                      }
                      className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#0056D6] focus:outline-none"
                      rows={3}
                    />
                  </label>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{event.id.slice(0, 6)}</span>
                    <button type="button" onClick={() => handleDeleteEvent(event.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAddEvent}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Add event
              </button>
              <button
                type="submit"
                disabled={isExporting || !events.length}
                className={`rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm ${
                  isExporting
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#3FA9FF] to-[#0056D6] hover:brightness-110"
                }`}
              >
                {isExporting ? "Exporting…" : "Export as PDF"}
              </button>
            </div>
          </form>

          <section className="surface-card rounded-3xl border border-white/70 p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Timeline preview</h2>
              <p className="text-xs text-gray-500">
                Sorted automatically; grouped by date. Tags + search refine what appears.
              </p>
            </div>

            <div className="space-y-6">
              {filteredEvents.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">
                  No events match your current filters.
                </p>
              ) : (
                Object.entries(groupedEvents).map(([date, list]) => (
                  <div key={date} className="space-y-3">
                    <div className="flex items-baseline gap-3">
                      <span className="text-xs uppercase tracking-[0.3em] text-[#0056D6] font-semibold">
                        {new Date(date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="h-px flex-1 bg-gray-200" />
                    </div>
                    <div className="space-y-3">
                      {list.map((event) => (
                        <div
                          key={event.id}
                          className="rounded-2xl border border-gray-100 bg-white/90 px-4 py-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {event.time ? `${event.time} · ${event.title}` : event.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {event.description || "No description provided."}
                              </p>
                            </div>
                            {event.tag && (
                              <span className="rounded-full border border-gray-200 bg-white px-3 py-0.5 text-[11px] text-gray-600">
                                {event.tag}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
