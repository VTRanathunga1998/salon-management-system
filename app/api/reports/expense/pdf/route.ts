import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { ExpenseCategory } from "@prisma/client";
import { getExpenseReportData } from "@/lib/reports/expense";
import ExpenseReportPdfDocument from "@/lib/reports/ExpenseReportPdfDocument";

const labels: Record<string, string> = {
  RENT: "Rent",
  UTILITIES: "Utilities",
  SUPPLIES: "Supplies",
  SALARIES: "Salaries",
  MARKETING: "Marketing",
  MAINTENANCE: "Maintenance",
  OTHER: "Other",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const categoryParam = searchParams.get("category") ?? undefined;

  const now = new Date();
  const from = fromParam
    ? new Date(fromParam)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = toParam ? new Date(toParam) : now;
  to.setHours(23, 59, 59, 999);

  const category = categoryParam
    ? (categoryParam as ExpenseCategory)
    : undefined;

  const report = await getExpenseReportData({ from, to, category });

  const fromLabel = from.toISOString().slice(0, 10);
  const toLabel = to.toISOString().slice(0, 10);

  const buffer = await renderToBuffer(
    React.createElement(ExpenseReportPdfDocument, {
      report,
      from: fromLabel,
      to: toLabel,
      categoryLabel: category ? labels[category] : undefined,
    }) as React.ReactElement<DocumentProps>,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="expense-report-${fromLabel}-to-${toLabel}.pdf"`,
    },
  });
}
