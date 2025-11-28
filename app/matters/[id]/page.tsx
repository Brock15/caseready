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

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-gray-600">Loading matter…</p>
      </main>
    );
  }

  if (error || !matter) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm text-center">
          <p className="text-sm text-gray-700">{error || "Matter not found."}</p>
          <Link
            href="/dashboard"
            className="mt-3 inline-flex items-center rounded-full bg-[#0056D6] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const presetLabels: Record<FormatPreset, { title: string; description: string }> = {
    quick: {
      title: "Quick Packet",
      description: "Fast, clean packet with Bates/page numbers.",
    },
    formal: {
      title: "Court Formal",
      description: "Cover page + optional index for judge-ready packets.",
    },
    firm_branded: {
      title: "Firm Branded",
      description: "White-label friendly with optional branding removal.",
    },
  };
  const resolvedPreset = normalizePreset(matter.format_preset || "quick");
  const resolvedOptions = mergeOptionsWithDefaults(
    resolvedPreset,
    (matter.format_options as Partial<FormatOptions> | null) ?? null
  );
  const presetAllowed =
    (userPlan === "free" && resolvedPreset === "quick") ||
    (userPlan === "solo" &&
      (resolvedPreset === "quick" || resolvedPreset === "formal")) ||
    userPlan === "firm";
  const formattingLocked = !presetAllowed;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0056D6]">
              Matter detail
            </p>
            <div className="flex items-center gap-2 mt-1">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="text-xl font-semibold text-gray-900 bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus:border-[#0056D6] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleRename}
                className="rounded-full bg-[#0056D6] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-110"
              >
                Save
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Created {new Date(matter.created_at).toLocaleString()} · Updated {new Date(matter.updated_at).toLocaleString()}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            ← Back
          </Link>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm space-y-4 text-sm text-gray-700">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
              {matter.status || "Ready"}
            </span>
            {matter.pages ? (
              <span className="rounded-full bg-gray-100 text-gray-700 px-3 py-1 text-[11px] font-semibold">
                {matter.pages} pages
              </span>
            ) : null}
          </div>
          {downloadHref ? (
            <a
              href={downloadHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full bg-[#0056D6] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
            >
              Download PDF
            </a>
          ) : (
            <p className="text-xs text-gray-500">No PDF linked to this matter.</p>
          )}
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm space-y-4 text-sm text-gray-700">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0056D6]">
                Formatting
              </p>
              <h3 className="text-lg font-semibold text-gray-900">
                {presetLabels[resolvedPreset].title}
              </h3>
              <p className="text-xs text-gray-600">
                {presetLabels[resolvedPreset].description}
              </p>
            </div>
            {formattingLocked ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-700">
                Locked · Upgrade to edit
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-[#0F2F8F]">
                {userPlan === "paid" ? "Paid access" : "Free preset"}
              </span>
            )}
          </div>
          {formattingLocked && (
            <p className="text-xs text-gray-600">
              Upgrade to change formatting; existing output remains unchanged.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Cover page
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {resolvedOptions.include_cover ? "Included" : "Not included"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Index / table of contents
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {resolvedOptions.include_index ? "Included" : "Not included"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Branding
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {resolvedOptions.show_caseready_branding ? "CaseReady footer shown" : "Branding hidden"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Sticker position
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {resolvedOptions.sticker_position === "bottom-right"
                  ? "Bottom-right"
                  : resolvedOptions.sticker_position === "left-vertical"
                  ? "Left vertical"
                  : "Top-right"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Cover template
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {resolvedOptions.cover_template === "modern"
                  ? "Modern"
                  : resolvedOptions.cover_template === "black-bar"
                  ? "Black bar"
                  : "Classic"}
              </p>
            </div>
            {resolvedOptions.case_title ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                  Case title
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {resolvedOptions.case_title}
                </p>
              </div>
            ) : null}
            {resolvedOptions.court_name ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                  Court
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {resolvedOptions.court_name}
                </p>
              </div>
            ) : null}
            {resolvedOptions.contact_block_text ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                  Contact block
                </p>
                <p className="text-sm font-semibold text-gray-900 whitespace-pre-line">
                  {resolvedOptions.contact_block_text}
                </p>
              </div>
            ) : null}
            {resolvedOptions.footer_text ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                  Footer line
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {resolvedOptions.footer_text}
                </p>
              </div>
            ) : null}
            {resolvedOptions.firm_logo_url ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                  Firm logo
                </p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {resolvedOptions.firm_logo_url}
                </p>
              </div>
            ) : null}
            {resolvedOptions.watermark_text ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                  Watermark
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {resolvedOptions.watermark_text}
                </p>
              </div>
            ) : null}
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Slip sheets
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {resolvedOptions.slip_sheets ? "Enabled" : "Disabled"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                Color-coded stickers
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {resolvedOptions.color_coded_stickers ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
