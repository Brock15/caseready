"use client";

import { useState, useEffect, DragEvent, ChangeEvent } from "react";
import { useParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/createBrowserSupabaseClient";

type ClientPortal = {
  id: string;
  name: string;
  description: string | null;
  client_name: string | null;
  client_email: string | null;
  is_active: boolean;
  expires_at: string | null;
};

type Upload = {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  status: string;
  created_at: string;
};

export default function ClientUploadPage() {
  const supabase = createBrowserSupabaseClient();
  const params = useParams();
  const token = params?.token as string;

  const [portal, setPortal] = useState<ClientPortal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);

  // Upload form state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [dragActive, setDragActive] = useState(false);
  const [uploaderName, setUploaderName] = useState("");
  const [uploaderEmail, setUploaderEmail] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Pre-fill client info from portal when loaded
  useEffect(() => {
    if (portal) {
      if (portal.client_name) setUploaderName(portal.client_name);
      if (portal.client_email) setUploaderEmail(portal.client_email);
    }
  }, [portal]);

  useEffect(() => {
    loadPortal();
  }, [token]);

  const loadPortal = async () => {
    setLoading(true);
    setError(null);

    // Load portal by access token - no auth required
    const { data, error: portalError } = await supabase
      .from("client_portals")
      .select("id, name, description, client_name, client_email, is_active, expires_at")
      .eq("access_token", token)
      .single();

    if (portalError || !data) {
      setError("Invalid or expired portal link");
      setLoading(false);
      return;
    }

    // Check if portal is active
    if (!data.is_active) {
      setError("This portal has been deactivated");
      setLoading(false);
      return;
    }

    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setError("This portal link has expired");
      setLoading(false);
      return;
    }

    setPortal(data);
    loadUploads(data.id);
    setLoading(false);
  };

  const loadUploads = async (portalId: string) => {
    const { data } = await supabase
      .from("client_uploads")
      .select("id, file_name, file_url, file_size, status, created_at")
      .eq("portal_id", portalId)
      .order("created_at", { ascending: false });

    if (data) setUploads(data);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !portal) return;
    if (!uploaderName.trim()) {
      alert("Please enter your name");
      return;
    }

    setUploading(true);
    const newProgress: Record<string, number> = {};

    for (const file of selectedFiles) {
      const fileId = file.name + file.size;
      newProgress[fileId] = 0;
      setUploadProgress({ ...newProgress });

      try {
        // Upload to Supabase Storage
        const fileName = `${Date.now()}_${file.name}`;
        const { data: storageData, error: storageError } = await supabase.storage
          .from("client-uploads")
          .upload(fileName, file);

        if (storageError) throw storageError;

        newProgress[fileId] = 50;
        setUploadProgress({ ...newProgress });

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("client-uploads")
          .getPublicUrl(fileName);

        // Create database record
        const { error: dbError } = await supabase
          .from("client_uploads")
          .insert({
            portal_id: portal.id,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_size: file.size,
            file_type: file.type,
            uploaded_by_name: uploaderName.trim(),
            uploaded_by_email: uploaderEmail.trim() || null,
            status: "pending",
          });

        if (dbError) throw dbError;

        newProgress[fileId] = 100;
        setUploadProgress({ ...newProgress });
      } catch (err) {
        console.error("Upload error:", err);
        alert(`Failed to upload ${file.name}`);
      }
    }

    // Reload uploads and reset form
    await loadUploads(portal.id);
    setSelectedFiles([]);
    setUploadProgress({});
    setUploading(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F2ED] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-brand-royal)] mx-auto mb-4"></div>
          <p className="text-sm text-[#6B6560]">Loading portal...</p>
        </div>
      </main>
    );
  }

  if (error || !portal) {
    return (
      <main className="min-h-screen bg-[#F5F2ED] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-[#E5E0D8] bg-white p-8 text-center shadow-sm">
          <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-2xl font-semibold text-[#0F1419] mb-2">Portal Not Found</h1>
          <p className="text-sm text-[#6B6560]">{error || "This portal link is invalid or has expired"}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F2ED]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-[#E5E0D8] mb-4">
            <svg className="w-8 h-8 text-[var(--color-brand-royal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-[#0F1419] tracking-tight">{portal.name}</h1>
          {portal.client_name && (
            <p className="text-sm text-[#6B6560] mt-2">Welcome, {portal.client_name}</p>
          )}
          {portal.description && (
            <p className="text-sm text-[#6B6560] mt-2 max-w-2xl mx-auto">{portal.description}</p>
          )}
        </div>

        {/* Upload Section */}
        <div className="rounded-3xl border border-[#E5E0D8] bg-white p-8 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-[#0F1419]">Upload Files</h2>

          {/* Your Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F1419] mb-1.5">Your Name *</label>
              <input
                type="text"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 border border-[#E5E0D8] rounded-xl focus:border-[var(--color-brand-royal)] focus:outline-none text-[#0F1419]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F1419] mb-1.5">Your Email (Optional)</label>
              <input
                type="email"
                value={uploaderEmail}
                onChange={(e) => setUploaderEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-[#E5E0D8] rounded-xl focus:border-[var(--color-brand-royal)] focus:outline-none text-[#0F1419]"
              />
            </div>
          </div>

          {/* Drag and Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition ${
              dragActive
                ? "border-[var(--color-brand-royal)] bg-[var(--color-brand-royal)]/5"
                : "border-[#E5E0D8] bg-[#F5F2ED]/30"
            }`}
          >
            <svg className="w-16 h-16 mx-auto text-[#E5E0D8] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-base font-semibold text-[#0F1419] mb-2">
              Drag and drop files here
            </p>
            <p className="text-sm text-[#6B6560] mb-4">or</p>
            <label className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-royal)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition cursor-pointer shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Browse Files
              <input
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#0F1419]">Selected Files ({selectedFiles.length})</h3>
              {selectedFiles.map((file, index) => {
                const fileId = file.name + file.size;
                const progress = uploadProgress[fileId] || 0;
                return (
                  <div key={index} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[#E5E0D8] bg-white">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F1419] truncate">{file.name}</p>
                      <p className="text-xs text-[#6B6560]">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {progress > 0 && (
                        <div className="mt-2">
                          <div className="w-full bg-[#E5E0D8] rounded-full h-2">
                            <div
                              className="bg-[var(--color-brand-royal)] h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                      className="text-red-600 hover:text-red-700 transition disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upload Button */}
          {selectedFiles.length > 0 && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !uploaderName.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-brand-royal)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-royal-hover)] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'}
                </>
              )}
            </button>
          )}
        </div>

        {/* Previous Uploads */}
        {uploads.length > 0 && (
          <div className="rounded-3xl border border-[#E5E0D8] bg-white p-8 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[#0F1419]">Your Uploads ({uploads.length})</h2>
              <p className="text-sm text-[#6B6560] mt-1">Check back anytime to see real-time status updates on your files</p>
            </div>
            <div className="space-y-3">
              {uploads.map(upload => (
                <div key={upload.id} className="p-4 rounded-xl border border-[#E5E0D8] bg-[#F5F2ED]/30">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <svg className="w-8 h-8 text-[var(--color-brand-royal)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F1419] truncate">{upload.file_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-[#6B6560]">
                            {(upload.file_size / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <span className="text-xs text-[#6B6560]">•</span>
                          <span className="text-xs text-[#6B6560]">
                            {new Date(upload.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium flex-shrink-0 ${
                      upload.status === "approved" ? "bg-green-100 text-green-700" :
                      upload.status === "rejected" ? "bg-red-100 text-red-700" :
                      upload.status === "reviewed" ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={upload.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={upload.file_name}
                      className="text-xs px-4 py-2 rounded-full bg-[var(--color-brand-royal)] text-white hover:bg-[var(--color-brand-royal-hover)] transition font-medium inline-flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download File
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-[#6B6560]">
          <p>Powered by CaseReady • Secure File Sharing</p>
        </div>
      </div>
    </main>
  );
}
