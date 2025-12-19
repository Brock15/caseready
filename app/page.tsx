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

const FEATURE_SETS = [
  {
    title: "Available now",
    subtitle: "Live inside CaseReady today.",
    icon: "check",
    items: [
      "Bulk upload up to 100 files per run",
      "Auto Bates stamping & exhibit labeling",
      "Auto-rotate and normalize page sizing",
      "Auto-detect document & image types",
      "Auto file renaming + metadata sorting",
    ],
  },
  {
    title: "In active build",
    subtitle: "Shipping through the beta cycle.",
    icon: "spark",
    items: [
      "Timeline builder & storyboarding mode",
      "Redaction toolkit with templates",
      "AI exhibit categorization suggestions",
      "Client portal sharing + secure uploads",
      "Case folders stored in our cloud vault",
      "AI case summaries & predictive insights",
      "Motion and brief drafting assist",
      "Full-text OCR search across matters",
      "eDiscovery-style review workspace",
    ],
  },
];

const HERO_METRICS = [
  { value: "22k+", label: "Pages cleaned this month" },
  { value: "45 min", label: "Avg. bundle time saved" },
  { value: "98%", label: "Court-ready formatting score" },
];

const brand = {
  blue: "#1A3DE3",
  blueSoft: "#EEF2FF",
  border: "border-slate-200",
  card: "bg-white",
  cardTint: "bg-white/90 backdrop-blur",
  textPrimary: "text-slate-900",
  textSecondary: "text-slate-600",
};

const buttonVariants = {
  primary:
    "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#1A3DE3] to-[#4F46E5] text-white font-semibold shadow-[0_10px_30px_rgba(26,61,227,0.25)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(26,61,227,0.28)] focus:outline-none focus:ring-2 focus:ring-[#1A3DE3]/50",
  secondary:
    "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 font-semibold transition-all duration-150 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200",
};

const badgeVariants = {
  beta: "inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-[11px] font-semibold",
  live: "inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 px-2.5 py-0.5 text-[10px] font-semibold border border-green-100",
  info: "inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-semibold border border-blue-100",
};


export default function Home() {
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
  const [matterPromptOpen, setMatterPromptOpen] = useState(false);
  const [pendingGenerate, setPendingGenerate] = useState(false);
  const [matterInput, setMatterInput] = useState("");
  const isAuthenticated = Boolean(userId);
  const exportsLeft = Math.max(0, 2 - exportsUsed);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [orderingMode, setOrderingMode] = useState<
    "upload" | "timestamp" | "detected"
  >("upload");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [globalFocusMode, setGlobalFocusMode] = useState(false);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [redirectingToBuilder, setRedirectingToBuilder] = useState(false);
  const [showLifetimeBanner, setShowLifetimeBanner] = useState(true);

  const scrollToHowItWorksGif = () => {
    document
      .getElementById("how-it-works-gif")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
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
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!active) return;
      applyUserState(currentSession?.user ?? null);
      setIsCheckingSession(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  useEffect(() => {
    const sync = (value?: boolean) => {
      if (value !== undefined) {
        setGlobalFocusMode(value);
        return;
      }
      if (typeof document !== "undefined") {
        setGlobalFocusMode(document.documentElement.dataset.focusMode === "true");
      }
    };
    sync();
    const handler = (event: Event) => {
      if ("detail" in event && event instanceof CustomEvent) {
        sync(Boolean(event.detail?.value));
      } else {
        sync();
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("caseready:focusModeChange", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("caseready:focusModeChange", handler);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#drop-zone") {
      const target = document.getElementById("drop-zone");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

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
    redirectToBuilder();
  };

  const redirectToBuilder = () => {
    if (redirectingToBuilder) return;
    setRedirectingToBuilder(true);
    router.push("/builder");
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    addFiles(incoming);
    e.target.value = "";
  };

  const totalSizeBytes = files.reduce((sum, f) => sum + f.file.size, 0);
  const totalSizeMB = totalSizeBytes / (1024 * 1024);

  const handleGenerate = async () => {
    redirectToBuilder();
    if (!files.length || isSubmitting) return;
    if (!matterInput.trim()) {
      setMatterPromptOpen(true);
      return;
    }

    if (!isAuthenticated) {
      setServerMessage("Sign in to use your two free exports.");
      router.push("/signin?redirectedFrom=/");
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
            matterInput.trim() ||
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
        setDownloadUrl(url);
        setServerMessage("Exhibit PDF ready. Use the download button below.");

        const { data } = await supabase.auth.getUser();
        if (data.user) {
          const refreshedExports =
            data.user.user_metadata?.exportsUsed !== undefined
              ? Number(data.user.user_metadata.exportsUsed)
              : 0;
          setExportsUsed(
            Number.isFinite(refreshedExports) ? refreshedExports : 0
          );
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

  const confirmMatterAndGenerate = () => {
    if (!matterInput.trim()) return;
    setMatterPromptOpen(false);
    setPendingGenerate(false);
    handleGenerate();
  };

  const openMatterPrompt = () => {
    setMatterPromptOpen(true);
    setPendingGenerate(true);
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
      const relabeled = relabelFiles(ordered);
      if (relabeled.length) {
        redirectToBuilder();
      }
      return relabeled;
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

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => relabelFiles(prev.filter((file) => file.id !== id)));
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

  const scrollToDetails = () => {
    if (tableRef.current) {
      tableRef.current.scrollTo({
        left: tableRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
  };

  const dropZoneScrollMargin = globalFocusMode ? "160px" : "120px";

  return (
    <main
      className={`relative min-h-screen flex flex-col overflow-hidden ${
        globalFocusMode ? "text-slate-100 bg-[#020617]" : "text-[#111827]"
      }`}
      style={
        globalFocusMode
          ? {
              backgroundImage:
                "radial-gradient(120% 120% at 50% 0%, #0b1220 0%, #05060b 60%, #020617 100%)",
            }
          : {
              backgroundImage:
                "linear-gradient(180deg, #F5F3EE 0%, #F7F8FB 55%, #F1F5F9 100%)",
            }
      }
    >
      {/* Top bar */}
      <header
        className={`w-full border-b backdrop-blur-sm ${
          globalFocusMode ? "bg-[#0B1220]/90 border-white/10" : "bg-white/70 border-slate-200/80 shadow-sm"
        }`}
      >
        <div className="mx-auto max-w-5xl flex items-center justify-between py-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-lg flex items-center justify-center border border-slate-200">
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
                CaseReady
              </span>
              <span className="text-xs text-gray-500 hidden sm:block">
                Evidence made effortless.
              </span>
            </div>
          </div>

          <div
            className={`flex flex-wrap items-center gap-2 justify-end max-sm:w-full max-sm:justify-center max-sm:gap-2 text-[11px] font-semibold ${
              globalFocusMode ? "text-gray-200" : "text-gray-600"
            }`}
          >
            {/* Desktop buttons */}
            <div className="hidden lg:flex items-center gap-2">
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center gap-1 rounded-full border border-white/30 bg-white/80 px-3 py-1.5 min-h-[36px] text-sm text-gray-700 shadow-sm transition hover:shadow-md hover:bg-white"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#E4EEFF] text-[#1A3DE3] text-xs font-bold leading-none">
                  i
                </span>
                How it works
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#0F1F3F] to-[#1A3DE3] px-3.5 py-1.5 min-h-[36px] text-sm text-white shadow-sm transition hover:brightness-110"
              >
                <span className="text-sm">$</span>
                Pricing
              </Link>
            </div>

            {/* Mobile/medium compact actions */}
            <div className="flex items-center gap-2 lg:hidden">
              <Link
                href="/pricing"
                aria-label="Pricing"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#1A3DE3] bg-white text-[#1A3DE3] text-xs shadow-sm hover:bg-[#EEF2FF]"
              >
                💸
              </Link>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white/90 px-3 py-1 shadow-sm">
                <div className="hidden sm:flex flex-col text-right leading-tight">
                  <span className="text-xs font-semibold text-gray-700">
                    {userEmail || "Account"}
                  </span>
                </div>
                <Link
                  href="/dashboard"
              className="inline-flex items-center rounded-full bg-[#0F1F3F] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-110"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className={`inline-flex items-center rounded-full bg-[#0F1F3F] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-110 ${
                isSigningOut ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {isSigningOut ? "Signing out…" : "Sign out"}
            </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-2 py-1 shadow-sm">
                <Link
                  href="/signin"
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-[#0F1F3F] to-[#1A3DE3] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-110"
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
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center">
        <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] items-start md:items-center relative">
            {/* Left side */}
            <section className="relative">
              <span className="pointer-events-none absolute -top-10 -left-16 h-56 w-56 rounded-full bg-gradient-to-br from-[#f0f2f7] to-transparent blur-3xl" />
              <span className="pointer-events-none absolute top-1/4 -right-14 h-48 w-48 rounded-full bg-gradient-to-br from-[#e8ecf5] to-transparent blur-3xl" />
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm mb-3">
                <span className="h-2 w-2 rounded-full bg-[#D4A15A]" aria-hidden="true" />
                Built for busy attorneys
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-4 leading-tight">
                The automatic exhibit builder for lawyers.
                <span className="block text-[#0F1F3F]">
                  Turn messy screenshots into court-ready PDFs.
                </span>
              </h1>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#0F1F3F]" aria-hidden="true" />
                Still in beta testing — feedback welcomed.
              </p>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mb-6">
                Drag, drop, and let CaseReady auto-sort, auto-rotate, Bates stamp, and merge a clean exhibit packet in minutes.
              </p>
              <div className="flex flex-wrap gap-3 mb-6 max-sm:flex-col max-sm:w-full max-sm:items-stretch">
                <button
                  type="button"
                  onClick={() => {
                    if (isAuthenticated) {
                      router.push("/builder");
                    } else {
                      router.push("/signin?redirectedFrom=/builder");
                    }
                  }}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-[#0F1F3F] px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white shadow-md transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg hover:bg-[#152749]"
                >
                  Try Exhibit Builder Free
                </button>
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 min-h-[44px] text-sm font-semibold text-[#0F1F3F] shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  Watch workflow
                </button>
              </div>

          <div className="hidden xl:block absolute right-2 top-36 w-[260px]">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
              <div className="relative p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">See it in action</p>
                  <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 bg-white">
                    Live flow
                  </span>
                </div>
                <button
                  type="button"
                  onClick={scrollToHowItWorksGif}
                  className="block rounded-xl overflow-hidden border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F1F3F]/40"
                >
                  <video
                    src="/case1.mp4"
                    poster="/casereadyvid.gif"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto"
                  />
                </button>
              </div>
            </div>
          </div>
              <div className="h-px w-20 bg-gradient-to-r from-transparent via-[#1A3DE3]/50 to-transparent mb-3" />

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm mb-4">
                {isAuthenticated ? (
                  hasUnlimitedExports ? (
                    <>
                      <p className="font-semibold text-gray-900">
                        Unlimited exports enabled
                      </p>
                      <p>
                        Thanks for being an early tester—run as many exhibits as
                        you need.
                      </p>
                    </>
                  ) : (
                  <>
                    <p className="font-semibold text-gray-900">
                      Free plan: {exportsLeft} exports left of 2
                    </p>
                    <p>
                      Need more? Reply to your welcome email and we&apos;ll
                      upgrade your workspace.
                    </p>
                  </>
                  )
                ) : (
                  <>
                    <p className="font-semibold text-gray-900">
                      Free plan includes 2 exhibit exports.
                    </p>
                    <p>
                      Sign in when you&apos;re ready to generate and we&apos;ll
                      walk you through the free trial.
                    </p>
                  </>
                )}
              </div>

              {/* Upload card */}
              <div
                id="drop-zone"
                className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-5 sm:p-6 backdrop-blur"
                style={{ scrollMarginTop: dropZoneScrollMargin }}
              >
                <div
                  className="border-2 border-dashed border-slate-200 rounded-xl p-6 sm:p-8 text-center shadow-inner bg-gradient-to-b from-white to-[#F8FAFC]"
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
                  <div className="inline-flex flex-col gap-1 rounded-xl bg-white/85 px-4 py-3 text-slate-800 shadow-sm backdrop-blur">
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

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={handleSelectFiles}
                    className="inline-flex w-full sm:w-auto justify-center items-center rounded-full bg-gradient-to-r from-[#0F1F3F] to-[#1A3DE3] px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white shadow-[0_12px_32px_rgba(15,31,63,0.25)] hover:brightness-110 transition"
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
                    className={`inline-flex w-full sm:w-auto justify-center items-center rounded-full border px-5 py-2.5 min-h-[44px] text-sm font-medium transition ${
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
                      <div
                        ref={tableRef}
                        className="surface-card overflow-x-auto rounded-2xl border border-gray-200 bg-white"
                      >
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
                            <th className="px-3 py-2 font-semibold text-right">
                              Remove
                            </th>
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
                                  className="w-full rounded-xl border border-slate-200 bg-gray-50 px-3 py-1.5 text-sm focus:border-[#1A3DE3] focus:outline-none"
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
                                  className="w-full rounded-xl border border-slate-200 bg-gray-50 px-3 py-1.5 text-sm focus:border-[#1A3DE3] focus:outline-none"
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
                                  className="w-full rounded-xl border border-slate-200 bg-gray-50 px-3 py-1.5 text-sm focus:border-[#1A3DE3] focus:outline-none"
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
                                  className="w-20 rounded-xl border border-slate-200 bg-gray-50 px-3 py-1.5 text-sm focus:border-[#1A3DE3] focus:outline-none"
                                />
                                </td>
                                <td className="px-3 py-3 align-top text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFile(item.id)}
                                    className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:border-red-200 hover:text-red-700"
                                  >
                                    Delete
                                  </button>
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
                        className="h-full rounded-full bg-gradient-to-r from-[#0F1F3F] to-[#1A3DE3] transition-all duration-200"
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
                    className="mt-3 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#0F1F3F] to-[#1A3DE3] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(15,31,63,0.25)] hover:brightness-110 transition"
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
            </section>

            {/* Right side */}
            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-[#EEF2FF]/80 p-5 shadow-sm text-sm text-slate-700 backdrop-blur">
                <h2 className="font-semibold text-slate-900 mb-2">
                  Built for busy attorneys.
                </h2>
                <p className="mb-2">
                  CaseReady was designed for solos and small firms drowning in
                  screenshots and PDFs. Save paralegal hours on every matter.
                </p>
                <p className="text-xs text-slate-500">
                  Coming soon: redactions, exhibit presets by jurisdiction, and
                  client upload links.
                </p>
              </div>

            </aside>
          </div>
        </div>
      </div>

      <section
        id="how-it-works"
        className="border-t border-black/5 bg-gradient-to-b from-white via-white to-[#EEF2FF] scroll-mt-24"
      >
        <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-12 sm:py-16 space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-[#1A3DE3] font-semibold">
              How it works
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-2">
              Three quick steps from inbox chaos to court-ready exhibits.
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-3">
              Designed for solos and small teams—no complicated onboarding, just
              a fast path from raw files to polished PDFs.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {HERO_METRICS.map((metric) => (
              <div
                key={metric.label}
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm"
              >
                <span className="text-sm text-[#1A3DE3]">{metric.value}</span>
                <span className="text-[11px] text-slate-600">{metric.label}</span>
              </div>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.05fr,0.95fr] items-start">
            <div className="space-y-6">
              <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
                {[
                  {
                    title: "Upload evidence",
                    body: "Drag up to 100 screenshots, PDFs, or photos at once. Everything stays encrypted in transit.",
                  },
                  {
                    title: "Let CaseReady format",
                    body: "We merge PDFs, resize images, add page numbers, and keep your files in order automatically.",
                  },
                  {
                    title: "Download & file",
                    body: "Get a single exhibit-ready PDF that drops straight into your judge’s preferred format.",
                  },
                ].map((step, index) => (
                  <div
                    key={step.title}
                    className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 flex flex-col gap-3 shadow-sm hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition"
                  >
                    <span className="h-10 w-10 rounded-full bg-[#0F1F3F] text-white font-semibold text-lg flex items-center justify-center shadow-sm">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-600">{step.body}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#3FA9FF] to-[#0056D6] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                >
                  See more
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-[#0056D6] hover:border-[#0056D6] hover:text-[#0F2F8F]"
                >
                  Pricing
                </Link>
              </div>
            </div>

            <div
              id="how-it-works-gif"
              className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.16)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#EEF3FF] via-white to-[#F7F8FD] opacity-70" />
              <div className="relative p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-800">Full flow preview</p>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-[#0F2F8F] border border-blue-100">
                    See steps 1–3
                  </span>
                </div>
                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                  <video
                    src="/case1.mp4"
                    poster="/casereadyvid.gif"
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 px-6 py-6 sm:py-8 shadow-sm">
            <div className="text-center max-w-2xl mx-auto mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#1A3DE3] font-semibold">
                Feature roadmap
              </p>
              <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">
                Core automations now, deeper workflows rolling out weekly.
              </h3>
              <p className="text-sm text-slate-600 mt-2">
                Some capabilities are live today, while others are in active beta build. Early users see them first.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {FEATURE_SETS.map((set) => (
                <div
                  key={set.title}
                  className="rounded-2xl border border-slate-200 bg-white/90 p-4 sm:p-5 text-sm text-slate-600 backdrop-blur shadow-sm"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                        set.icon === "check"
                          ? "bg-green-100 text-green-700"
                          : "bg-indigo-100 text-indigo-700"
                      } text-xs font-semibold uppercase tracking-wide`}
                    >
                      {set.icon === "check" ? "Live" : "Beta"}
                    </span>
                    <div>
                      <p className="text-slate-900 font-semibold">{set.title}</p>
                      <p className="text-[12px] text-slate-500">{set.subtitle}</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {set.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#0F1F3F]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0F1F3F] text-white">
        <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-10 sm:py-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-blue-100 font-semibold">
              Pricing
            </p>
            <h3 className="text-2xl font-semibold mt-2">
              Founding offer seats are limited.
            </h3>
            <p className="text-sm text-blue-100 mt-2 max-w-xl">
              Start free with two exports. When CaseReady becomes essential,
              solo attorneys lock lifetime pricing at $29/mo and firms step into
              the $79/mo plan.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 text-sm font-medium">
            <div className="rounded-2xl bg-white/10 px-4 py-3 border border-white/10">
              <p className="text-xs uppercase tracking-wide text-blue-100">
                Free
              </p>
              <p className="text-xl font-semibold">$0</p>
              <p className="text-xs text-blue-100">2 exports included</p>
            </div>
            <div className="rounded-2xl bg-white text-[#0F1F3F] px-4 py-3 border border-white/30">
              <p className="text-xs uppercase tracking-wide text-[#0F1F3F]/70">
                Solo launch
              </p>
              <p className="text-xl font-semibold">$29</p>
              <p className="text-xs text-[#0F1F3F]/70">First 50 solos</p>
            </div>
            <div className="rounded-2xl bg-white text-[#0F1F3F] px-4 py-3 border border-white/30">
              <p className="text-xs uppercase tracking-wide text-[#0F1F3F]/70">
                Firm plan
              </p>
              <p className="text-xl font-semibold">$79</p>
              <p className="text-xs text-[#0F1F3F]/70">Unlimited matters</p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full bg-white text-[#0F1F3F] px-5 py-2.5 font-semibold hover:bg-blue-50 transition border border-white/40"
            >
              View plans
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/5 bg-white/60">
        <div className="mx-auto max-w-5xl flex items-center justify-between py-3 px-4 sm:px-6 text-[11px] text-gray-500">
          <span>© {new Date().getFullYear()} CaseReady.io</span>
          <span className="flex items-center gap-2">
            <Link href="/privacy" className="hover:text-gray-700">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-gray-700">
              Terms
            </Link>
            <span>•</span>
            <Link href="/security" className="hover:text-gray-700">
              Security
            </Link>
          </span>
        </div>
      </footer>

      {showLifetimeBanner && (
        <div className="fixed bottom-4 inset-x-4 md:inset-x-auto md:left-8 md:right-8 z-30">
          <div className="rounded-xl border border-[#D4AF37]/60 bg-white px-5 py-4 shadow-[0_18px_38px_rgba(212,175,55,0.25)] grid gap-3 sm:grid-cols-[1fr,auto] items-center text-sm text-[#0F172A] ring-2 ring-[#D4AF37]/15">
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <span className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-gradient-to-br from-[#F7E9B5] to-[#D4AF37] text-[#0B0F1F] text-xs font-semibold shadow">
                First 50
              </span>
              <div className="text-center sm:text-left">
                <p className="font-semibold text-[#0F172A]">Founding Lifetime • $199 one-time</p>
                <p className="text-xs text-[#4B5563]">
                  Unlimited exhibit packets forever. Locks pricing for the first 50 attorneys.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-center sm:justify-end">
              <Link
                href="/pricing#founders"
                className="inline-flex items-center rounded-full bg-[#0056D6] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-110"
              >
                View offer
              </Link>
              <button
                type="button"
                onClick={() => setShowLifetimeBanner(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none px-2"
                aria-label="Close lifetime banner"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
      {matterPromptOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur">
            <h3 className="text-lg font-semibold text-slate-900">
              Name this matter
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Enter a matter name before generating your exhibit packet.
            </p>
            <input
              value={matterInput}
              onChange={(e) => setMatterInput(e.target.value)}
              placeholder="e.g., Acme v. Smith – Hearing Prep"
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-[#1A3DE3] focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  setMatterPromptOpen(false);
                  setPendingGenerate(false);
                }}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmMatterAndGenerate}
                className="rounded-full bg-gradient-to-r from-[#0F1F3F] to-[#1A3DE3] px-4 py-2 font-semibold text-white shadow-sm hover:brightness-110"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
