import { execFile } from "child_process";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import { promisify } from "util";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

const execFileAsync = promisify(execFile);

export interface RedactOptions {
  redactEmails: boolean;
  redactPhones: boolean;
  customPattern?: string;
}

type RedactionBox = {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  viewportWidth?: number;
  viewportHeight?: number;
};

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phoneRegex = /(\+?\d[\d\s().-]{7,}\d)/i;

const pdfjsLibPromise = import("pdfjs-dist/legacy/build/pdf.mjs");

// Minimal canvas factory for pdfjs in Node; we only use text content, not rendering.
class NodeCanvasFactory {
  create(width: number, height: number) {
    return {
      canvas: {
        width,
        height,
        getContext: () => null,
      },
      context: null,
    };
  }
  reset() {
    return undefined;
  }
  destroy() {
    return undefined;
  }
}

export async function redactPdf(pdfBytes: Uint8Array, options: RedactOptions): Promise<Uint8Array> {
  const pdfjsLib = normalizePdfJs(await pdfjsLibPromise);
  const doc = await loadPdfJsDocument(pdfjsLib, pdfBytes);
  const sourcePdf = await PDFDocument.load(pdfBytes);

  const allBoxes: RedactionBox[] = [];
  for (let pageIndex = 0; pageIndex < doc.numPages; pageIndex += 1) {
    const page = await doc.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent({ normalizeWhitespace: true });
    const boxes = buildBoxesFromText(textContent, viewport, pageIndex, options);
    allBoxes.push(...boxes);
  }

  const outDoc = await PDFDocument.create();
  for (let pageIndex = 0; pageIndex < doc.numPages; pageIndex += 1) {
    const { png, width, height } = await rasterizePdfPage(pdfBytes, pageIndex, 220);
    const pageBoxes = allBoxes.filter((box) => box.pageIndex === pageIndex);
    const redacted = pageBoxes.length ? await overlayRedactions(png, width, height, pageBoxes) : png;
    const image = await outDoc.embedPng(redacted);
    const page = outDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  return outDoc.save();
}

async function rasterizePdfPage(
  pdfBytes: Uint8Array,
  pageIndex: number,
  dpi: number
): Promise<{ png: Buffer; width: number; height: number }> {
  const dir = join(tmpdir(), "caseready-redact-" + randomUUID());
  const inputPath = join(dir, "input.pdf");
  const outputBase = join(dir, "page");
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.writeFile(inputPath, pdfBytes);
    // pdftoppm renders pages 1-indexed.
    const target = pageIndex + 1;
    await execFileAsync("pdftoppm", [
      "-png",
      "-r",
      String(dpi),
      "-f",
      String(target),
      "-l",
      String(target),
      inputPath,
      outputBase,
    ]);
    const pngPath = `${outputBase}-${target}.png`;
    const png = await fs.readFile(pngPath);
    const meta = await sharp(png).metadata();
    if (!meta.width || !meta.height) {
      throw new Error("Failed to rasterize page dimensions");
    }
    return { png, width: meta.width, height: meta.height };
  } finally {
    // Cleanup temp files
    fs.rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function normalizePdfJs(raw: any) {
  const lib = raw?.default ?? raw;
  const gwo = lib.GlobalWorkerOptions;
  if (gwo && typeof gwo === "object" && "workerSrc" in gwo) {
    try {
      (gwo as any).workerSrc = undefined;
    } catch {
      /* ignore */
    }
  }
  return lib;
}

async function loadPdfJsDocument(pdfjsLib: any, data: Uint8Array) {
  const loadingTask = pdfjsLib.getDocument({
    data,
    disableFontFace: true,
    disableWorker: true,
    useSystemFonts: true,
    isEvalSupported: false,
    workerSrc: undefined,
    useWorkerFetch: false,
    disableCreateObjectURL: true,
    CanvasFactory: NodeCanvasFactory,
  });
  return loadingTask.promise;
}

function buildBoxesFromText(
  textContent: any,
  viewport: { width: number; height: number },
  pageIndex: number,
  options: RedactOptions
): RedactionBox[] {
  const patterns: RegExp[] = [];
  if (options.redactEmails) patterns.push(buildPattern(emailRegex));
  if (options.redactPhones) patterns.push(buildPattern(phoneRegex));
  if (options.customPattern) {
    try {
      patterns.push(buildPattern(options.customPattern));
    } catch (error) {
      console.warn("Invalid custom regex ignored", error);
    }
  }
  if (!patterns.length) return [];

  const boxes: RedactionBox[] = [];
  (textContent.items as any[]).forEach((item) => {
    if (typeof item?.str !== "string") return;
    const text = item.str.trim();
    if (!text) return;
    const matches = patterns.some((r) => new RegExp(r.source, r.flags).test(text));
    if (!matches) return;

    const transform = item.transform as number[] | undefined;
    const fontHeight =
      Math.hypot(transform?.[2] ?? 0, transform?.[3] ?? 0) || Math.abs(transform?.[3] ?? 0) || 12;
    const textWidth =
      typeof item.width === "number" && item.width > 0 ? item.width : text.length * fontHeight * 0.6;

    const x = transform?.[4] ?? 0;
    const yTop = transform?.[5] ?? 0;
    const width = textWidth;
    const height = fontHeight;
    const y = viewport.height - yTop;

    boxes.push({
      pageIndex,
      x,
      y: y - height,
      width,
      height,
    });
  });

  // Translate from viewport to raster PNG space
  return boxes.map((box) => ({
    ...box,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
  }));
}

function buildPattern(pattern: RegExp | string, flags = "gi") {
  const source = typeof pattern === "string" ? pattern : pattern.source;
  return new RegExp(source, flags);
}

async function overlayRedactions(
  png: Buffer,
  pngWidth: number,
  pngHeight: number,
  boxes: RedactionBox[]
): Promise<Buffer> {
  const svgRects = boxes
    .map((box) => {
      const scaleX = pngWidth / (box as any).viewportWidth || pngWidth;
      const scaleY = pngHeight / (box as any).viewportHeight || pngHeight;
      const x = box.x * scaleX;
      const y = pngHeight - (box.y + box.height) * scaleY;
      const width = Math.max(1, box.width * scaleX);
      const height = Math.max(1, box.height * scaleY);
      return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="black" />`;
    })
    .join("");

  const overlay = Buffer.from(
    `<svg width="${pngWidth}" height="${pngHeight}" xmlns="http://www.w3.org/2000/svg">${svgRects}</svg>`
  );

  return sharp(png).composite([{ input: overlay, top: 0, left: 0 }]).png().toBuffer();
}

/**
 * Quick manual test:
 * (async () => {
 *   const input = await fs.readFile("sample.pdf");
 *   const output = await redactPdf(input, { redactEmails: true, redactPhones: true });
 *   await fs.writeFile("sample-redacted.pdf", output);
 * })();
 */
