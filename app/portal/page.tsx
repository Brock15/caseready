"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/createBrowserSupabaseClient";

type ClientPortal = {
  id: string;
  name: string;
  description: string | null;
  access_token: string;
  is_active: boolean;
  expires_at: string | null;
  client_name: string | null;
  client_email: string | null;
  created_at: string;
  updated_at: string;
  matter_id: string | null;
};

type ClientUpload = {
  id: string;
  portal_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_by_name: string | null;
  status: "pending" | "reviewed" | "approved" | "rejected";
  created_at: string;
};

type Matter = {
  id: string;
  name: string;
};

export default function ClientPortalPage() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();
  const [portals, setPortals] = useState<ClientPortal[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<string | null>(null);
  const [uploads, setUploads] = useState<ClientUpload[]>([]);

  // Form state
  const [portalName, setPortalName] = useState("");
  const [portalDescription, setPortalDescription] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [selectedMatterId, setSelectedMatterId] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace("/signin?redirectedFrom=/portal");
        return;
      }
      loadData();
    };
    checkAuth();
  }, [supabase, router]);

  const loadData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // Load portals
    const { data: portalsData } = await supabase
      .from("client_portals")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (portalsData) setPortals(portalsData);

    // Load matters
    const { data: mattersData } = await supabase
      .from("matters")
      .select("id, name")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false });

    if (mattersData) setMatters(mattersData);

    setLoading(false);
  };

  const loadUploads = async (portalId: string) => {
    const { data } = await supabase
      .from("client_uploads")
      .select("id, portal_id, file_name, file_url, file_size, uploaded_by_name, status, created_at")
      .eq("portal_id", portalId)
      .order("created_at", { ascending: false });

    if (data) setUploads(data);
  };

  const generateAccessToken = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleCreatePortal = async () => {
    if (!portalName.trim()) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const accessToken = generateAccessToken();
    const expiresAt = expiresInDays
      ? new Date(Date.now() + parseInt(expiresInDays) * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from("client_portals")
      .insert({
        user_id: session.user.id,
        name: portalName.trim(),
        description: portalDescription.trim() || null,
        client_name: clientName.trim() || null,
        client_email: clientEmail.trim() || null,
        matter_id: selectedMatterId || null,
        access_token: accessToken,
        is_active: true,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (!error && data) {
      setPortals([data, ...portals]);
      setShowCreateModal(false);
      resetForm();
    } else {
      console.error("Error creating portal:", error);
    }
  };

  const resetForm = () => {
    setPortalName("");
    setPortalDescription("");
    setClientName("");
    setClientEmail("");
    setSelectedMatterId("");
    setExpiresInDays("");
  };

  const togglePortalStatus = async (portalId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("client_portals")
      .update({ is_active: !currentStatus })
      .eq("id", portalId);

    if (!error) {
      setPortals(portals.map(p =>
        p.id === portalId ? { ...p, is_active: !currentStatus } : p
      ));
    }
  };

  const deletePortal = async (portalId: string) => {
    if (!confirm("Delete this portal? All uploads and messages will be removed.")) return;

    const { error } = await supabase
      .from("client_portals")
      .delete()
      .eq("id", portalId);

    if (!error) {
      setPortals(portals.filter(p => p.id !== portalId));
      if (selectedPortal === portalId) {
        setSelectedPortal(null);
        setUploads([]);
      }
    }
  };

  const copyPortalLink = (token: string) => {
    const url = `${window.location.origin}/client/${token}`;
    navigator.clipboard.writeText(url);
    alert("Portal link copied to clipboard!");
  };

  const updateUploadStatus = async (uploadId: string, status: ClientUpload["status"]) => {
    const { error } = await supabase
      .from("client_uploads")
      .update({ status })
      .eq("id", uploadId);

    if (!error) {
      setUploads(uploads.map(u =>
        u.id === uploadId ? { ...u, status } : u
      ));
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F2ED] flex items-center justify-center">
        <p className="text-sm text-[#6B6560]">Loading portals...</p>
      </main>
    );
  }

  const selectedPortalData = portals.find(p => p.id === selectedPortal);

  return (
    <main className="min-h-screen bg-[#F5F2ED]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#0F1419] tracking-tight">Client Portals</h1>
            <p className="text-sm text-[#6B6560] mt-1">Share secure upload links with clients</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-royal)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Portal
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-[#E5E0D8] bg-white px-4 py-2.5 text-sm font-semibold text-[#1A1614] hover:bg-[#F5F2ED] transition"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portals List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#0F1419]">Your Portals ({portals.length})</h2>

            {portals.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E5E0D8] bg-white p-12 text-center">
                <svg className="w-12 h-12 mx-auto text-[#E5E0D8] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <p className="text-base font-semibold text-[#0F1419]">No portals yet</p>
                <p className="text-sm text-[#6B6560] mt-1">Create your first client portal to start collecting uploads</p>
              </div>
            ) : (
              portals.map(portal => (
                <div
                  key={portal.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition cursor-pointer ${
                    selectedPortal === portal.id
                      ? "border-[var(--color-brand-royal)] ring-2 ring-[var(--color-brand-royal)]/20"
                      : "border-[#E5E0D8]"
                  }`}
                  onClick={() => {
                    setSelectedPortal(portal.id);
                    loadUploads(portal.id);
                  }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-[#0F1419] truncate">{portal.name}</h3>
                      {portal.client_name && (
                        <p className="text-sm text-[#6B6560] mt-0.5">Client: {portal.client_name}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      portal.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {portal.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {portal.description && (
                    <p className="text-sm text-[#6B6560] mb-3">{portal.description}</p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyPortalLink(portal.access_token);
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-brand-royal)] text-white hover:bg-[var(--color-brand-royal-hover)] transition font-medium"
                    >
                      Copy Link
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePortalStatus(portal.id, portal.is_active);
                      }}
                      className="text-xs px-3 py-1.5 rounded-full border border-[#E5E0D8] bg-white text-[#6B6560] hover:bg-[#F5F2ED] transition font-medium"
                    >
                      {portal.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePortal(portal.id);
                      }}
                      className="text-xs px-3 py-1.5 rounded-full border border-red-200 bg-white text-red-600 hover:bg-red-50 transition font-medium"
                    >
                      Delete
                    </button>
                  </div>

                  {portal.expires_at && (
                    <p className="text-xs text-[#6B6560] mt-3">
                      Expires: {new Date(portal.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Uploads Panel */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#0F1419]">
              {selectedPortalData ? `Uploads - ${selectedPortalData.name}` : "Select a Portal"}
            </h2>

            {!selectedPortal ? (
              <div className="rounded-3xl border border-dashed border-[#E5E0D8] bg-white p-12 text-center">
                <svg className="w-12 h-12 mx-auto text-[#E5E0D8] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p className="text-base font-semibold text-[#0F1419]">No portal selected</p>
                <p className="text-sm text-[#6B6560] mt-1">Click on a portal to view client uploads</p>
              </div>
            ) : uploads.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E5E0D8] bg-white p-12 text-center">
                <svg className="w-12 h-12 mx-auto text-[#E5E0D8] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-base font-semibold text-[#0F1419]">No uploads yet</p>
                <p className="text-sm text-[#6B6560] mt-1">Clients haven't uploaded any files to this portal</p>
              </div>
            ) : (
              uploads.map(upload => (
                <div key={upload.id} className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-[#0F1419] truncate">{upload.file_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[#6B6560]">
                          {(upload.file_size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        {upload.uploaded_by_name && (
                          <>
                            <span className="text-xs text-[#6B6560]">•</span>
                            <span className="text-xs text-[#6B6560]">{upload.uploaded_by_name}</span>
                          </>
                        )}
                        <span className="text-xs text-[#6B6560]">•</span>
                        <span className="text-xs text-[#6B6560]">
                          {new Date(upload.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={upload.status}
                      onChange={(e) => updateUploadStatus(upload.id, e.target.value as ClientUpload["status"])}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium border-0 focus:outline-none cursor-pointer ${
                        upload.status === "approved" ? "bg-green-100 text-green-700" :
                        upload.status === "rejected" ? "bg-red-100 text-red-700" :
                        upload.status === "reviewed" ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <a
                      href={upload.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={upload.file_name}
                      className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-brand-royal)] text-white hover:bg-[var(--color-brand-royal-hover)] transition font-medium inline-flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download
                    </a>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Delete ${upload.file_name}?`)) {
                          const { error } = await supabase
                            .from("client_uploads")
                            .delete()
                            .eq("id", upload.id);
                          if (!error) {
                            setUploads(uploads.filter(u => u.id !== upload.id));
                          }
                        }
                      }}
                      className="text-xs px-3 py-1.5 rounded-full border border-red-200 bg-white text-red-600 hover:bg-red-50 transition font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Portal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-[#E5E0D8] shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[#0F1419] tracking-tight">Create Client Portal</h3>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
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
                <label className="block text-sm font-medium text-[#0F1419] mb-1.5">Portal Name *</label>
                <input
                  type="text"
                  value={portalName}
                  onChange={(e) => setPortalName(e.target.value)}
                  placeholder="e.g., Discovery Documents Upload"
                  className="w-full px-4 py-2.5 border border-[#E5E0D8] rounded-xl focus:border-[var(--color-brand-royal)] focus:outline-none text-[#0F1419]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F1419] mb-1.5">Description</label>
                <textarea
                  value={portalDescription}
                  onChange={(e) => setPortalDescription(e.target.value)}
                  placeholder="Instructions for your client..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-[#E5E0D8] rounded-xl focus:border-[var(--color-brand-royal)] focus:outline-none text-[#0F1419] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F1419] mb-1.5">Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 border border-[#E5E0D8] rounded-xl focus:border-[var(--color-brand-royal)] focus:outline-none text-[#0F1419]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F1419] mb-1.5">Client Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full px-4 py-2.5 border border-[#E5E0D8] rounded-xl focus:border-[var(--color-brand-royal)] focus:outline-none text-[#0F1419]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F1419] mb-1.5">Link to Matter (Optional)</label>
                <select
                  value={selectedMatterId}
                  onChange={(e) => setSelectedMatterId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#E5E0D8] rounded-xl focus:border-[var(--color-brand-royal)] focus:outline-none text-[#0F1419]"
                >
                  <option value="">No matter</option>
                  {matters.map(matter => (
                    <option key={matter.id} value={matter.id}>{matter.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F1419] mb-1.5">Expires In (Days)</label>
                <input
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  placeholder="Leave empty for no expiration"
                  min="1"
                  className="w-full px-4 py-2.5 border border-[#E5E0D8] rounded-xl focus:border-[var(--color-brand-royal)] focus:outline-none text-[#0F1419]"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCreatePortal}
                  disabled={!portalName.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-brand-royal)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Portal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
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
    </main>
  );
}
