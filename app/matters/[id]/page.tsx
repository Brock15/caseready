"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/createBrowserSupabaseClient";

type Matter = {
  id: string;
  name: string;
  pdf_url: string | null;
  status: string | null;
  pages: number | null;
  created_at: string;
  updated_at: string;
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
      </div>
    </main>
  );
}
