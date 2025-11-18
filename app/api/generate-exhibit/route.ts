import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  PDFDocument,
  PDFPage,
  PDFFont,
  StandardFonts,
  rgb,
} from "pdf-lib";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabaseConfig";

type ExhibitInput = {
  label?: string;
  description?: string;
  detectedDate?: string;
  fileIndex: number;
};

const BATES_PREFIX = "CR_";
const UNLIMITED_EMAILS = new Set(["brockstar1215@gmail.com"]);
const UNLIMITED_IDS = new Set(["c46c028c-0e2c-41a0-bad4-900740c4a895"]);

const getExhibitLabel = (index: number): string => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  let n = index;
  do {
    result = alphabet[n % 26] + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
};

const drawExhibitStamp = (
  page: PDFPage,
  label: string,
  font: PDFFont,
  size = 9
) => {
  // Coordinates assume 0,0 in bottom-left and 72pt per inch.
  const { height } = page.getSize();
  page.drawText(`EXHIBIT ${label}`, {
    x: 36,
    y: height - 36,
    size,
    font,
    color: rgb(0.13, 0.13, 0.13),
  });
};

const drawBatesStamp = (
  page: PDFPage,
  index: number,
  font: PDFFont,
  size = 9
) => {
  const value = `${BATES_PREFIX}${String(index).padStart(4, "0")}`;
  const { width } = page.getSize();
  const textWidth = font.widthOfTextAtSize(value, size);
  page.drawText(value, {
    x: width - 36 - textWidth,
    y: 36,
    size,
    font,
    color: rgb(0.05, 0.11, 0.25),
  });
};

const loadPdfOrImageAsPages = async (
  fileBuffer: ArrayBuffer,
  fileType: string,
  targetDoc: PDFDocument
): Promise<PDFPage[]> => {
  if (fileType === "application/pdf") {
    const src = await PDFDocument.load(fileBuffer);
    const copies = await targetDoc.copyPages(src, src.getPageIndices());
    copies.forEach((page) => targetDoc.addPage(page));
    return copies;
  }

  let embedded;
  if (fileType === "image/jpeg" || fileType === "image/jpg") {
    embedded = await targetDoc.embedJpg(fileBuffer);
  } else if (fileType === "image/png") {
    embedded = await targetDoc.embedPng(fileBuffer);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  const page = targetDoc.addPage();
  const { width, height } = page.getSize();
  const scale = Math.min(width / embedded.width, height / embedded.height);
  const scaledWidth = embedded.width * scale;
  const scaledHeight = embedded.height * scale;

  page.drawImage(embedded, {
    x: (width - scaledWidth) / 2,
    y: (height - scaledHeight) / 2,
    width: scaledWidth,
    height: scaledHeight,
  });

  return [page];
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
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      return NextResponse.json(
        { ok: false, message: "You need to sign in to continue." },
        { status: 401 }
      );
    }

    const user = session.user;
    const isUnlimited =
      UNLIMITED_EMAILS.has(user.email ?? "") ||
      UNLIMITED_IDS.has(user.id ?? "");
    const exportsUsed =
      Number(user.user_metadata?.exportsUsed ?? 0) || 0;

    if (!isUnlimited && exportsUsed >= 2) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Free plan exhausted. Contact support to unlock more exports.",
        },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "files" && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { ok: false, message: "No files received." },
        { status: 400 }
      );
    }

    const metadataRaw = formData.get("metadata");
    if (typeof metadataRaw !== "string") {
      return NextResponse.json(
        { ok: false, message: "Missing exhibit metadata." },
        { status: 400 }
      );
    }

    let exhibitsInput: ExhibitInput[] = [];
    try {
      const parsed = JSON.parse(metadataRaw);
      exhibitsInput = Array.isArray(parsed?.exhibits)
        ? parsed.exhibits
        : [];
    } catch {
      return NextResponse.json(
        { ok: false, message: "Invalid exhibit metadata JSON." },
        { status: 400 }
      );
    }

    if (!exhibitsInput.length) {
      return NextResponse.json(
        { ok: false, message: "No exhibit metadata provided." },
        { status: 400 }
      );
    }

    const pdfDoc = await PDFDocument.create();
    const exhibitFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const batesFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    let batesCounter = 1;

    for (let i = 0; i < exhibitsInput.length; i += 1) {
      const exhibit = exhibitsInput[i];
      const file = files[exhibit.fileIndex];

      if (!file) {
        return NextResponse.json(
          {
            ok: false,
            message: `Missing file for exhibit index ${exhibit.fileIndex}`,
          },
          { status: 400 }
        );
      }

      const buffer = await file.arrayBuffer();
      const pages = await loadPdfOrImageAsPages(buffer, file.type, pdfDoc);
      const label = (exhibit.label || getExhibitLabel(i)).trim() || "A";

      pages.forEach((page) => {
        drawExhibitStamp(page, label, exhibitFont);
        drawBatesStamp(page, batesCounter++, batesFont);
      });
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    if (!isUnlimited) {
      await supabase.auth.updateUser({
        data: { exportsUsed: exportsUsed + 1 },
      });
    }

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="CaseReady_Exhibits.pdf"',
      },
    });
  } catch (error) {
    console.error("Failed to generate exhibit PDF", error);
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate exhibit PDF.",
      },
      { status: 500 }
    );
  }
}
