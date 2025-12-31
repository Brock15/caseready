"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/createBrowserSupabaseClient";
import Link from "next/link";

type BetaApplication = {
  id: string;
  name: string;
  email: string;
  phone: string;
  practice_area: string;
  firm_size: string;
  cases_per_month: string;
  current_process: string;
  why_caseready: string;
  beta_token: string;
  approved: boolean;
  approved_at: string;
  created_at: string;
};

export default function BetaApplicationsAdminPage() {
  const [applications, setApplications] = useState<BetaApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("beta_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Failed to load beta applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    // Filter by approval status
    if (filter === "approved" && !app.approved) return false;
    if (filter === "pending" && app.approved) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        app.name.toLowerCase().includes(query) ||
        app.email.toLowerCase().includes(query) ||
        app.practice_area.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Practice Area",
      "Firm Size",
      "Cases/Month",
      "Current Process",
      "Why CaseReady",
      "Applied At",
      "Status",
    ];

    const rows = filteredApplications.map((app) => [
      app.name,
      app.email,
      app.phone,
      app.practice_area,
      app.firm_size,
      app.cases_per_month,
      `"${app.current_process.replace(/"/g, '""')}"`,
      `"${app.why_caseready.replace(/"/g, '""')}"`,
      new Date(app.created_at).toLocaleString(),
      app.approved ? "Approved" : "Pending",
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `beta-applications-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPracticeAreaLabel = (value: string) => {
    const labels: Record<string, string> = {
      personal_injury: "Personal Injury",
      criminal_defense: "Criminal Defense",
      divorce: "Divorce / Family Law",
      other: "Other",
    };
    return labels[value] || value;
  };

  const getFirmSizeLabel = (value: string) => {
    const labels: Record<string, string> = {
      solo: "Solo Practitioner",
      small: "2-10 Attorneys",
      large: "10+ Attorneys",
    };
    return labels[value] || value;
  };

  return (
    <main className="min-h-screen bg-[#F5F2ED] py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#0F1419]">Beta Applications</h1>
              <p className="text-sm text-[#6B6560] mt-1">
                {applications.length} total applications • {applications.filter((a) => a.approved).length} approved
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-semibold text-[#0F1419] hover:bg-[#F5F2ED] transition"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or practice area..."
              className="flex-1 rounded-lg border border-[#E5E0D8] bg-white px-4 py-2 text-sm text-[#0F1419] focus:border-[var(--color-brand-royal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-royal)]/20"
            />

            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="rounded-lg border border-[#E5E0D8] bg-white px-4 py-2 text-sm text-[#0F1419] focus:border-[var(--color-brand-royal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-royal)]/20"
              >
                <option value="all">All ({applications.length})</option>
                <option value="approved">Approved ({applications.filter((a) => a.approved).length})</option>
                <option value="pending">Pending ({applications.filter((a) => !a.approved).length})</option>
              </select>

              <button
                onClick={exportToCSV}
                disabled={filteredApplications.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand-royal)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>

              <button
                onClick={loadApplications}
                className="inline-flex items-center gap-2 rounded-lg border border-[#E5E0D8] bg-white px-4 py-2 text-sm font-semibold text-[#0F1419] hover:bg-[#F5F2ED] transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="rounded-2xl border border-[#E5E0D8] bg-white p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#E5E0D8] border-t-[var(--color-brand-royal)]" />
            <p className="text-sm text-[#6B6560] mt-4">Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E5E0D8] bg-white p-12 text-center">
            <p className="text-base font-semibold text-[#0F1419]">No applications found</p>
            <p className="text-sm text-[#6B6560] mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                className="rounded-2xl border border-[#E5E0D8] bg-white p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-[#0F1419]">{app.name}</h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          app.approved
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {app.approved ? "Approved" : "Pending"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#6B6560]">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {app.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {app.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wider mb-1">
                      Practice Area
                    </p>
                    <p className="text-sm text-[#0F1419]">{getPracticeAreaLabel(app.practice_area)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wider mb-1">
                      Firm Size
                    </p>
                    <p className="text-sm text-[#0F1419]">{getFirmSizeLabel(app.firm_size)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wider mb-1">
                      Cases Per Month
                    </p>
                    <p className="text-sm text-[#0F1419]">{app.cases_per_month}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wider mb-1">
                      Beta Token
                    </p>
                    <p className="text-xs font-mono text-[#7C3AED] bg-[#F5F3FF] px-2 py-1 rounded">
                      {app.beta_token}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wider mb-1">
                      Current Exhibit Process
                    </p>
                    <p className="text-sm text-[#0F1419] bg-[#F5F2ED] rounded-lg px-3 py-2">
                      {app.current_process}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#6B6560] uppercase tracking-wider mb-1">
                      Why CaseReady?
                    </p>
                    <p className="text-sm text-[#0F1419] bg-[#F5F2ED] rounded-lg px-3 py-2">
                      {app.why_caseready}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
