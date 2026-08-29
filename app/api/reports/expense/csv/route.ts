import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExpenseReportData } from "@/lib/reports/expense";
import {
  startOfDayInSalonTz,
  endOfDayInSalonTz,
  todayInSalonTz,
  toDateInputInSalonTz,
} from "@/lib/utils/timezone";
import {
  toCsvRow,
  money,
  buildCsvContent,
  csvResponseHeaders,
} from "@/lib/reports/csv";

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

  const rows: string[] = [];

  rows.push(toCsvRow(["Expense Report"]));
  rows.push(toCsvRow(["From", fromLabel]));
  rows.push(toCsvRow(["To", toLabel]));
  if (categoryLabel) rows.push(toCsvRow(["Category", categoryLabel]));
  rows.push("");

  rows.push(toCsvRow(["Summary"]));
  rows.push(toCsvRow(["Total Amount", money(report.summary.totalAmount)]));
  rows.push(toCsvRow(["Expense Count", report.summary.count]));
  rows.push("");

  rows.push(toCsvRow(["By Category"]));
  rows.push(toCsvRow(["Category", "Amount"]));
  for (const c of report.categoryBreakdown) {
    rows.push(toCsvRow([c.category, money(c.amount)]));
  }
  rows.push("");

  rows.push(toCsvRow(["By Payment Method"]));
  rows.push(toCsvRow(["Method", "Amount"]));
  for (const m of report.methodBreakdown) {
    rows.push(toCsvRow([m.method, money(m.amount)]));
  }
  rows.push("");

  // Skipped `report.series` — it's chart-bucketed data (day/month totals)
  // that's purely for the dashboard graph; the itemized log below already
  // gives every underlying expense, which is more useful in a CSV.

  rows.push(toCsvRow(["Expenses"]));
  rows.push(
    toCsvRow(["Date", "Title", "Category", "Amount", "Method", "Notes"]),
  );
  for (const e of report.expenses) {
    rows.push(
      toCsvRow([
        toDateInputInSalonTz(new Date(e.date)),
        e.title,
        e.category,
        money(e.amount),
        e.method,
        e.notes ?? "",
      ]),
    );
  }

  const csvContent = buildCsvContent(rows);
  const filename = `expense-report-${fromLabel}-to-${toLabel}.csv`;

  return new NextResponse(csvContent, {
    headers: csvResponseHeaders(filename),
  });
}
