import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { getCustomerReport } from "@/lib/reports/customer/customerReport";
import CustomerReportPdfDocument from "@/lib/reports/CustomerReportPdfDocument";

function isValidDateString(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const search = searchParams.get("search") ?? undefined;

  const from = isValidDateString(fromParam) ? fromParam : undefined;
  const to = isValidDateString(toParam) ? toParam : undefined;

  const report = await getCustomerReport({ search, from, to });

  const buffer = await renderToBuffer(
    React.createElement(CustomerReportPdfDocument, {
      report,
      from,
      to,
      search,
    }) as React.ReactElement<DocumentProps>,
  );

  const rangeSuffix = from && to ? `-${from}-to-${to}` : "";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="customer-report${rangeSuffix}.pdf"`,
    },
  });
}
