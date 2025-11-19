import { NextRequest } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";

type TimelineEvent = {
  id: string;
  date: string;
  time?: string;
  title: string;
  description?: string;
  tag?: string;
};

const sortEvents = (events: TimelineEvent[]) => {
  return [...events].sort((a, b) => {
    const aKey = `${a.date} ${a.time ?? "00:00"}`;
    const bKey = `${b.date} ${b.time ?? "00:00"}`;
    return aKey.localeCompare(bKey);
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const timelineName = typeof body.timelineName === "string" ? body.timelineName : "Timeline";
    const events: TimelineEvent[] = Array.isArray(body.events) ? body.events : [];

    if (!events.length) {
      return new Response(JSON.stringify({ ok: false, message: "No events provided" }), {
        status: 400,
      });
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const addPage = () => {
      const page = pdfDoc.addPage();
      page.setFont(font);
      return page;
    };

    const titlePage = addPage();
    const { width, height } = titlePage.getSize();
    titlePage.drawText(timelineName || "Timeline", {
      x: 72,
      y: height - 120,
      size: 28,
      font: boldFont,
      color: undefined,
    });
    titlePage.drawText(`Generated ${new Date().toLocaleDateString()}`, {
      x: 72,
      y: height - 150,
      size: 12,
      font,
    });

    let page = addPage();
    let y = page.getHeight() - 72;
    const lineHeight = 16;

    const writeLine = (text: string, isBold = false, size = 11) => {
      if (y < 72) {
        page = addPage();
        y = page.getHeight() - 72;
      }
      page.drawText(text, {
        x: 72,
        y,
        size,
        font: isBold ? boldFont : font,
      });
      y -= lineHeight;
    };

    const grouped = sortEvents(events).reduce<Record<string, TimelineEvent[]>>(
      (acc, event) => {
        if (!acc[event.date]) acc[event.date] = [];
        acc[event.date].push(event);
        return acc;
      },
      {}
    );

    Object.entries(grouped).forEach(([date, list]) => {
      writeLine(new Date(date).toLocaleDateString(), true, 13);
      list.forEach((event) => {
        const header = [event.time, event.title].filter(Boolean).join(" · ");
        writeLine(header || event.title, true);
        if (event.tag) writeLine(`Tag: ${event.tag}`);
        if (event.description) writeLine(event.description);
        y -= 6;
      });
      y -= 10;
    });

    const pages = pdfDoc.getPages();
    pages.forEach((currentPage, index) => {
      const text = `Page ${index + 1} of ${pages.length}`;
      currentPage.drawText(text, {
        x: currentPage.getWidth() - 120,
        y: 30,
        size: 10,
        font,
      });
    });

    const pdfBytes = await pdfDoc.save();
    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${timelineName || "timeline"}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Failed to generate timeline PDF", error);
    return new Response(JSON.stringify({ ok: false, message: "Failed to build PDF" }), {
      status: 500,
    });
  }
}
