import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { getReportData } from "@/lib/reports/actions";
import ReportPdfDocument from "@/lib/reports/ReportPdfDocument";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const now = new Date();
  const from = fromParam
    ? new Date(fromParam)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = toParam ? new Date(toParam) : now;
  to.setHours(23, 59, 59, 999);

  const report = await getReportData({ from, to });

  const fromLabel = from.toISOString().slice(0, 10);
  const toLabel = to.toISOString().slice(0, 10);

  const buffer = await renderToBuffer(
    React.createElement(ReportPdfDocument, {
      report,
      from: fromLabel,
      to: toLabel,
    }) as React.ReactElement<DocumentProps>,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="report-${fromLabel}-to-${toLabel}.pdf"`,
    },
  });
}
