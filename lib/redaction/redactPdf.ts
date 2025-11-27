// lib/redaction/redactPdf.ts
import { PDFDocument, rgb } from "pdf-lib";

export type RedactOptions = {
  redactEmails: boolean;
  redactPhones: boolean;
  redactAddresses?: boolean;
  redactNames?: boolean;
  customPattern?: string;
};

const pdfjsLibPromise = import("pdfjs-dist/legacy/build/pdf.mjs");

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

// Basic patterns for MVP
const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phoneRegex = /(\+?\d[\d\s().-]{7,}\d)/i;
const addressRegex =
  /\b\d{1,5}\s+([A-Z][A-Za-z]*\.?\s?){1,4}(street|st\.|road|rd\.|ave|avenue|blvd|lane|ln|drive|dr\.|court|ct\.)\b/i;
const nameRegex = /\b([A-Z][a-z]+|[A-Z]{2,})\s+([A-Z][a-z]+|[A-Z]{2,})\b/i;

const buildPattern = (pattern: RegExp | string, flags = "gi") => {
  const source = typeof pattern === "string" ? pattern : pattern.source;
  return new RegExp(source, flags);
};

/**
 * SUPER IMPORTANT:
 * This MVP version does **page-level** redaction:
 * - If a page's text matches any pattern (email, phone, etc.),
 *   we black out the entire page.
 * - No Poppler, no sharp, no rasterization – works on Vercel.
 *
 * Later, you can upgrade this to line-level bounding boxes or full rasterization.
 */
export async function redactPdf(
  pdfBytes: Uint8Array,
  options: RedactOptions
): Promise<Uint8Array> {
  // Load the PDF with pdf-lib
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Build the patterns we should look for
  const patterns: RegExp[] = [];
  if (options.redactEmails) patterns.push(buildPattern(emailRegex));
  if (options.redactPhones) patterns.push(buildPattern(phoneRegex));
  if (options.redactAddresses) patterns.push(buildPattern(addressRegex));
  if (options.redactNames) patterns.push(buildPattern(nameRegex));
  if (options.customPattern) {
    try {
      patterns.push(buildPattern(options.customPattern));
    } catch (error) {
      console.warn("Invalid custom regex ignored:", error);
    }
  }

  if (!patterns.length) {
    // Nothing to redact – just return original
    return pdfDoc.save();
  }

  // Use pdfjs to extract text per page
  const rawPdfjsLib = await pdfjsLibPromise;
  const pdfjsLib = (rawPdfjsLib as any).default ?? rawPdfjsLib;

  const loadingTask = pdfjsLib.getDocument({
    data: pdfBytes,
    disableWorker: true,
    useSystemFonts: true,
    isEvalSupported: true,
    // Avoid bundling standard fonts path on serverless; rely on built-ins.
    standardFontDataUrl: undefined,
    disableFontFace: true,
  });

  let pdf;
  try {
    pdf = await loadingTask.promise;
  } catch (error) {
    console.warn("pdfjs failed to read PDF; returning original", error);
    return pdfDoc.save();
  }

  const pagesToRedact: number[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    try {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();

      const fullText = (textContent.items as any[])
        .map((item) => (typeof item?.str === "string" ? item.str : ""))
        .join(" ");

      const normalizedText = normalize(fullText);

      const matches = patterns.some((pattern) => {
        const re = new RegExp(pattern.source, pattern.flags);
        return re.test(fullText) || re.test(normalizedText);
      });

      if (matches) {
        // pdf-lib pages are 0-indexed
        pagesToRedact.push(pageNumber - 1);
      }
    } catch (error) {
      console.warn(`Failed to inspect page ${pageNumber} for redaction`, error);
      continue;
    }
  }

  // If nothing matched, just return original
  if (!pagesToRedact.length) {
    return pdfDoc.save();
  }

  // Black out entire pages that matched
  for (const pageIndex of pagesToRedact) {
    const page = pdfDoc.getPage(pageIndex);
    const width = page.getWidth();
    const height = page.getHeight();

    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0, 0, 0),
    });
  }

  const outBytes = await pdfDoc.save();
  return outBytes;
}
