import { NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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

  let pdfDoc: PDFDocument;

  try {
    if (file.type === "application/pdf") {
      pdfDoc = await PDFDocument.load(buffer);
    } else {
      pdfDoc = await PDFDocument.create();
      let embedded;
      if (file.type === "image/png") {
        embedded = await pdfDoc.embedPng(buffer);
      } else if (file.type === "image/jpeg" || file.type === "image/jpg") {
        embedded = await pdfDoc.embedJpg(buffer);
      } else {
        throw new Error("Unsupported file type");
      }
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const scale = Math.min(width / embedded.width, height / embedded.height);
      const imgWidth = embedded.width * scale;
      const imgHeight = embedded.height * scale;
      page.drawImage(embedded, {
        x: (width - imgWidth) / 2,
        y: (height - imgHeight) / 2,
        width: imgWidth,
        height: imgHeight,
      });
    }
  } catch (error) {
    console.error("Failed to load file", error);
    return new Response(JSON.stringify({ ok: false, message: "Unable to process file" }), {
      status: 400,
    });
  }

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  pdfDoc.getPages().forEach((page, pageIndex) => {
    const { width, height } = page.getSize();
    const margin = 48;
    const headerHeight = 120;
    const redactHeight = Math.max(0, height - headerHeight - margin);

    // Header stays readable so users know why the page is blanked
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
    page.drawText(`Instructions: ${sanitizedPrompt}`, {
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

  const pdfBytes = await pdfDoc.save();
  return new Response(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="caseready-redacted.pdf"',
    },
  });
}
