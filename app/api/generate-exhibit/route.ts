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
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabaseConfig";
import {
  FormatOptions,
  FormatPreset,
  resolveFormattingForPlan,
  StickerPosition,
  ExhibitNumberingType,
} from "@/lib/formatting";
import { getUserPlan } from "@/lib/userPlan";

type ExhibitInput = {
  label?: string;
  description?: string;
  detectedDate?: string;
  fileIndex: number;
  excludeFromLettering?: boolean;
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

const getExhibitLabel = (index: number, type: ExhibitNumberingType = "letters"): string => {
  if (type === "numbers") {
    return (index + 1).toString();
  }

  if (type === "roman") {
    const romanNumerals = [
      ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"],
      ["", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"],
      ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM"],
    ];
    const num = index + 1;
    if (num > 399) return num.toString(); // Fallback for large numbers
    const hundreds = Math.floor(num / 100);
    const tens = Math.floor((num % 100) / 10);
    const ones = num % 10;
    return romanNumerals[2][hundreds] + romanNumerals[1][tens] + romanNumerals[0][ones];
  }

  // Default: letters (A, B, C, ...)
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  let n = index;
  do {
    result = alphabet[n % 26] + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
};

// Removed: drawExhibitStamp - redundant with stickers and too verbose for court-ready exhibits

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
  label: string;
  description: string;
  batesRange: string;
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
  const labelWidth = 40;
  const batesWidth = 140;

  entries.forEach((entry, idx) => {
    const y = startY - idx * lineHeight;
    const label = sanitizeText(entry.label);
    const desc = sanitizeText(entry.description);
    const batesRange = sanitizeText(entry.batesRange);

    // Draw exhibit label (A, B, C, etc.)
    page.drawText(label, {
      x: PAGE_MARGIN,
      y,
      size: 12,
      font: boldFont,
      color: rgb(0.15, 0.16, 0.18),
    });

    // Draw description
    page.drawText(desc, {
      x: PAGE_MARGIN + labelWidth,
      y,
      size: 12,
      font,
      color: rgb(0.15, 0.16, 0.18),
      maxWidth: width - PAGE_MARGIN * 2 - labelWidth - batesWidth,
    });

    // Draw Bates range (right-aligned)
    const batesRangeWidth = font.widthOfTextAtSize(batesRange, 12);
    page.drawText(batesRange, {
      x: width - PAGE_MARGIN - batesRangeWidth,
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

const toJpegBuffer = async (input: Buffer, debugInfo: { name: string; type: string; size: number }): Promise<Buffer> => {
  // Cap size and convert to JPEG. Rotate based on EXIF orientation for correct display.
  console.log("[toJpegBuffer] Starting conversion:", debugInfo);

  // For HEIC/HEIF files, use special handling with explicit format conversion
  const isHeic = debugInfo.type === "image/heic" || debugInfo.type === "image/heif" ||
                 debugInfo.name.toLowerCase().endsWith(".heic") ||
                 debugInfo.name.toLowerCase().endsWith(".heif");

  if (isHeic) {
    console.log("[toJpegBuffer] HEIC/HEIF detected, using explicit conversion...");
    try {
      // For HEIC, explicitly specify the format and use a simpler pipeline
      const result = await sharp(input, {
        failOnError: false,
        unlimited: true, // Allow processing of large images
      })
        .toFormat("jpeg") // Explicitly convert to JPEG first
        .rotate() // Then apply EXIF orientation
        .resize({
          width: MAX_IMAGE_DIMENSION,
          height: MAX_IMAGE_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
      console.log("[toJpegBuffer] HEIC conversion success, output size:", result.length);
      return result;
    } catch (heicErr) {
      console.error("[toJpegBuffer] HEIC conversion failed:", heicErr);
      // Try without rotation as fallback for HEIC
      try {
        const result = await sharp(input, {
          failOnError: false,
          unlimited: true,
        })
          .toFormat("jpeg")
          .resize({
            width: MAX_IMAGE_DIMENSION,
            height: MAX_IMAGE_DIMENSION,
            fit: "inside",
            withoutEnlargement: true,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          })
          .jpeg({ quality: 85, mozjpeg: true })
          .toBuffer();
        console.log("[toJpegBuffer] HEIC conversion without rotation success:", result.length);
        return result;
      } catch (finalErr) {
        console.error("[toJpegBuffer] HEIC conversion completely failed:", finalErr);
        throw new Error(`HEIC/HEIF conversion not supported on this server. Please convert your iPhone photos to JPEG before uploading.`);
      }
    }
  }

  // Standard image processing for JPEG, PNG, etc.
  try {
    // Sharp's rotate() with no arguments applies EXIF orientation then removes the EXIF data
    // This ensures images display correctly regardless of how they were taken
    console.log("[toJpegBuffer] Attempting standard conversion with rotation...");
    const result = await sharp(input, { failOnError: false })
      .rotate() // Apply EXIF orientation (auto-rotate to correct orientation)
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
    console.log("[toJpegBuffer] Success with rotation, output size:", result.length);
    return result;
  } catch (err) {
    // If rotation/conversion fails, try without rotation as fallback
    console.error("[toJpegBuffer] Rotation failed:", err);
    console.log("[toJpegBuffer] Attempting without rotation...");
    try {
      const result = await sharp(input, { failOnError: false })
        .resize({
          width: MAX_IMAGE_DIMENSION,
          height: MAX_IMAGE_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
      console.log("[toJpegBuffer] Success without rotation, output size:", result.length);
      return result;
    } catch (fallbackErr) {
      // Common on platforms without HEIC support or corrupt images
      console.error("[toJpegBuffer] Both attempts failed:", fallbackErr);
      throw new Error(`Image conversion failed (${debugInfo.type}, ${debugInfo.size} bytes).`);
    }
  }
};

const loadPdfOrImageAsPages = async (
  fileBuffer: ArrayBuffer,
  fileType: string,
  targetDoc: PDFDocument,
  options: { stickerPosition: StickerPosition; fileName: string; fileSize: number }
): Promise<PDFPage[]> => {
  const { stickerPosition, fileName, fileSize } = options;
  console.log("[loadPdfOrImageAsPages] Processing file:", { fileName, fileType, fileSize });

  if (fileType === "application/pdf") {
    console.log("[loadPdfOrImageAsPages] Loading as PDF...");
    const src = await PDFDocument.load(fileBuffer);
    const copies = await targetDoc.copyPages(src, src.getPageIndices());
    copies.forEach((page) => targetDoc.addPage(page));
    console.log("[loadPdfOrImageAsPages] PDF loaded successfully, pages:", copies.length);
    return copies;
  }

  console.log("[loadPdfOrImageAsPages] Processing as image...");
  let workingBuffer: Buffer = Buffer.from(fileBuffer);

  // Convert and rotate image based on EXIF orientation for correct display
  const embeddedBuffer = await toJpegBuffer(workingBuffer, {
    name: fileName,
    type: fileType,
    size: fileSize
  });
  console.log("[loadPdfOrImageAsPages] Image converted, embedding in PDF...");
  const embedded = await targetDoc.embedJpg(embeddedBuffer);
  console.log("[loadPdfOrImageAsPages] Image embedded successfully");

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
  console.log("[POST] === Starting exhibit generation request ===");
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Cookie setting can fail in middleware
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: "", ...options });
            } catch (error) {
              // Cookie removal can fail in middleware
            }
          },
        },
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
    let coverPageFile: File | null = null;

    for (const [key, value] of formData.entries()) {
      if (key === "files" && value instanceof File) {
        files.push(value);
      } else if (key === "coverPage" && value instanceof File) {
        coverPageFile = value;
      }
    }

    console.log("[POST] Received files:", files.map(f => ({ name: f.name, type: f.type, size: f.size })));
    if (coverPageFile) {
      console.log("[POST] Cover page file:", { name: coverPageFile.name, type: coverPageFile.type, size: coverPageFile.size });
    }

    if (files.length === 0) {
      console.error("[POST] No files received");
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

    // Court-ready defaults: no auto-generated covers, stickers OFF, page numbers OFF
    const includeCover = false; // Never auto-generate covers
    const includeIndex = activeOptions.include_index;
    const showExhibitStickers = activeOptions.show_exhibit_stickers ?? false;
    const showPageNumbers = activeOptions.show_page_numbers ?? false;
    const brandingPlacement = activeOptions.branding_placement ?? "metadata";
    const stickerPosition = activeOptions.sticker_position ?? "top-right";
    const watermarkText =
      activePreset === "firm_branded" ? activeOptions.watermark_text || "" : "";
    const colorCodedStickers =
      activePreset === "firm_branded" && activeOptions.color_coded_stickers;
    const slipSheets =
      activePreset === "firm_branded" && activeOptions.slip_sheets;
    const footerText =
      activePreset === "firm_branded" && activeOptions.footer_text
        ? activeOptions.footer_text
        : "";
    const contactBlock =
      activePreset !== "quick" && activeOptions.include_contact_block
        ? activeOptions.contact_block_text || ""
        : "";
    const courtName = activePreset !== "quick" ? activeOptions.court_name || "" : "";
    const caseTitle = activePreset !== "quick" ? activeOptions.case_title || "" : "";
    const firmLogoUrl =
      activePreset === "firm_branded" ? activeOptions.firm_logo_url || "" : "";
    const exhibitNumberingType = activeOptions.exhibit_numbering_type ?? "letters";

    const pdfDoc = await PDFDocument.create();
    const exhibitFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const batesFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pageNumberFont = batesFont;
    let batesCounter = 1;
    const firstLabel =
      (exhibitsInput[0]?.label || getExhibitLabel(0, exhibitNumberingType)).trim() || (exhibitNumberingType === "numbers" ? "1" : exhibitNumberingType === "roman" ? "I" : "A");

    // Handle cover page - if user uploaded a custom cover page, insert it
    let coverPageCount = 0;
    if (includeCover && coverPageFile) {
      console.log("[POST] Processing custom cover page...");
      try {
        const coverBuffer = await coverPageFile.arrayBuffer();
        const coverPages = await loadPdfOrImageAsPages(
          coverBuffer,
          coverPageFile.type || "",
          pdfDoc,
          {
            stickerPosition,
            fileName: coverPageFile.name,
            fileSize: coverPageFile.size
          }
        );
        coverPageCount = coverPages.length;
        console.log("[POST] Custom cover page added, pages:", coverPageCount);
      } catch (coverError) {
        console.error("[POST] Failed to process cover page:", coverError);
        return NextResponse.json(
          {
            ok: false,
            message: "Failed to process cover page file. Please ensure it's a valid PDF or image.",
          },
          { status: 400 }
        );
      }
    }

    const indexPage = includeIndex
      ? pdfDoc.addPage([DEFAULT_PAGE.width, DEFAULT_PAGE.height])
      : null;

    const tocEntries: TocEntry[] = [];
    const prefixPages = coverPageCount + (includeIndex ? 1 : 0);
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
      const label = (exhibit.label || getExhibitLabel(i, exhibitNumberingType)).trim() || (exhibitNumberingType === "numbers" ? "1" : exhibitNumberingType === "roman" ? "I" : "A");
      const description =
        sanitizeText(exhibit.description?.trim() || file.name || `Exhibit ${label}`);

      const startBates = batesCounter;
      const startPage = runningPageNumber;
      const isExcludedFromLettering = exhibit.excludeFromLettering ?? false;

      if (slipSheets && !isExcludedFromLettering) {
        const slip = addSlipSheet(
          pdfDoc,
          label,
          matterName,
          exhibitFont,
          batesFont,
          footerText
        );
        const batesValue = `${BATES_PREFIX}${String(batesCounter).padStart(4, "0")}`;
        if (showExhibitStickers) {
          drawExhibitSticker(slip, label, batesValue, batesFont, stickerPosition, colorCodedStickers);
        }
        drawBatesStamp(slip, batesCounter++, batesFont);
        drawWatermark(slip, batesFont, watermarkText);
        runningPageNumber += 1;
      }

      console.log(`[POST] Processing exhibit ${i + 1}/${exhibitsInput.length}:`, {
        name: file.name,
        type: file.type,
        size: file.size,
        label,
        excludeFromLettering: isExcludedFromLettering
      });

      let pages: PDFPage[];
      try {
        pages = await loadPdfOrImageAsPages(
          buffer,
          file.type || "",
          pdfDoc,
          {
            stickerPosition,
            fileName: file.name,
            fileSize: file.size
          }
        );
      } catch (fileError) {
        console.error("[POST] Failed to process file", { name: file.name, type: file.type, size: file.size, fileError });
        return NextResponse.json(
          {
            ok: false,
            message:
              "We couldn't process one of the uploads. If it's an iPhone HEIC photo, try exporting as JPEG/PNG and re-upload.",
          },
          { status: 400 }
        );
      }
      const endBates = startBates + pages.length - 1;
      const endPage = startPage + pages.length - 1;

      pages.forEach((page) => {
        const batesValue = `${BATES_PREFIX}${String(batesCounter).padStart(4, "0")}`;
        // Only show exhibit stickers for non-excluded files when enabled
        if (showExhibitStickers && !isExcludedFromLettering) {
          drawExhibitSticker(
            page,
            label,
            batesValue,
            batesFont,
            stickerPosition,
            colorCodedStickers
          );
        }
        drawBatesStamp(page, batesCounter++, batesFont);
        drawWatermark(page, batesFont, watermarkText);
      });

      if (includeIndex && !isExcludedFromLettering) {
        const batesStart = `${BATES_PREFIX}${String(startBates).padStart(4, "0")}`;
        const batesEnd = `${BATES_PREFIX}${String(endBates).padStart(4, "0")}`;
        tocEntries.push({
          label,
          description,
          batesRange: `${batesStart}–${batesEnd}`,
        });
      }

      runningPageNumber = endPage + 1;

    }

    if (includeIndex && indexPage) {
      drawIndexPage(indexPage, tocEntries, batesFont, exhibitFont);
    }

    // Branding placement logic (court-ready: metadata only by default)
    if (brandingPlacement === "final_page") {
      // Add a final page with "Prepared with CaseReady"
      const brandingPage = pdfDoc.addPage([DEFAULT_PAGE.width, DEFAULT_PAGE.height]);
      const { height } = brandingPage.getSize();
      brandingPage.drawText("Prepared with CaseReady", {
        x: PAGE_MARGIN,
        y: height / 2,
        size: 14,
        font: exhibitFont,
        color: rgb(0.4, 0.4, 0.4),
      });
    }

    // Page numbers (only if enabled)
    if (showPageNumbers) {
      const allPages = pdfDoc.getPages();
      const totalPages = allPages.length;
      allPages.forEach((page, idx) => {
        drawPageNumber(page, idx + 1, totalPages, pageNumberFont);
      });
    }

    // Footer on last page only (if branding_placement is footer_last_page)
    if (brandingPlacement === "footer_last_page") {
      const allPages = pdfDoc.getPages();
      if (allPages.length > 0) {
        const lastPage = allPages[allPages.length - 1];
        drawBrandingFooter(lastPage, pageNumberFont, "Prepared with CaseReady");
      }
    }

    // Always set metadata
    pdfDoc.setCreator("CaseReady");
    pdfDoc.setProducer("CaseReady Exhibit Builder");

    console.log("[POST] Saving PDF document...");
    const pdfBytes = await pdfDoc.save(
      activeOptions.optimized_pdf !== false ? { useObjectStreams: true } : undefined
    );
    const pdfBuffer = Buffer.from(pdfBytes);
    console.log("[POST] PDF saved successfully, size:", pdfBuffer.length);

    if (!isUnlimited) {
      await supabase.auth.updateUser({
        data: { exportsUsed: exportsUsed + 1 },
      });
    }

    console.log("[POST] === Exhibit generation completed successfully ===");
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="CaseReady_Exhibits.pdf"',
      },
    });
  } catch (error) {
    console.error("[POST] === EXHIBIT GENERATION FAILED ===");
    console.error("[POST] Error details:", error);
    console.error("[POST] Error stack:", error instanceof Error ? error.stack : "No stack trace");
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
