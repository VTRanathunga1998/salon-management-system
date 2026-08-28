import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getExpenseReportData } from "@/lib/reports/expense";
import ExpenseReportPdfDocument from "@/lib/reports/ExpenseReportPdfDocument";
import {
  startOfDayInSalonTz,
  endOfDayInSalonTz,
  todayInSalonTz,
} from "@/lib/utils/timezone";

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

  const fromDate = isValidDateString(fromParam)
    ? fromParam
    : firstDayOfCurrentMonthInSalonTz();
  const toDate = isValidDateString(toParam) ? toParam : todayInSalonTz();

  const from = startOfDayInSalonTz(fromDate);
  const to = endOfDayInSalonTz(toDate);

  const categoryId = categoryParam || undefined;

  // Category is now a dynamic row, not a fixed enum — look up its
  // display name for the PDF header instead of a static labels map.
  const categoryLabel = categoryId
    ? (
        await prisma.expenseCategory.findUnique({
          where: { id: categoryId },
          select: { name: true },
        })
      )?.name
    : undefined;

  const report = await getExpenseReportData({ from, to, categoryId });

  const fromLabel = fromDate;
  const toLabel = toDate;

  const buffer = await renderToBuffer(
    React.createElement(ExpenseReportPdfDocument, {
      report,
      from: fromLabel,
      to: toLabel,
      categoryLabel,
    }) as React.ReactElement<DocumentProps>,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="expense-report-${fromLabel}-to-${toLabel}.pdf"`,
    },
  });
}
