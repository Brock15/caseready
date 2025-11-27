"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useRef,
  useState,
  ChangeEvent,
  useEffect,
  useMemo,
  type DragEvent,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/createBrowserSupabaseClient";

type SelectedFile = {
  id: string;
  file: File;
  label: string;
  labelLocked: boolean;
  description: string;
  assumedDate: string;
  pages: string;
  detectedDate: string;
};

const UNLIMITED_EMAILS = new Set(["brockstar1215@gmail.com"]);
const UNLIMITED_IDS = new Set(["c46c028c-0e2c-41a0-bad4-900740c4a895"]);

const ACCEPTED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
]);

const ACCEPTED_EXTENSIONS = new Set(["pdf", "jpeg", "jpg", "png"]);

const formatDateForInput = (timestamp: number) => {
  const date = new Date(timestamp || Date.now());
  return date.toISOString().split("T")[0];
};

const stripExtension = (filename: string) =>
  filename.replace(/\.[^/.]+$/, "");

const getExhibitLabel = (index: number) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let n = index;
  let label = "";
  do {
    label = alphabet[n % 26] + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
};

const isSupportedFile = (file: File) => {
  if (ACCEPTED_MIME_TYPES.has(file.type)) {
    return true;
  }
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ACCEPTED_EXTENSIONS.has(extension);
};

const getSortValue = (
  file: SelectedFile,
  mode: "upload" | "timestamp" | "detected"
) => {
  if (mode === "timestamp") {
    return file.file.lastModified;
  }
  if (mode === "detected") {
    return Date.parse(file.detectedDate) || file.file.lastModified;
  }
  return 0;
};

const sortFilesByMode = (
  list: SelectedFile[],
  mode: "upload" | "timestamp" | "detected"
) => {
  if (mode === "upload") return list;
  return [...list].sort((a, b) => getSortValue(a, mode) - getSortValue(b, mode));
};

const relabelFiles = (list: SelectedFile[]) => {
  let changed = false;
  const next = list.map((file, index) => {
    if (file.labelLocked) return file;
    const generated = getExhibitLabel(index);
    if (generated !== file.label) {
      changed = true;
      return { ...file, label: generated };
    }
    return file;
  });
  return changed ? next : list;
};

export default function ExhibitBuilderPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [exportsUsed, setExportsUsed] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const isAuthenticated = Boolean(userId);
  const exportsLeft = Math.max(0, 2 - exportsUsed);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [orderingMode, setOrderingMode] = useState<
    "upload" | "timestamp" | "detected"
  >("upload");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [matterName, setMatterName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasUnlimitedExports = useMemo(
    () =>
      UNLIMITED_EMAILS.has(userEmail ?? "") ||
      UNLIMITED_IDS.has(userId ?? ""),
    [userEmail, userId]
  );

  useEffect(() => {
    let active = true;

    const applyUserState = (user: User | null) => {
      setUserEmail(user?.email ?? null);
      setUserId(user?.id ?? null);
      const nextExports =
        user?.user_metadata?.exportsUsed !== undefined
          ? Number(user.user_metadata.exportsUsed)
          : 0;
      setExportsUsed(Number.isFinite(nextExports) ? nextExports : 0);
    };

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      applyUserState(data.session?.user ?? null);
      setIsCheckingSession(false);
      if (!data.session) {
        router.replace("/signin?redirectedFrom=/builder");
      }
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!active) return;
      applyUserState(currentSession?.user ?? null);
      setIsCheckingSession(false);
      if (!currentSession) {
        router.replace("/signin?redirectedFrom=/builder");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
      router.replace("/signin");
    } catch (error) {
      console.error("Failed to sign out", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSelectFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    addFiles(incoming);
    e.target.value = "";
  };

  const totalSizeBytes = files.reduce((sum, f) => sum + f.file.size, 0);
  const totalSizeMB = totalSizeBytes / (1024 * 1024);

  const handleGenerate = async () => {
    if (!files.length || isSubmitting) return;
    if (!matterName.trim()) {
      setError("Enter a matter name before generating.");
      return;
    }

    if (!isAuthenticated) {
      setServerMessage("Sign in to use your two free exports.");
      router.push("/signin?redirectedFrom=/builder");
      return;
    }

    if (exportsLeft <= 0 && !hasUnlimitedExports) {
      setServerMessage(
        "You have used both free exports. Upgrade your plan to continue."
      );
      return;
    }

    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    setError(null);
    setIsSubmitting(true);
    setServerMessage(null);
    setLoadingProgress(0);
    const progressTimer =
      typeof window !== "undefined"
        ? window.setInterval(() => {
            setLoadingProgress((current) =>
              current >= 95 ? current : current + 5
            );
          }, 250)
        : null;

    try {
      const formData = new FormData();
      files.forEach(({ file }) => {
        formData.append("files", file);
      });

      formData.append("orderingMode", orderingMode);
      formData.append(
        "metadata",
        JSON.stringify({
          exhibits: files.map((item, index) => ({
            fileIndex: index,
            label: item.label,
            description: item.description,
            detectedDate: item.detectedDate,
          })),
          matterName:
            matterName.trim() ||
            `Exhibit Packet ${new Date().toLocaleDateString()}`,
        })
      );

      const res = await fetch("/api/generate-exhibit", {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        if (contentType.includes("application/json")) {
          const data = await res.json();
          setServerMessage(data.message || "Something went wrong.");
        } else {
          setServerMessage("Something went wrong generating the PDF.");
        }
        return;
      }

      if (contentType.includes("application/pdf")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        // Open the PDF in a new tab for preview
        window.open(url, "_blank", "noopener,noreferrer");
        // Auto-download the file
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "caseready-exhibit.pdf";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setDownloadUrl(url);
        setServerMessage("Exhibit PDF ready. Use the download button below.");

        // Derive page count from the generated PDF for metadata.
        let pageCount = files.length;
        try {
          const generatedDoc = await PDFDocument.load(await blob.arrayBuffer());
          pageCount = generatedDoc.getPageCount();
        } catch {
          // ignore if we can't parse
        }

        // Upload PDF to Supabase storage and create matter record.
        const { data: userData } = await supabase.auth.getUser();
        const currentUser = userData.user;
        if (currentUser) {
          const refreshedExports =
            currentUser.user_metadata?.exportsUsed !== undefined
              ? Number(currentUser.user_metadata.exportsUsed)
              : 0;
          setExportsUsed(
            Number.isFinite(refreshedExports) ? refreshedExports : 0
          );

          const matterTitle =
            matterName.trim() ||
            `Exhibit Packet ${new Date().toLocaleDateString()}`;

          const filePath = `${currentUser.id}/${Date.now()}-exhibit.pdf`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("exhibits")
            .upload(filePath, blob, { upsert: true, contentType: "application/pdf" });

          if (uploadError || !uploadData) {
            setServerMessage("Upload failed. Please check storage policies and bucket name.");
            return;
          }

          const storedPath = filePath;

          // Store the storage path; we'll generate signed URLs when needed.
          const { error: insertError } = await supabase.from("matters").insert({
            name: matterTitle,
            user_id: currentUser.id,
            pdf_url: storedPath,
            pages: pageCount,
            status: "ready",
          });

          if (insertError) {
            setServerMessage("Could not save matter. Please try again.");
            return;
          }

          // Create a short-lived signed URL for immediate download
          const { data: signed } = await supabase.storage
            .from("exhibits")
            .createSignedUrl(storedPath, 60 * 60);
          if (signed?.signedUrl) {
            setDownloadUrl(signed.signedUrl);
          }

          setTimeout(() => {
            router.push("/dashboard");
          }, 1200);
        }
      } else {
        setServerMessage("Unexpected response from server.");
      }
    } catch (err) {
      console.error(err);
      setServerMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
      if (progressTimer) {
        window.clearInterval(progressTimer);
      }
      setLoadingProgress(100);
      setTimeout(() => setLoadingProgress(0), 500);
    }
  };

  function addFiles(incoming: File[]) {
    if (!incoming.length) return;
    setFiles((prev) => {
      const additions: SelectedFile[] = [];
      incoming.forEach((file) => {
        if (!isSupportedFile(file)) return;
        additions.push({
          id: `${file.name}-${file.lastModified}-${Math.random()
            .toString(36)
            .slice(2)}`,
          file,
          label: getExhibitLabel(prev.length + additions.length),
          labelLocked: false,
          description: stripExtension(file.name),
          assumedDate: formatDateForInput(file.lastModified),
          pages: "",
          detectedDate: formatDateForInput(file.lastModified),
        });
      });
      if (!additions.length) return prev;
      const combined = [...prev, ...additions];
      const ordered = sortFilesByMode(combined, orderingMode);
      return relabelFiles(ordered);
    });
  }

  const handleDropZone = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer?.files || []);
    addFiles(droppedFiles);
  };

  const handleOrderingChange = (
    event: ChangeEvent<HTMLSelectElement>
  ): void => {
    const value = event.target.value as "upload" | "timestamp" | "detected";
    setOrderingMode(value);
    setFiles((prev) => relabelFiles(sortFilesByMode(prev, value)));
  };

  const updateFileMeta = (id: string, updates: Partial<SelectedFile>) => {
    setFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleDragStart = (
    event: DragEvent<HTMLTableRowElement>,
    id: string
  ) => {
    if (orderingMode !== "upload") return;
    event.dataTransfer?.setData("text/plain", id);
    setDraggingId(id);
  };

  const handleRowDrop = (
    event: DragEvent<HTMLTableRowElement>,
    targetId: string
  ) => {
    event.preventDefault();
    if (orderingMode !== "upload" || !draggingId || draggingId === targetId)
      return;
    setFiles((prev) => {
      const next = [...prev];
      const fromIndex = next.findIndex((file) => file.id === draggingId);
      const toIndex = next.findIndex((file) => file.id === targetId);
      if (fromIndex === -1 || toIndex === -1) {
        return prev;
      }
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return relabelFiles(next);
    });
    setDraggingId(null);
  };

  const handleDragEnd = () => setDraggingId(null);

  return (
    <main
      className="relative min-h-screen flex flex-col overflow-hidden text-[#111827]"
      style={{
        backgroundImage:
          "radial-gradient(130% 130% at 50% 0%, #fdfbff 0%, #f4f7ff 45%, #faf6f0 100%)",
      }}
    >
      <header className="w-full border-b backdrop-blur-sm bg-white/70 border-black/5">
        <div className="mx-auto max-w-5xl flex items-center justify-between py-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-md flex items-center justify-center border border-gray-100">
              <NextImage
                src="/logo.svg"
                alt="CaseReady logo"
                width={48}
                height={48}
                className="h-10 w-10"
                priority
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold tracking-tight text-lg">
                CaseReady Exhibit Builder
              </span>
              <span className="text-xs text-gray-500 hidden sm:block">
                Upload → auto-sort → Bates stamp → export.
              </span>
            </div>
          </div>
          {isAuthenticated ? (
            <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white/90 px-3 py-1 shadow-sm">
              <div className="hidden sm:flex flex-col text-right leading-tight">
                <span className="text-xs font-semibold text-gray-700">
                  {userEmail || "Account"}
                </span>
                <span className="text-[10px] text-gray-400">ID: {userId}</span>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className={`inline-flex items-center rounded-full bg-[#0056D6] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-110 ${
                  isSigningOut ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {isSigningOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-2 py-1 shadow-sm">
              <Link
                href="/signin?redirectedFrom=/builder"
                className="inline-flex items-center rounded-full bg-[#0056D6] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-110"
              >
                {isCheckingSession ? "Checking…" : "Sign in"}
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Early access
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex items-start">
        <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-8 space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0056D6]">Exhibit Builder</p>
                <h1 className="text-2xl font-semibold text-gray-900">Upload & assemble your packet</h1>
                <p className="text-sm text-gray-600">
                  Drag files below, reorder, and generate a judge-ready PDF with Bates stamps and exhibit labels.
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:gap-4">
              <label className="w-full sm:w-1/2 text-sm font-semibold text-gray-800">
                Matter name
                <input
                  value={matterName}
                  onChange={(e) => {
                    setMatterName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g., Acme v. Smith – Hearing Prep"
                  className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none ${
                    error ? "border-red-400" : "border-gray-200"
                  }`}
                />
                {error && (
                  <p className="mt-1 text-xs font-semibold text-red-600">
                    {error}
                  </p>
                )}
              </label>
              <div className="hidden sm:block text-xs text-gray-500">
                Name your packet before generating. You can rename it later in the matter detail page.
              </div>
            </div>

            {/* Upload card */}
            <div
              id="drop-zone"
              className="surface-card mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6"
            >
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-6 sm:p-8 text-center shadow-inner"
                style={{
                  backgroundImage:
                    "url('/ChatGPT Image Nov 17, 2025, 09_42_05 PM copy.svg')",
                  backgroundSize: "260px",
                  backgroundRepeat: "repeat",
                  backgroundPosition: "center",
                  backgroundColor: "rgba(255,255,255,0.9)",
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDropZone}
              >
                <div className="inline-flex flex-col gap-1 rounded-xl bg-white/85 px-4 py-3 text-gray-800 shadow-sm backdrop-blur">
                  <p className="text-sm font-semibold">
                    Drag & drop evidence files here
                  </p>
                  <p className="text-xs text-gray-600">
                    Screenshots, PDFs, emails, photos — up to 100 pages.
                  </p>
                </div>

                {/* Hidden input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.heic,.tif,.tiff"
                />

                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                  <button
                    type="button"
                    onClick={handleSelectFiles}
                    className="inline-flex justify-center items-center rounded-full bg-gradient-to-r from-[#3FA9FF] to-[#0056D6] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 transition"
                  >
                    Select files
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={
                      !files.length ||
                      isSubmitting ||
                      (isAuthenticated && exportsLeft <= 0 && !hasUnlimitedExports)
                    }
                    className={`inline-flex justify-center items-center rounded-full border px-5 py-2.5 text-sm font-medium transition ${
                      files.length &&
                      !isSubmitting &&
                      (!isAuthenticated ||
                        exportsLeft > 0 ||
                        hasUnlimitedExports)
                        ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isSubmitting
                      ? "Processing..."
                      : isAuthenticated &&
                        exportsLeft <= 0 &&
                        !hasUnlimitedExports
                      ? "Upgrade for more exports"
                      : "Generate Exhibit PDF"}
                  </button>
                </div>

                {files.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                      <label className="flex flex-col text-left font-semibold text-gray-700">
                        Ordering
                        <select
                          value={orderingMode}
                          onChange={handleOrderingChange}
                          className="mt-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[13px] text-gray-700 focus:outline-none"
                        >
                          <option value="upload">Upload order</option>
                          <option value="timestamp">File timestamp</option>
                          <option value="detected">
                            Detected date (experimental)
                          </option>
                        </select>
                      </label>
                      <p className="text-[11px] text-gray-700">
                        {orderingMode === "upload"
                          ? "Drag rows to reorder exhibits manually."
                          : orderingMode === "timestamp"
                          ? "Automatically sorting by file timestamps."
                          : "Placeholder detected-date ordering. OCR will plug in soon."}
                      </p>
                    </div>

                    <div className="surface-card overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                      <table className="min-w-full text-left text-xs text-gray-700">
                        <thead className="text-[11px] uppercase tracking-wide text-gray-500">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Order</th>
                            <th className="px-3 py-2 font-semibold">
                              Exhibit label
                            </th>
                            <th className="px-3 py-2 font-semibold">
                              Filename
                            </th>
                            <th className="px-3 py-2 font-semibold">
                              Date (detected/assumed)
                            </th>
                            <th className="px-3 py-2 font-semibold">
                              Description
                            </th>
                            <th className="px-3 py-2 font-semibold">Pages</th>
                          </tr>
                        </thead>
                        <tbody>
                          {files.map((item, index) => (
                            <tr
                              key={item.id}
                              draggable={orderingMode === "upload"}
                              onDragStart={(event) =>
                                handleDragStart(event, item.id)
                              }
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) => handleRowDrop(event, item.id)}
                              onDragEnd={handleDragEnd}
                              className={`border-t border-gray-100 text-[13px] ${
                                draggingId === item.id
                                  ? "bg-blue-50"
                                  : "bg-white"
                              }`}
                            >
                              <td className="px-3 py-3 align-top text-gray-500 font-semibold">
                                {orderingMode === "upload" && (
                                  <span className="mr-2 cursor-grab select-none text-gray-300">
                                    ⋮⋮
                                  </span>
                                )}
                                {index + 1}
                              </td>
                              <td className="px-3 py-3 align-top">
                                <input
                                  value={item.label}
                                  onChange={(event) =>
                                    updateFileMeta(item.id, {
                                      label: event.target.value,
                                      labelLocked: true,
                                    })
                                  }
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm focus:border-[#0056D6] focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-3 align-top text-gray-600">
                                <p className="truncate text-sm">
                                  {item.file.name}
                                </p>
                              </td>
                              <td className="px-3 py-3 align-top">
                                <input
                                  type="date"
                                  value={item.assumedDate}
                                  onChange={(event) =>
                                    updateFileMeta(item.id, {
                                      assumedDate: event.target.value,
                                    })
                                  }
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm focus:border-[#0056D6] focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-3 align-top">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(event) =>
                                    updateFileMeta(item.id, {
                                      description: event.target.value,
                                    })
                                  }
                                  placeholder="Optional notes"
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm focus:border-[#0056D6] focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-3 align-top">
                                <input
                                  type="number"
                                  min={1}
                                  value={item.pages}
                                  onChange={(event) =>
                                    updateFileMeta(item.id, {
                                      pages: event.target.value,
                                    })
                                  }
                                  className="w-20 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm focus:border-[#0056D6] focus:outline-none"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {isSubmitting && (
                  <div className="mt-4">
                    <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#3FA9FF] to-[#0056D6] transition-all duration-200"
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 uppercase tracking-wide">
                      Rendering your exhibit…
                    </p>
                  </div>
                )}

                {/* File summary */}
                {files.length === 0 ? (
                  <div className="mt-4 flex min-h-[88px] items-center justify-center">
                    <p className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white/90 px-4 py-1.5 text-center text-[12px] font-semibold text-gray-600 shadow-sm">
                      No files selected yet
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 text-left text-xs text-gray-700">
                    <p className="mb-1 font-medium text-gray-900">
                      {files.length} file
                      {files.length > 1 ? "s" : ""} selected ·{" "}
                      {totalSizeMB.toFixed(2)} MB total
                    </p>
                    <ul className="max-h-32 overflow-auto space-y-1 text-[11px]">
                      {files.map(({ id, file, label }) => (
                        <li
                          key={id}
                          className="flex justify-between gap-2 border-b border-gray-100 pb-1 last:border-b-0"
                        >
                          <span className="truncate text-gray-800">
                            {label} — {file.name}
                          </span>
                          <span className="whitespace-nowrap text-gray-600">
                            {(file.size / 1024).toFixed(0)} KB
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Server response */}
                {serverMessage && (
                  <p className="mt-3 text-[11px] text-gray-700">
                    {serverMessage}
                  </p>
                )}

                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download="caseready-exhibit.pdf"
                    className="mt-3 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#3FA9FF] to-[#0056D6] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110 transition"
                  >
                    Download Exhibit PDF
                  </a>
                )}

                <p className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white/95 px-4 py-2 text-[11px] font-medium text-gray-700 shadow-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-gray-50">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5 text-gray-700"
                      aria-hidden="true"
                    >
                      <rect x="5" y="11" width="14" height="9" rx="2" />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                      <path d="M12 15v2" />
                    </svg>
                  </span>
                  End-to-end encrypted in transit. Files are processed securely and never used for training.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
