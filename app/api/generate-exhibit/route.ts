import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from "pdf-lib";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabaseConfig";

const BATES_PREFIX = "";

const stampPage = (page: PDFPage, label: string, font: PDFFont) => {
  const { height } = page.getSize();
  page.drawText(`Exhibit ${label}`, {
    x: 40,
    y: height - 40,
    size: 10,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
};

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(
      {
        cookies: (() => cookieStore) as unknown as () => ReturnType<
          typeof cookies
        >,
      },
      {
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_ANON_KEY,
      }
    );
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { ok: false, message: "You need to sign in to continue." },
        { status: 401 }
      );
    }

    const user = session.user;
    const unlimitedEmails = new Set(["brockstar1215@gmail.com"]);
    const unlimitedIds = new Set(["c46c028c-0e2c-41a0-bad4-900740c4a895"]);
    const exportsUsedRaw = user.user_metadata?.exportsUsed ?? 0;
    const parsedExportsUsed = Number(exportsUsedRaw);
    const exportsUsed = Number.isFinite(parsedExportsUsed)
      ? parsedExportsUsed
      : 0;

    if (
      !unlimitedEmails.has(user.email ?? "") &&
      !unlimitedIds.has(user.id ?? "")
    ) {
      if (exportsUsed >= 2) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Free plan exhausted. Contact support to unlock more exports.",
          },
          { status: 403 }
        );
      }
    }

    const formData = await req.formData();

    const inputFiles: File[] = [];
    for (const entry of formData.entries()) {
      const [key, value] = entry;
      if (key === "files" && value instanceof File) {
        inputFiles.push(value);
      }
    }

    const metadataRaw = formData.get("fileMetadata");
    if (typeof metadataRaw !== "string") {
      return NextResponse.json(
        { ok: false, message: "Missing exhibit metadata." },
        { status: 400 }
      );
    }

    let parsedMetadata: Array<{
      label: string;
      description: string;
      filename: string;
      detectedDate?: string;
      lastModified?: number;
    }>;
    try {
      parsedMetadata = JSON.parse(metadataRaw);
    } catch {
      return NextResponse.json(
        { ok: false, message: "Invalid exhibit metadata." },
        { status: 400 }
      );
    }

    if (parsedMetadata.length !== inputFiles.length) {
      return NextResponse.json(
        { ok: false, message: "Metadata count mismatch with uploaded files." },
        { status: 400 }
      );
    }

    const exhibits = await Promise.all(
      parsedMetadata.map(async (meta, index) => {
        const file = inputFiles[index];
        const detectedDate = await resolveDetectedDate(
          file,
          meta.detectedDate
        );
        return {
          ...meta,
          detectedDate,
          file,
        };
      })
    );

    if (inputFiles.length === 0) {
      return NextResponse.json(
        { ok: false, message: "No files received." },
        { status: 400 }
      );
    }

    // Create a new PDF
    const pdfDoc = await PDFDocument.create();
    const baseFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (const exhibit of exhibits) {
      const cover = pdfDoc.addPage();
      const { width, height } = cover.getSize();
      cover.drawRectangle({
        x: 40,
        y: height - 180,
        width: width - 80,
        height: 120,
        color: rgb(0.96, 0.98, 1),
        borderColor: rgb(0.81, 0.89, 1),
        borderWidth: 1,
      });
      cover.drawText(`EXHIBIT ${exhibit.label}`, {
        x: 60,
        y: height - 110,
        size: 32,
        font: boldFont,
        color: rgb(0.05, 0.13, 0.32),
      });
      cover.drawText(exhibit.description || exhibit.filename, {
        x: 60,
        y: height - 150,
        size: 14,
        font: baseFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      cover.drawText("Case: ____________________", {
        x: 60,
        y: height - 190,
        size: 12,
        font: baseFont,
        color: rgb(0.4, 0.4, 0.4),
      });
      cover.drawText(`Date: ${new Date().toLocaleDateString()}`, {
        x: 60,
        y: height - 210,
        size: 12,
        font: baseFont,
        color: rgb(0.4, 0.4, 0.4),
      });
      stampPage(cover, exhibit.label, baseFont);

      const bytes = new Uint8Array(await exhibit.file.arrayBuffer());
      const mime = exhibit.file.type || "";

      if (mime === "application/pdf") {
        const srcDoc = await PDFDocument.load(bytes);
        const copiedPages = await pdfDoc.copyPages(
          srcDoc,
          srcDoc.getPageIndices()
        );
        copiedPages.forEach((page) => {
          stampPage(page, exhibit.label, baseFont);
          pdfDoc.addPage(page);
        });
      } else if (mime.startsWith("image/")) {
        let embedded;
        if (mime === "image/jpeg" || mime === "image/jpg") {
          embedded = await pdfDoc.embedJpg(bytes);
        } else {
          embedded = await pdfDoc.embedPng(bytes);
        }

        const imgWidth = embedded.width;
        const imgHeight = embedded.height;

        const page = pdfDoc.addPage();
        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();

        const scale = Math.min(
          pageWidth / imgWidth,
          pageHeight / imgHeight
        );
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;

        const x = (pageWidth - scaledWidth) / 2;
        const y = (pageHeight - scaledHeight) / 2;

        page.drawImage(embedded, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
        });
        stampPage(page, exhibit.label, baseFont);
      } else {
        console.log(
          `Skipping unsupported file type: ${exhibit.file.name} (${mime})`
        );
      }
    }

    applyBatesNumbers(pdfDoc, baseFont);

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        exportsUsed: exportsUsed + 1,
      },
    });

    if (updateError) {
      console.error("Failed to update export count", updateError);
      return NextResponse.json(
        {
          ok: false,
          message:
            "Finished rendering, but could not update your export quota. Please try again.",
        },
        { status: 500 }
      );
    }

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="exhibit.pdf"',
      },
    });
  } catch (error) {
    console.error("Failed to generate exhibit PDF", error);
    const message =
      error instanceof Error
        ? `Failed to generate exhibit PDF: ${error.message}`
        : "Failed to generate exhibit PDF.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
const formatBatesNumber = (index: number) =>
  `${BATES_PREFIX}${String(index).padStart(3, "0")}`;

const applyBatesNumbers = (doc: PDFDocument, font: PDFFont) => {
  const pages = doc.getPages();
  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    const label = formatBatesNumber(index + 1);
    page.drawText(label, {
      x: width - 60,
      y: height - 40,
      size: 9,
      font,
      color: rgb(0.05, 0.13, 0.32),
    });
  });
};

const detectDateFromPdf = async (file: File) => {
  // TODO: parse PDF text for explicit date strings.
  return new Date(file.lastModified || Date.now()).toISOString();
};

const detectDateFromImage = async (file: File) => {
  // TODO: run OCR and parse date-like strings for images.
  return new Date(file.lastModified || Date.now()).toISOString();
};

const resolveDetectedDate = async (file: File, fallback?: string) => {
  if (fallback) return fallback;
  if (file.type === "application/pdf") {
    return detectDateFromPdf(file);
  }
  if (file.type.startsWith("image/")) {
    return detectDateFromImage(file);
  }
  return new Date(file.lastModified || Date.now()).toISOString();
};
