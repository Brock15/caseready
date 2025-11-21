import { NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import Tesseract from "tesseract.js";

export const runtime = "nodejs";

type KeywordBox = {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

const pdfjsLibPromise = import("pdfjs-dist/legacy/build/pdf.mjs");
const MAX_KEYWORDS = 20;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const prompt = (formData.get("prompt")?.toString() ?? "").slice(0, 500);

  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ ok: false, message: "File required" }), {
      status: 400,
    });
  }

  const buffer = await file.arrayBuffer();
  const sanitizedPrompt = prompt || "Sensitive content";
  const keywords = buildKeywords(sanitizedPrompt);

  let pdfDoc: PDFDocument;
  let pageMeta:
    | { type: "pdf" }
    | { type: "image"; pageIndex: number; width: number; height: number }
    | null = null;

  try {
    if (file.type === "application/pdf") {
      pdfDoc = await PDFDocument.load(buffer);
      pageMeta = { type: "pdf" };
    } else {
      pdfDoc = await PDFDocument.create();
      pageMeta = await embedImageAsPage(pdfDoc, buffer, file.type);
    }
  } catch (error) {
    console.error("Failed to load file", error);
    return new Response(JSON.stringify({ ok: false, message: "Unable to process file" }), {
      status: 400,
    });
  }

  let boxes: KeywordBox[] = [];
  try {
    if (pageMeta?.type === "pdf") {
      boxes = await extractPdfBoxes(buffer, pdfDoc, keywords);
    } else if (pageMeta?.type === "image") {
      boxes = await extractImageBoxes(buffer, keywords, pageMeta);
    }
  } catch (error) {
    console.error("Failed to analyze document for redaction", error);
  }

  if (boxes.length === 0) {
    await applyFallbackOverlay(pdfDoc, sanitizedPrompt);
  } else {
    applyTargetedBoxes(pdfDoc, boxes);
    await annotateRedactionSummary(pdfDoc, keywords.slice(0, 5));
  }

  const pdfBytes = await pdfDoc.save();
  return new Response(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="caseready-redacted.pdf"',
    },
  });
}

function buildKeywords(prompt: string) {
  const lowered = prompt.toLowerCase();
  const rawSegments = lowered
    .split(/[\n,.;]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  const keywords = new Set<string>();

  rawSegments.forEach((segment) => {
    if (segment.length >= 2) {
      keywords.add(segment);
    }
    segment
      .split(/\s+/)
      .filter(Boolean)
      .forEach((word) => {
        if (word.length >= 3 || /\d/.test(word)) {
          keywords.add(word);
        }
      });
  });

  if (!keywords.size && lowered.trim()) {
    keywords.add(lowered.trim());
  }

  return Array.from(keywords).slice(0, MAX_KEYWORDS);
}

async function embedImageAsPage(
  pdfDoc: PDFDocument,
  buffer: ArrayBuffer,
  mime: string
) {
  let embedded;
  if (mime === "image/png") {
    embedded = await pdfDoc.embedPng(buffer);
  } else if (mime === "image/jpeg" || mime === "image/jpg") {
    embedded = await pdfDoc.embedJpg(buffer);
  } else {
    throw new Error("Unsupported image type");
  }

  const page = pdfDoc.addPage([embedded.width, embedded.height]);
  page.drawImage(embedded, {
    x: 0,
    y: 0,
    width: embedded.width,
    height: embedded.height,
  });

  return {
    type: "image" as const,
    pageIndex: pdfDoc.getPageCount() - 1,
    width: embedded.width,
    height: embedded.height,
  };
}

async function extractPdfBoxes(buffer: ArrayBuffer, pdfDoc: PDFDocument, keywords: string[]) {
  if (!keywords.length) return [];

  const pdfjsLib = await pdfjsLibPromise;
  if (!pdfjsLib.GlobalWorkerOptions?.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.mjs",
      import.meta.url
    ).toString();
  }

  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  const boxes: KeywordBox[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    const pdfPage = pdfDoc.getPage(pageNumber - 1);
    const widthScale = pdfPage.getWidth() / viewport.width;
    const heightScale = pdfPage.getHeight() / viewport.height;

    (textContent.items as any[]).forEach((rawItem) => {
      if (typeof rawItem?.str !== "string") return;
      const text = rawItem.str.trim();
      if (!text) return;
      const normalized = text.toLowerCase();
      const matches = keywords.some((keyword) => normalized.includes(keyword));
      if (!matches) return;

      const transform = rawItem.transform as number[] | undefined;
      if (!transform || transform.length < 6) return;
      const fontHeight = Math.hypot(transform[2], transform[3]) || Math.abs(transform[3]) || 12;
      const rawWidth =
        typeof rawItem.width === "number"
          ? rawItem.width
          : text.length * (fontHeight * 0.6);

      const x = transform[4] * widthScale;
      const yTop = transform[5] * heightScale;
      const width = rawWidth * widthScale;
      const height = fontHeight * heightScale;
      const y = pdfPage.getHeight() - yTop - height;

      boxes.push({
        pageIndex: pageNumber - 1,
        x: Math.max(0, x - 1.5),
        y: Math.max(0, y - 1),
        width: width + 3,
        height: height + 2,
      });
    });
  }

  return boxes;
}

async function extractImageBoxes(
  buffer: ArrayBuffer,
  keywords: string[],
  meta: { pageIndex: number; width: number; height: number }
) {
  if (!keywords.length) return [];

  const { data } = await Tesseract.recognize(Buffer.from(buffer), "eng", {
    logger: () => {},
  });

  // Tesseract types mark word data loosely; coerce to avoid build-time errors.
  const pageData = data as {
    words?: Array<{
      text?: string;
      bbox?: { x0: number; y0: number; x1: number; y1: number };
    }>;
    imageSize?: { width?: number; height?: number };
  };

  const words = pageData?.words ?? [];
  const imageWidth = pageData?.imageSize?.width ?? meta.width;
  const imageHeight = pageData?.imageSize?.height ?? meta.height;
  const widthScale = meta.width / imageWidth;
  const heightScale = meta.height / imageHeight;

  const boxes: KeywordBox[] = [];
  words.forEach((word) => {
    const text = word.text?.trim();
    if (!text) return;
    const normalized = text.toLowerCase();
    if (!keywords.some((keyword) => normalized.includes(keyword))) return;
    if (!word.bbox) return;

    const { x0, y0, x1, y1 } = word.bbox;
    const width = (x1 - x0) * widthScale;
    const height = (y1 - y0) * heightScale;
    const x = x0 * widthScale;
    const y = meta.height - y1 * heightScale;

    boxes.push({
      pageIndex: meta.pageIndex,
      x: Math.max(0, x - 2),
      y: Math.max(0, y - 2),
      width: width + 4,
      height: height + 4,
    });
  });

  return boxes;
}

function applyTargetedBoxes(pdfDoc: PDFDocument, boxes: KeywordBox[]) {
  boxes.forEach((box) => {
    const page = pdfDoc.getPage(box.pageIndex);
    page.drawRectangle({
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      color: rgb(0, 0, 0),
    });
  });
}

async function applyFallbackOverlay(pdfDoc: PDFDocument, prompt: string) {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  pdfDoc.getPages().forEach((page, pageIndex) => {
    const { width, height } = page.getSize();
    const margin = 48;
    const headerHeight = 120;
    const redactHeight = Math.max(0, height - headerHeight - margin);

    page.drawRectangle({
      x: 0,
      y: height - headerHeight,
      width,
      height: headerHeight,
      color: rgb(0.97, 0.97, 0.97),
    });

    page.drawRectangle({
      x: margin,
      y: margin,
      width: width - margin * 2,
      height: redactHeight,
      color: rgb(0, 0, 0),
    });

    page.drawText("CaseReady Redaction", {
      x: margin,
      y: height - 60,
      size: 18,
      font: bold,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText(`Instructions: ${prompt}`, {
      x: margin,
      y: height - 85,
      maxWidth: width - margin * 2,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
      lineHeight: 14,
    });
    page.drawText(`Page ${pageIndex + 1}`, {
      x: width - margin - 50,
      y: margin - 20,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  });
}

async function annotateRedactionSummary(pdfDoc: PDFDocument, keywords: string[]) {
  if (!keywords.length || pdfDoc.getPageCount() === 0) return;
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.getPage(0);
  const { width, height } = page.getSize();

  page.drawRectangle({
    x: 24,
    y: height - 80,
    width: Math.min(width - 48, 320),
    height: 56,
    color: rgb(1, 1, 1),
    opacity: 0.85,
  });

  page.drawText("Auto redaction applied", {
    x: 32,
    y: height - 48,
    size: 12,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText(`Keywords: ${keywords.join(", ")}`, {
    x: 32,
    y: height - 64,
    size: 10,
    font,
    color: rgb(0.25, 0.25, 0.25),
  });
}
