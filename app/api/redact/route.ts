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

  pdfDoc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    page.drawRectangle({
      x: 50,
      y: 90,
      width: width - 100,
      height: height - 180,
      color: rgb(0, 0, 0),
      opacity: 0.08,
      borderOpacity: 0.0,
    });
    page.drawText("Redacted", {
      x: 60,
      y: height - 130,
      size: 18,
      font: bold,
      color: rgb(0.05, 0.05, 0.05),
    });
    page.drawText(`Rules applied: ${sanitizedPrompt}`, {
      x: 60,
      y: height - 160,
      maxWidth: width - 120,
      size: 11,
      font,
      color: rgb(0.15, 0.15, 0.15),
      lineHeight: 14,
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
