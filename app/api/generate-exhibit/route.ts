import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabaseConfig";

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
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { ok: false, message: "You need to sign in to continue." },
        { status: 401 }
      );
    }

    const user = session.user;
    const exportsUsedRaw = user.user_metadata?.exportsUsed ?? 0;
    const parsedExportsUsed = Number(exportsUsedRaw);
    const exportsUsed = Number.isFinite(parsedExportsUsed)
      ? parsedExportsUsed
      : 0;

    if (exportsUsed >= 2) {
      return NextResponse.json(
        {
          ok: false,
          message: "Free plan exhausted. Contact support to unlock more exports.",
        },
        { status: 403 }
      );
    }

    const formData = await req.formData();

    const inputFiles: File[] = [];
    for (const entry of formData.entries()) {
      const [key, value] = entry;
      if (key === "files" && value instanceof File) {
        inputFiles.push(value);
      }
    }

    if (inputFiles.length === 0) {
      return NextResponse.json(
        { ok: false, message: "No files received." },
        { status: 400 }
      );
    }

    // Create a new PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (const f of inputFiles) {
      const bytes = new Uint8Array(await f.arrayBuffer());
      const mime = f.type || "";

      if (mime === "application/pdf") {
        // Merge PDF pages
        const srcDoc = await PDFDocument.load(bytes);
        const copiedPages = await pdfDoc.copyPages(
          srcDoc,
          srcDoc.getPageIndices()
        );
        copiedPages.forEach((p) => pdfDoc.addPage(p));
      } else if (mime.startsWith("image/")) {
        // Add image as a full page
        let embedded;
        if (mime === "image/jpeg" || mime === "image/jpg") {
          embedded = await pdfDoc.embedJpg(bytes);
        } else {
          // treat as PNG or other image
          embedded = await pdfDoc.embedPng(bytes);
        }

        const imgWidth = embedded.width;
        const imgHeight = embedded.height;

        const page = pdfDoc.addPage();
        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();

        const scale = Math.min(
          pageWidth / imgWidth,
          pageHeight / imgHeight
        );
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;

        const x = (pageWidth - scaledWidth) / 2;
        const y = (pageHeight - scaledHeight) / 2;

        page.drawImage(embedded, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
        });
      } else {
        // Unsupported type for now – you can expand this later
        console.log(`Skipping unsupported file type: ${f.name} (${mime})`);
      }
    }

    // Add simple page numbers (bottom-right)
    const pages = pdfDoc.getPages();
    pages.forEach((page, index) => {
      const { width } = page.getSize();
      page.drawText(`${index + 1}`, {
        x: width - 40,
        y: 20,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        exportsUsed: exportsUsed + 1,
      },
    });

    if (updateError) {
      console.error("Failed to update export count", updateError);
      return NextResponse.json(
        {
          ok: false,
          message:
            "Finished rendering, but could not update your export quota. Please try again.",
        },
        { status: 500 }
      );
    }

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="exhibit.pdf"',
      },
    });
  } catch (error) {
    console.error("Failed to generate exhibit PDF", error);
    const message =
      error instanceof Error
        ? `Failed to generate exhibit PDF: ${error.message}`
        : "Failed to generate exhibit PDF.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
