import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  PDFDocument,
  PDFPage,
  PDFFont,
  StandardFonts,
  rgb,
} from "pdf-lib";
import sharp from "sharp";
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

const getJpegOrientation = (buffer: ArrayBuffer): number | null => {
  const view = new DataView(buffer);
  if (view.byteLength < 2 || view.getUint16(0, false) !== 0xffd8) {
    return null;
  }
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset, false);
    offset += 2;
    if (marker === 0xffda) {
      break;
    }
    if ((marker & 0xff00) !== 0xff00) {
      break;
    }
    const segmentLength = view.getUint16(offset, false);
    if (segmentLength < 2 || offset + segmentLength > view.byteLength) {
      break;
    }
    if (marker === 0xffe1) {
      const segmentStart = offset + 2;
      if (view.getUint32(segmentStart, false) === 0x45786966) {
        const tiffOffset = segmentStart + 6;
        const endian = view.getUint16(tiffOffset, false);
        const little = endian === 0x4949;
        if (endian === 0x4949 || endian === 0x4d4d) {
          const ifdOffset = view.getUint32(tiffOffset + 4, little);
          let dirOffset = tiffOffset + ifdOffset;
          if (dirOffset < view.byteLength) {
            const entries = view.getUint16(dirOffset, little);
            for (let i = 0; i < entries; i += 1) {
              const entryOffset = dirOffset + 2 + i * 12;
              if (entryOffset + 12 > view.byteLength) continue;
              const tag = view.getUint16(entryOffset, little);
              if (tag === 0x0112) {
                return view.getUint16(entryOffset + 8, little);
              }
            }
          }
        }
      }
    }
    offset += segmentLength;
  }
  return null;
};

type OrientationMetrics = {
  angle: 0 | 90 | 180 | 270;
  energyScore: number;
  biasScore: number;
};

const computeOrientationMetrics = async (
  buffer: Buffer,
  angle: OrientationMetrics["angle"]
): Promise<OrientationMetrics> => {
  const { data, info } = await sharp(buffer)
    .rotate(angle, { background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .resize(96, 128, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .grayscale()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  let horizontalEnergy = 0;
  let verticalEnergy = 0;
  let biasScore = 0;
  for (let y = 0; y < height; y += 1) {
    const weightY = 1 - (2 * y) / height;
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      const value = data[idx];
      if (x + 1 < width) {
        horizontalEnergy += Math.abs(value - data[idx + 1]);
      }
      if (y + 1 < height) {
        const diff = data[idx + width] - value;
        verticalEnergy += Math.abs(diff);
        biasScore += diff * weightY;
      }
    }
  }

  return {
    angle,
    energyScore: verticalEnergy - horizontalEnergy,
    biasScore,
  };
};

const determineVisualRotation = async (buffer: Buffer): Promise<number> => {
  const candidates: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270];
  const metrics: OrientationMetrics[] = [];
  for (const angle of candidates) {
    metrics.push(await computeOrientationMetrics(buffer, angle));
  }

  metrics.sort((a, b) => b.energyScore - a.energyScore);
  const baseline = metrics.find((m) => m.angle === 0) ?? metrics[0];
  let best = metrics[0];

  if (
    metrics.length > 1 &&
    Math.abs(metrics[0].energyScore - metrics[1].energyScore) < 600
  ) {
    const competing = metrics
      .filter(
        (m) =>
          Math.abs(m.energyScore - best.energyScore) < 600 ||
          m.angle === best.angle
      )
      .sort((a, b) => a.biasScore - b.biasScore);
    best = competing[0];
  }

  if (best.angle !== 0) {
    const improvement = best.energyScore - baseline.energyScore;
    const biasDelta = Math.abs(best.biasScore - baseline.biasScore);
    const strongBias =
      (best.angle === 180 && biasDelta > 1200) || biasDelta > 2000;
    if (improvement < 800 && !strongBias) {
      return 0;
    }
  }

  return best.angle;
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

  const nodeBuffer = Buffer.from(fileBuffer);
  let workingBuffer = nodeBuffer;
  let rotationDegrees = 0;
  if (fileType === "image/jpeg" || fileType === "image/jpg") {
    const orientation = getJpegOrientation(fileBuffer);
    if (orientation === 3) rotationDegrees = 180;
    else if (orientation === 6) rotationDegrees = 90;
    else if (orientation === 8) rotationDegrees = 270;
  }
  if (!rotationDegrees) {
    rotationDegrees = await determineVisualRotation(workingBuffer);
  }
  if (rotationDegrees) {
    workingBuffer = await sharp(workingBuffer)
      .rotate(rotationDegrees, {
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .toBuffer();
  }

  let embedded;
  if (fileType === "image/png") {
    embedded = await targetDoc.embedPng(workingBuffer);
  } else if (fileType === "image/jpeg" || fileType === "image/jpg") {
    embedded = await targetDoc.embedJpg(workingBuffer);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  const page = targetDoc.addPage();
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const scale = Math.min(
    pageWidth / embedded.width,
    pageHeight / embedded.height
  );
  const drawWidth = embedded.width * scale;
  const drawHeight = embedded.height * scale;
  page.drawImage(embedded, {
    x: (pageWidth - drawWidth) / 2,
    y: (pageHeight - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
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
