import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { ExpenseCategory } from "@prisma/client";
import { getExpenseReportData } from "@/lib/reports/expense";
import ExpenseReportPdfDocument from "@/lib/reports/ExpenseReportPdfDocument";
import {
  startOfDayInSalonTz,
  endOfDayInSalonTz,
  todayInSalonTz,
} from "@/lib/utils/timezone";

const labels: Record<string, string> = {
  RENT: "Rent",
  UTILITIES: "Utilities",
  SUPPLIES: "Supplies",
  SALARIES: "Salaries",
  MARKETING: "Marketing",
  MAINTENANCE: "Maintenance",
  OTHER: "Other",
};

function isValidDateString(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function firstDayOfCurrentMonthInSalonTz(): string {
  const [year, month] = todayInSalonTz().split("-");
  return `${year}-${month}-01`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const categoryParam = searchParams.get("category") ?? undefined;

  // not salon-local. Now anchored explicitly via timezone.ts.
  const fromDate = isValidDateString(fromParam)
    ? fromParam
    : firstDayOfCurrentMonthInSalonTz();
  const toDate = isValidDateString(toParam) ? toParam : todayInSalonTz();

  const from = startOfDayInSalonTz(fromDate);
  const to = endOfDayInSalonTz(toDate);

  const category = categoryParam
    ? (categoryParam as ExpenseCategory)
    : undefined;

  const report = await getExpenseReportData({ from, to, category });

  const fromLabel = fromDate;
  const toLabel = toDate;

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
