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
 * Text-level redaction:
 * - Extracts text with positioning from each page
 * - Finds pattern matches and draws black rectangles only over matched text
 * - Preserves all non-matching content
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

  // Use pdfjs to extract text per page with positioning
  const rawPdfjsLib = await pdfjsLibPromise;
  const pdfjsLib = (rawPdfjsLib as any).default ?? rawPdfjsLib;

  const loadingTask = pdfjsLib.getDocument({
    data: pdfBytes,
    disableWorker: true,
    useSystemFonts: true,
    isEvalSupported: true,
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

  // Process each page and find text items to redact
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    try {
      const pdfjsPage = await pdf.getPage(pageNumber);
      const textContent = await pdfjsPage.getTextContent();

      // Get the pdf-lib page (0-indexed)
      const pdfLibPage = pdfDoc.getPage(pageNumber - 1);

      // Build text with position tracking
      const textItems = textContent.items as any[];

      // Check each text item individually for matches
      for (const item of textItems) {
        if (!item?.str || typeof item.str !== "string" || !item.transform) continue;

        const itemText = item.str;
        if (!itemText.trim()) continue;

        // Check if this text matches any pattern
        let shouldRedact = false;
        for (const pattern of patterns) {
          const re = new RegExp(pattern.source, pattern.flags);
          if (re.test(itemText)) {
            shouldRedact = true;
            break;
          }
        }

        if (!shouldRedact) continue;

        // Extract position from transform matrix
        // Transform: [scaleX, skewX, skewY, scaleY, x, y]
        const [, , , scaleY, x, y] = item.transform;

        // Calculate actual text dimensions
        const textWidth = item.width;
        const fontSize = Math.abs(scaleY);

        // The y coordinate is at the text baseline
        // We need to cover only the visible text height, not extend too far up or down
        const textHeight = fontSize * 0.85; // Reduce height to fit just the text
        const yOffset = fontSize * 0.15; // Small offset from baseline

        pdfLibPage.drawRectangle({
          x: x,
          y: y - yOffset,
          width: textWidth,
          height: textHeight,
          color: rgb(0, 0, 0),
        });
      }
    } catch (error) {
      console.warn(`Failed to redact page ${pageNumber}`, error);
      continue;
    }
  }

  const outBytes = await pdfDoc.save();
  return outBytes;
}
