import { NextRequest } from "next/server";
import { redactPdf, type RedactOptions } from "@/lib/redaction/redactPdf";

export const runtime = "nodejs";

const defaultOptions: RedactOptions = {
  redactEmails: true,
  redactPhones: true,
  customPattern: "",
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const optionsRaw = formData.get("options")?.toString() ?? "";

    if (!(file instanceof File)) {
      return new Response(
        JSON.stringify({ ok: false, message: "PDF file is required" }),
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return new Response(
        JSON.stringify({ ok: false, message: "Only PDF files are supported" }),
        { status: 400 }
      );
    }

    let options: RedactOptions = { ...defaultOptions };
    if (optionsRaw) {
      try {
        const parsed = JSON.parse(optionsRaw);
        options = {
          ...options,
          ...parsed,
          customPattern: parsed.customPattern || "",
        };
      } catch (error) {
        console.warn("Failed to parse options, using defaults", error);
      }
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const redactedBytes = await redactPdf(buffer, options);

    return new Response(Buffer.from(redactedBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="redacted.pdf"',
      },
    });
  } catch (error) {
    console.error("Redaction failed", error);
    const message = error instanceof Error ? error.message : "Redaction failed";
    return new Response(JSON.stringify({ ok: false, message }), {
      status: 500,
    });
  }
}
