import PDFDocument from "pdfkit";

export const runtime = "nodejs";

type ReportPayload = {
  address?: string;
  analysis?: string;
  meta?: { trust?: string; score?: number };
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ReportPayload | null;
  const address = body?.address?.trim();
  const analysis = body?.analysis?.trim();

  if (!address || !analysis) {
    return new Response("missing fields", { status: 400 });
  }

  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });

  const done = new Promise<void>((resolve, reject) => {
    doc.on("end", () => resolve());
    doc.on("error", (error: unknown) => {
      reject(error instanceof Error ? error : new Error(String(error)));
    });
  });

  doc.fillColor("#0EA5E9").fontSize(22).text("XRglass Trust Report", { align: "left" });
  doc.moveDown(0.5);
  doc.fillColor("#0EA5E9").fontSize(13).text(`Generated: ${new Date().toUTCString()}`);
  doc.moveDown(1);
  doc.fillColor("#020817").fontSize(12).text(`Address: ${address}`);
  if (body?.meta?.trust || body?.meta?.score !== undefined) {
    doc.moveDown(0.3);
    const trust = body.meta.trust ? `Trust: ${body.meta.trust}` : "";
    const score = body.meta.score !== undefined ? `Score: ${body.meta.score}` : "";
    doc.text([trust, score].filter(Boolean).join(" • "));
  }
  doc.moveDown(1);

  doc.fillColor("#0EA5E9").fontSize(14).text("AI Analysis");
  doc.moveDown(0.4);
  doc.fillColor("#1E293B").fontSize(11).text(analysis, {
    align: "left",
    lineGap: 4,
  });

  doc.moveDown(1.5);
  doc.fillColor("#64748B").fontSize(9).text("© XRglass 2025 — Ripple Ecosystem", {
    align: "right",
  });

  doc.end();
  await done;

  const pdf = Buffer.concat(chunks);

  return new Response(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="XRglass_Report_${address}.pdf"`,
      "Content-Length": String(pdf.length),
    },
  });
}
