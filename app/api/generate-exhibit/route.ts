import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  PDFDocument,
  PDFPage,
  PDFFont,
  StandardFonts,
  degrees,
  rgb,
} from "pdf-lib";
import sharp from "sharp";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabaseConfig";
import {
  FormatOptions,
  FormatPreset,
  resolveFormattingForPlan,
  StickerPosition,
} from "@/lib/formatting";
import { getUserPlan } from "@/lib/userPlan";

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

const getStickerColor = (label: string, colorCoded: boolean) => {
  if (!colorCoded) return { fill: rgb(0.99, 0.99, 0.99), border: rgb(0.8, 0.85, 0.9) };
  const palette = [
    rgb(0.91, 0.96, 1),
    rgb(0.93, 0.95, 0.99),
    rgb(0.96, 0.92, 0.99),
    rgb(0.94, 0.99, 0.95),
  ];
  const borderPalette = [
    rgb(0.45, 0.62, 0.85),
    rgb(0.48, 0.56, 0.78),
    rgb(0.6, 0.48, 0.74),
    rgb(0.42, 0.62, 0.52),
  ];
  const idx = label.charCodeAt(0) % palette.length;
  return { fill: palette[idx], border: borderPalette[idx] };
};

const drawExhibitSticker = (
  page: PDFPage,
  label: string,
  batesValue: string,
  font: PDFFont,
  position: StickerPosition,
  colorCoded: boolean
) => {
  const { width, height } = page.getSize();
  const { fill, border } = getStickerColor(label, colorCoded);
  if (position === "left-vertical") {
    const rectWidth = STICKER_HEIGHT;
    const rectHeight = STICKER_WIDTH;
    const x = PAGE_MARGIN;
    const y = height - PAGE_MARGIN - rectHeight;
    page.drawRectangle({
      x,
      y,
      width: rectWidth,
      height: rectHeight,
      color: fill,
      borderColor: border,
      borderWidth: 1,
    });
    const textX = x + rectWidth / 2 - 6;
    const textY = y + rectHeight / 2 - 6;
    page.drawText(sanitizeText(`Exhibit ${label}`), {
      x: textX,
      y: textY,
      size: 10,
      font,
      rotate: degrees(90),
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText(sanitizeText(batesValue), {
      x: textX + 12,
      y: textY - 20,
      size: 9,
      font,
      rotate: degrees(90),
      color: rgb(0.2, 0.2, 0.25),
    });
    return;
  }

  const x = width - PAGE_MARGIN - STICKER_WIDTH;
  const y = position === "top-right" ? height - PAGE_MARGIN - STICKER_HEIGHT : PAGE_MARGIN;
  page.drawRectangle({
    x,
    y,
    width: STICKER_WIDTH,
    height: STICKER_HEIGHT,
    color: fill,
    borderColor: border,
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
    y: Math.max(16, PAGE_MARGIN - 8),
    size,
    font,
    color: rgb(0.2, 0.2, 0.25),
  });
};

const drawBrandingFooter = (page: PDFPage, font: PDFFont, text: string) => {
  const size = 8;
  page.drawText(sanitizeText(text), {
    x: PAGE_MARGIN,
    y: Math.max(14, PAGE_MARGIN - 18),
    size,
    font,
    color: rgb(0.28, 0.32, 0.38),
  });
};

const drawWatermark = (page: PDFPage, font: PDFFont, text: string) => {
  if (!text) return;
  const { width, height } = page.getSize();
  const fontSize = 36;
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  page.drawText(text, {
    x: (width - textWidth) / 2,
    y: height / 2,
    size: fontSize,
    font,
    color: rgb(0.8, 0.82, 0.86),
    rotate: degrees(-35),
    opacity: 0.25,
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

const addSlipSheet = (
  doc: PDFDocument,
  label: string,
  matterName: string,
  boldFont: PDFFont,
  font: PDFFont,
  footerText: string
) => {
  const page = doc.addPage([DEFAULT_PAGE.width, DEFAULT_PAGE.height]);
  const { width, height } = page.getSize();
  const title = sanitizeText(`Exhibit ${label}`);
  const sub = sanitizeText(matterName);
  const titleWidth = boldFont.widthOfTextAtSize(title, 26);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: height / 2 + 20,
    size: 26,
    font: boldFont,
    color: rgb(0.12, 0.15, 0.2),
  });
  const subWidth = font.widthOfTextAtSize(sub, 13);
  page.drawText(sub, {
    x: (width - subWidth) / 2,
    y: height / 2 - 4,
    size: 13,
    font,
    color: rgb(0.24, 0.26, 0.3),
  });
  if (footerText) {
    drawBrandingFooter(page, font, footerText);
  }
  return page;
};

const drawCoverPage = (
  page: PDFPage,
  options: {
    exhibitLabel: string;
    matterName: string;
    caseNumber?: string | null;
    caseTitle?: string;
    courtName?: string;
    generatedDate: string;
    batesRange: string;
    font: PDFFont;
    boldFont: PDFFont;
    showBranding: boolean;
    coverTemplate: "classic" | "modern" | "black-bar";
    contactBlock?: string;
    firmLogoUrl?: string;
    footerText?: string;
  }
) => {
  const {
    exhibitLabel,
    matterName,
    caseNumber,
    caseTitle,
    courtName,
    generatedDate,
    batesRange,
    font,
    boldFont,
    showBranding,
    coverTemplate,
    contactBlock,
    firmLogoUrl,
    footerText,
  } = options;
  const { width, height } = page.getSize();
  const centerX = width / 2;

  if (coverTemplate === "modern") {
    page.drawRectangle({
      x: 0,
      y: height - 180,
      width,
      height: 180,
      color: rgb(0.02, 0.35, 0.78),
      opacity: 0.1,
    });
  } else if (coverTemplate === "black-bar") {
    page.drawRectangle({
      x: 0,
      y: height - 120,
      width,
      height: 120,
      color: rgb(0.08, 0.08, 0.12),
      opacity: 0.92,
    });
    page.drawText("Exhibit Packet", {
      x: PAGE_MARGIN,
      y: height - 70,
      size: 14,
      font: boldFont,
      color: rgb(1, 1, 1),
    });
  }

  const title = sanitizeText(caseTitle || `EXHIBIT ${exhibitLabel}`);
  const subtitle = caseTitle ? sanitizeText(`Exhibit ${exhibitLabel}`) : "";
  const titleWidth = boldFont.widthOfTextAtSize(title, 26);
  page.drawText(title, {
    x: centerX - titleWidth / 2,
    y: height - 170,
    size: 26,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  if (subtitle) {
    const subtitleWidth = font.widthOfTextAtSize(subtitle, 12);
    page.drawText(subtitle, {
      x: centerX - subtitleWidth / 2,
      y: height - 190,
      size: 12,
      font,
      color: rgb(0.2, 0.22, 0.26),
    });
  }

  page.drawLine({
    start: { x: PAGE_MARGIN, y: height - 205 },
    end: { x: width - PAGE_MARGIN, y: height - 205 },
    thickness: 0.6,
    color:
      coverTemplate === "black-bar" ? rgb(0.9, 0.9, 0.9) : rgb(0.82, 0.85, 0.9),
  });

  const lines = [
    courtName ? sanitizeText(courtName) : "",
    sanitizeText(matterName),
    caseNumber ? sanitizeText(`Case No.: ${caseNumber}`) : "",
    sanitizeText(`Generated: ${generatedDate}`),
    sanitizeText(`Bates: ${batesRange}`),
  ];

  if (showBranding) {
    lines.splice(4, 0, sanitizeText("Prepared with CaseReady Exhibit Builder"));
  }

  const compacted = lines.filter(Boolean);

  let offsetY = height - 240;
  compacted.forEach((line, index) => {
    const size = index <= 1 ? 13 : 12;
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
    offsetY -= 22;
  });

  if (contactBlock) {
    page.drawRectangle({
      x: PAGE_MARGIN,
      y: PAGE_MARGIN + 120,
      width: width - PAGE_MARGIN * 2,
      height: 60,
      color: rgb(0.98, 0.99, 1),
      borderColor: rgb(0.86, 0.89, 0.94),
      borderWidth: 0.8,
    });
    page.drawText(sanitizeText(contactBlock), {
      x: PAGE_MARGIN + 12,
      y: PAGE_MARGIN + 140,
      size: 11,
      font,
      color: rgb(0.16, 0.18, 0.22),
      maxWidth: width - PAGE_MARGIN * 2 - 24,
    });
  }

  if (firmLogoUrl) {
    page.drawText("[Firm logo]", {
      x: PAGE_MARGIN,
      y: height - 130,
      size: 10,
      font,
      color: rgb(0.25, 0.28, 0.32),
    });
  }

  if (footerText) {
    const textWidth = font.widthOfTextAtSize(footerText, 10);
    page.drawText(footerText, {
      x: centerX - textWidth / 2,
      y: PAGE_MARGIN + 16,
      size: 10,
      font,
      color: rgb(0.25, 0.28, 0.32),
    });
  }
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
  try {
    return await sharp(input)
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
  } catch (err) {
    // Common on platforms without HEIC support
    throw new Error("Image conversion failed (possible HEIC/unsupported format).");
  }
};

const loadPdfOrImageAsPages = async (
  fileBuffer: ArrayBuffer,
  fileType: string,
  targetDoc: PDFDocument,
  options: { stickerPosition: StickerPosition; fileName?: string }
): Promise<PDFPage[]> => {
  const { stickerPosition, fileName } = options;
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
  const topMargin =
    PAGE_MARGIN + (stickerPosition === "top-right" ? STICKER_HEIGHT + 12 : 0);
  const bottomMargin =
    PAGE_MARGIN + (stickerPosition === "bottom-right" ? STICKER_HEIGHT + 12 : 0);
  const leftMargin = stickerPosition === "left-vertical" ? PAGE_MARGIN + STICKER_HEIGHT + 8 : PAGE_MARGIN;
  const drawableWidth = pageWidth - leftMargin - PAGE_MARGIN;
  const drawableHeight = pageHeight - topMargin - bottomMargin;
  const scale = Math.min(
    drawableWidth / embedded.width,
    drawableHeight / embedded.height,
    1
  );
  const drawWidth = embedded.width * scale;
  const drawHeight = embedded.height * scale;
  const x = leftMargin + (drawableWidth - drawWidth) / 2;
  const y = bottomMargin + (drawableHeight - drawHeight) / 2;
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
    const plan = getUserPlan(user);
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
    let formatPreset: FormatPreset | string | null = null;
    let formatOptions: Partial<FormatOptions> | null = null;
    try {
      const parsed = JSON.parse(metadataRaw);
      exhibitsInput = Array.isArray(parsed?.exhibits) ? parsed.exhibits : [];
      if (parsed?.matterName) {
        matterName = String(parsed.matterName);
      }
      if (parsed?.caseNumber) {
        caseNumber = String(parsed.caseNumber);
      }
      if (parsed?.formatPreset) {
        formatPreset = parsed.formatPreset;
      }
      if (parsed?.formatOptions && typeof parsed.formatOptions === "object") {
        formatOptions = parsed.formatOptions;
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

    const { preset: activePreset, options: activeOptions } =
      resolveFormattingForPlan({
        preset: formatPreset,
        options: formatOptions,
        plan,
      });
    const includeCover = activePreset !== "quick" && activeOptions.include_cover;
    const includeIndex =
      activePreset !== "quick" && activeOptions.include_index;
    const showBranding =
      activePreset === "quick"
        ? true
        : activeOptions.show_caseready_branding || plan === "free";
    const stickerPosition = activeOptions.sticker_position ?? "top-right";
    const coverTemplate = activeOptions.cover_template ?? "classic";
    const watermarkText =
      activePreset === "firm_branded" ? activeOptions.watermark_text || "" : "";
    const colorCodedStickers =
      activePreset === "firm_branded" && activeOptions.color_coded_stickers;
    const slipSheets =
      activePreset === "firm_branded" && activeOptions.slip_sheets;
    const footerText =
      activePreset === "firm_branded" && activeOptions.footer_text
        ? activeOptions.footer_text
        : showBranding
        ? "Prepared with CaseReady"
        : "";
    const contactBlock =
      activePreset !== "quick" && activeOptions.include_contact_block
        ? activeOptions.contact_block_text || ""
        : "";
    const courtName = activePreset !== "quick" ? activeOptions.court_name || "" : "";
    const caseTitle = activePreset !== "quick" ? activeOptions.case_title || "" : "";
    const firmLogoUrl =
      activePreset === "firm_branded" ? activeOptions.firm_logo_url || "" : "";

    const pdfDoc = await PDFDocument.create();
    const exhibitFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const batesFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pageNumberFont = batesFont;
    let batesCounter = 1;
    const firstLabel =
      (exhibitsInput[0]?.label || getExhibitLabel(0)).trim() || "A";

    const cover = includeCover
      ? pdfDoc.addPage([DEFAULT_PAGE.width, DEFAULT_PAGE.height])
      : null;
    const indexPage = includeIndex
      ? pdfDoc.addPage([DEFAULT_PAGE.width, DEFAULT_PAGE.height])
      : null;

    const tocEntries: TocEntry[] = [];
    const prefixPages = (includeCover ? 1 : 0) + (includeIndex ? 1 : 0);
    let runningPageNumber = prefixPages + 1;

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

      if (slipSheets) {
        const slip = addSlipSheet(
          pdfDoc,
          label,
          matterName,
          exhibitFont,
          batesFont,
          footerText
        );
        drawExhibitStamp(slip, label, exhibitFont);
        const batesValue = `${BATES_PREFIX}${String(batesCounter).padStart(4, "0")}`;
        drawExhibitSticker(slip, label, batesValue, batesFont, stickerPosition, colorCodedStickers);
        drawBatesStamp(slip, batesCounter++, batesFont);
        drawWatermark(slip, batesFont, watermarkText);
        runningPageNumber += 1;
      }

      let pages: PDFPage[];
      try {
        pages = await loadPdfOrImageAsPages(
          buffer,
          file.type || "",
          pdfDoc,
          { stickerPosition, fileName: file.name }
        );
      } catch (fileError) {
        console.error("Failed to process file", { name: file.name, type: file.type, fileError });
        return NextResponse.json(
          {
            ok: false,
            message:
              "We couldn’t process one of the uploads. If it’s an iPhone HEIC photo, try exporting as JPEG/PNG and re-upload.",
          },
          { status: 400 }
        );
      }
      const endBates = startBates + pages.length - 1;
      const endPage = startPage + pages.length - 1;

      pages.forEach((page) => {
        drawExhibitStamp(page, label, exhibitFont);
        const batesValue = `${BATES_PREFIX}${String(batesCounter).padStart(4, "0")}`;
        drawExhibitSticker(
          page,
          label,
          batesValue,
          batesFont,
          stickerPosition,
          colorCodedStickers
        );
        drawBatesStamp(page, batesCounter++, batesFont);
        drawWatermark(page, batesFont, watermarkText);
      });

      if (includeIndex) {
        tocEntries.push({
          description,
          range: `pp. ${startPage}–${endPage}`,
        });
      }

      runningPageNumber = endPage + 1;

    }

    if (includeIndex && indexPage) {
      drawIndexPage(indexPage, tocEntries, batesFont, exhibitFont);
    }

    if (includeCover && cover) {
      const overallEndBates = Math.max(1, batesCounter - 1);
      drawCoverPage(cover, {
        exhibitLabel: firstLabel,
        matterName,
        caseNumber,
        caseTitle,
        courtName,
        generatedDate: new Date().toLocaleDateString(),
        batesRange: `${BATES_PREFIX}${String(1).padStart(4, "0")} – ${BATES_PREFIX}${String(
          overallEndBates
        ).padStart(4, "0")}`,
        font: batesFont,
        boldFont: exhibitFont,
        showBranding,
        coverTemplate,
        contactBlock,
        firmLogoUrl,
        footerText,
      });
    }

    const allPages = pdfDoc.getPages();
    const totalPages = allPages.length;
    allPages.forEach((page, idx) => {
      drawPageNumber(page, idx + 1, totalPages, pageNumberFont);
      const footerLine =
        footerText ||
        (showBranding ? "Prepared with CaseReady" : "");
      if (footerLine) {
        drawBrandingFooter(page, pageNumberFont, footerLine);
      }
    });

    const pdfBytes = await pdfDoc.save(
      activeOptions.optimized_pdf !== false ? { useObjectStreams: true } : undefined
    );
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
