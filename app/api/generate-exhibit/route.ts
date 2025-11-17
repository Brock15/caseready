import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const files: { name: string; size: number; type: string }[] = [];
    let totalSize = 0;

    for (const entry of formData.entries()) {
      const [key, value] = entry;

      if (key === "files" && value instanceof File) {
        files.push({
          name: value.name,
          size: value.size,
          type: value.type,
        });
        totalSize += value.size;
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { ok: false, message: "No files received." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Files received successfully.",
      fileCount: files.length,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      files,
    });
  } catch (err) {
    console.error("Error in /api/generate-exhibit:", err);
    return NextResponse.json(
      { ok: false, message: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
