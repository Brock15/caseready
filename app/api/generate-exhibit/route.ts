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
const PAGE_MARGIN = 36; // 0.5 inch
const STICKER_WIDTH = 108; // ~1.5 in
const STICKER_HEIGHT = 44;
const DEFAULT_PAGE = { width: 612, height: 792 }; // Letter
const MAX_IMAGE_DIMENSION = 2400; // cap large mobile photos for lambda memory

const sanitizeText = (value: string) => (value || "").replace(/\u202f/g, " ");

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

const drawExhibitStamp = (page: PDFPage, label: string, font: PDFFont, size = 12) => {
  const { height, width } = page.getSize();
  const text = sanitizeText(`EXHIBIT ${label}`);
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (width - textWidth) / 2,
    y: height - PAGE_MARGIN - 12,
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
    x: width - PAGE_MARGIN - textWidth,
    y: PAGE_MARGIN,
    size,
    font,
    color: rgb(0.05, 0.11, 0.25),
  });
};

const drawExhibitSticker = (
  page: PDFPage,
  label: string,
  batesValue: string,
  font: PDFFont
) => {
  const { width, height } = page.getSize();
  const x = PAGE_MARGIN;
  const y = PAGE_MARGIN;
  page.drawRectangle({
    x,
    y,
    width: STICKER_WIDTH,
    height: STICKER_HEIGHT,
    color: rgb(0.99, 0.99, 0.99),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });
  page.drawText(sanitizeText(`Exhibit ${label}`), {
    x: x + 8,
    y: y + STICKER_HEIGHT - 16,
    size: 10,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText(sanitizeText(`Bates: ${batesValue}`), {
    x: x + 8,
    y: y + 12,
    size: 9,
    font,
    color: rgb(0.2, 0.2, 0.25),
  });
};

const drawPageNumber = (page: PDFPage, pageNumber: number, totalPages: number, font: PDFFont) => {
  const label = sanitizeText(`Page ${pageNumber} of ${totalPages}`);
  const size = 9;
  const { width } = page.getSize();
  const textWidth = font.widthOfTextAtSize(label, size);
  page.drawText(label, {
    x: (width - textWidth) / 2,
    y: PAGE_MARGIN - 6,
    size,
    font,
    color: rgb(0.2, 0.2, 0.25),
  });
};

type TocEntry = {
  description: string;
  range: string;
};

const drawIndexPage = (
  page: PDFPage,
  entries: TocEntry[],
  font: PDFFont,
  boldFont: PDFFont
) => {
  const { width, height } = page.getSize();
  const title = "Index of Exhibits";
  const titleSize = 18;
  const titleWidth = boldFont.widthOfTextAtSize(title, titleSize);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: height - 140,
    size: titleSize,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawLine({
    start: { x: PAGE_MARGIN, y: height - 155 },
    end: { x: width - PAGE_MARGIN, y: height - 155 },
    thickness: 0.75,
    color: rgb(0.78, 0.82, 0.86),
  });

  const startY = height - 190;
  const lineHeight = 20;
  entries.forEach((entry, idx) => {
    const y = startY - idx * lineHeight;
    const desc = sanitizeText(entry.description);
    const range = sanitizeText(entry.range);
    page.drawText(desc, {
      x: PAGE_MARGIN,
      y,
      size: 12,
      font,
      color: rgb(0.15, 0.16, 0.18),
      maxWidth: width - PAGE_MARGIN * 2 - 120,
    });
    const rangeWidth = font.widthOfTextAtSize(range, 12);
    page.drawText(range, {
      x: width - PAGE_MARGIN - rangeWidth,
      y,
      size: 12,
      font,
      color: rgb(0.15, 0.16, 0.18),
    });
  });
};

const drawCoverPage = (
  page: PDFPage,
  options: {
    exhibitLabel: string;
    matterName: string;
    caseNumber?: string | null;
    generatedDate: string;
    batesRange: string;
    font: PDFFont;
    boldFont: PDFFont;
  }
) => {
  const { exhibitLabel, matterName, caseNumber, generatedDate, batesRange, font, boldFont } =
    options;
  const { width, height } = page.getSize();
  const centerX = width / 2;

  const title = sanitizeText(`EXHIBIT ${exhibitLabel}`);
  const titleWidth = boldFont.widthOfTextAtSize(title, 28);
  page.drawText(title, {
    x: centerX - titleWidth / 2,
    y: height - 170,
    size: 28,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawLine({
    start: { x: PAGE_MARGIN, y: height - 190 },
    end: { x: width - PAGE_MARGIN, y: height - 190 },
    thickness: 0.5,
    color: rgb(0.8, 0.82, 0.85),
  });

  const lines = [
    sanitizeText(matterName),
    caseNumber ? sanitizeText(`Case No.: ${caseNumber}`) : "",
    sanitizeText(`Generated: ${generatedDate}`),
    sanitizeText("Prepared with CaseReady Exhibit Builder"),
    sanitizeText(`Bates: ${batesRange}`),
  ].filter(Boolean);

  let offsetY = height - 230;
  lines.forEach((line, index) => {
    const size = index === 0 ? 15 : index === lines.length - 1 ? 12 : 13;
    const useBold = index === 0;
    const currentFont = useBold ? boldFont : font;
    const textWidth = currentFont.widthOfTextAtSize(line, size);
    page.drawText(line, {
      x: centerX - textWidth / 2,
      y: offsetY,
      size,
      font: currentFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    offsetY -= 24;
    if (index === 0 || index === lines.length - 2) {
      page.drawLine({
        start: { x: centerX - 120, y: offsetY + 12 },
        end: { x: centerX + 120, y: offsetY + 12 },
        thickness: 0.4,
        color: rgb(0.85, 0.87, 0.9),
      });
    }
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

const normalizeImageType = (fileType: string, fileName?: string) => {
  const lower = (fileType || "").toLowerCase();
  if (lower) return lower;
  const ext = (fileName || "").split(".").pop()?.toLowerCase();
  if (ext === "heic" || ext === "heif") return "image/heic";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "tif" || ext === "tiff") return "image/tiff";
  return "";
};

const toJpegBuffer = async (input: Buffer): Promise<Buffer> => {
  // Rotate based on EXIF, cap size, convert to JPEG for consistent embedding
  return sharp(input)
    .rotate()
    .resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .jpeg({ quality: 85 })
    .toBuffer();
};

const loadPdfOrImageAsPages = async (
  fileBuffer: ArrayBuffer,
  fileType: string,
  targetDoc: PDFDocument,
  fileName?: string
): Promise<PDFPage[]> => {
  if (fileType === "application/pdf") {
    const src = await PDFDocument.load(fileBuffer);
    const copies = await targetDoc.copyPages(src, src.getPageIndices());
    copies.forEach((page) => targetDoc.addPage(page));
    return copies;
  }

  const normalizedType = normalizeImageType(fileType, fileName);
  let workingBuffer: Buffer = Buffer.from(fileBuffer);

  let rotationDegrees = 0;
  if (normalizedType === "image/jpeg" || normalizedType === "image/jpg") {
    const orientation = getJpegOrientation(fileBuffer);
    if (orientation === 3) rotationDegrees = 180;
    else if (orientation === 6) rotationDegrees = 90;
    else if (orientation === 8) rotationDegrees = 270;
  }
  if (!rotationDegrees) {
    try {
      rotationDegrees = await determineVisualRotation(workingBuffer);
    } catch {
      rotationDegrees = 0;
    }
  }
  if (rotationDegrees) {
    workingBuffer = await sharp(workingBuffer)
      .rotate(rotationDegrees, {
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .toBuffer();
  }

  // Convert everything except PNG to JPEG for consistent handling (HEIC/TIFF/web uploads)
  let embeddedBuffer = workingBuffer;
  if (
    normalizedType !== "image/png" &&
    normalizedType !== "image/jpeg" &&
    normalizedType !== "image/jpg"
  ) {
    embeddedBuffer = await toJpegBuffer(workingBuffer);
  }

  const embedded =
    normalizedType === "image/png"
      ? await targetDoc.embedPng(embeddedBuffer)
      : await targetDoc.embedJpg(embeddedBuffer);

  const page = targetDoc.addPage([DEFAULT_PAGE.width, DEFAULT_PAGE.height]);
  const pageWidth = DEFAULT_PAGE.width;
  const pageHeight = DEFAULT_PAGE.height;
  const drawableWidth = pageWidth - PAGE_MARGIN * 2;
  // Leave room at bottom for sticker and footer
  const drawableHeight = pageHeight - PAGE_MARGIN * 2 - STICKER_HEIGHT - 12;
  const scale = Math.min(
    drawableWidth / embedded.width,
    drawableHeight / embedded.height,
    1
  );
  const drawWidth = embedded.width * scale;
  const drawHeight = embedded.height * scale;
  const x = (pageWidth - drawWidth) / 2;
  const y = (pageHeight - drawHeight) / 2 + STICKER_HEIGHT / 2;
  page.drawImage(embedded, { x, y, width: drawWidth, height: drawHeight });
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
    let matterName = "CaseReady Exhibit Packet";
    let caseNumber: string | null = null;
    try {
      const parsed = JSON.parse(metadataRaw);
      exhibitsInput = Array.isArray(parsed?.exhibits) ? parsed.exhibits : [];
      if (parsed?.matterName) {
        matterName = String(parsed.matterName);
      }
      if (parsed?.caseNumber) {
        caseNumber = String(parsed.caseNumber);
      }
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
    const pageNumberFont = batesFont;
    let batesCounter = 1;
    const firstLabel =
      (exhibitsInput[0]?.label || getExhibitLabel(0)).trim() || "A";

    // Cover and index placeholders
    const cover = pdfDoc.addPage([DEFAULT_PAGE.width, DEFAULT_PAGE.height]);
    const indexPage = pdfDoc.addPage([DEFAULT_PAGE.width, DEFAULT_PAGE.height]);

    const tocEntries: TocEntry[] = [];
    let runningPageNumber = 3; // cover + index already added

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
      const label = (exhibit.label || getExhibitLabel(i)).trim() || "A";
      const description =
        sanitizeText(exhibit.description?.trim() || file.name || `Exhibit ${label}`);

      const startBates = batesCounter;
      const startPage = runningPageNumber;

      const pages = await loadPdfOrImageAsPages(
        buffer,
        file.type || "",
        pdfDoc,
        file.name
      );
      const endBates = startBates + pages.length - 1;
      const endPage = startPage + pages.length - 1;

      pages.forEach((page) => {
        drawExhibitStamp(page, label, exhibitFont);
        const batesValue = `${BATES_PREFIX}${String(batesCounter).padStart(4, "0")}`;
        drawExhibitSticker(page, label, batesValue, batesFont);
        drawBatesStamp(page, batesCounter++, batesFont);
      });

      tocEntries.push({
        description,
        range: `pp. ${startPage}–${endPage}`,
      });

      runningPageNumber = endPage + 1;

    }

    // Draw index after we know ranges
    drawIndexPage(indexPage, tocEntries, batesFont, exhibitFont);

    // Overall Bates range for cover
    const overallEndBates = Math.max(1, batesCounter - 1);
    drawCoverPage(cover, {
      exhibitLabel: firstLabel,
      matterName,
      caseNumber,
      generatedDate: new Date().toLocaleDateString(),
      batesRange: `${BATES_PREFIX}${String(1).padStart(4, "0")} – ${BATES_PREFIX}${String(
        overallEndBates
      ).padStart(4, "0")}`,
      font: batesFont,
      boldFont: exhibitFont,
    });

    const allPages = pdfDoc.getPages();
    const totalPages = allPages.length;
    allPages.forEach((page, idx) => {
      drawPageNumber(page, idx + 1, totalPages, pageNumberFont);
    });

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
