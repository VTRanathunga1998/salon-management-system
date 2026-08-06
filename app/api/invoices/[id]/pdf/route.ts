import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import InvoicePdfDocument from "@/lib/pdf/InvoicePdfDocument";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { employee: true } },
      payments: { where: { status: "COMPLETED" } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    React.createElement(InvoicePdfDocument, {
      invoice: {
        ...invoice,
        subtotal: Number(invoice.subtotal),
        discountTotal: Number(invoice.discountTotal),
        taxTotal: Number(invoice.taxTotal),
        total: Number(invoice.total),
        items: invoice.items.map((item) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
        })),
        payments: invoice.payments.map((p) => ({
          amount: Number(p.amount),
        })),
      },
    }) as React.ReactElement<DocumentProps>,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    },
  });
}
