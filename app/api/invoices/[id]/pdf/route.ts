import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderInvoicePdf } from "@/lib/invoices/renderInvoicePdf";

// react-pdf/renderer uses Node APIs (fs) — must run on Node, not Edge
export const runtime = "nodejs";
// always generate fresh, never cache a stale PDF
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      payments: { where: { status: "COMPLETED" } },
      items: {
        include: {
          employees: {
            include: {
              employee: true,
            },
          },
        },
      },
      dueCollections: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  try {
    const buffer = await renderInvoicePdf(invoice);

    const download = req.nextUrl.searchParams.get("download") === "true";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${
          download ? "attachment" : "inline"
        }; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[invoice-pdf]", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
