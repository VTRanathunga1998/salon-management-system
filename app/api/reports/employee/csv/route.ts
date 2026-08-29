// app/api/reports/employee/csv/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEmployeeReportData } from "@/lib/reports/employee";
import {
  startOfDayInSalonTz,
  endOfDayInSalonTz,
  todayInSalonTz,
  toDateInputInSalonTz,
} from "@/lib/utils/timezone";

function isValidDateString(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function firstDayOfCurrentMonthInSalonTz(): string {
  const [year, month] = todayInSalonTz().split("-");
  return `${year}-${month}-01`;
}

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);

  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function toCsvRow(values: unknown[]): string {
  return values.map(csvEscape).join(",");
}

function money(value: number): string {
  return value.toFixed(2);
}

function buildCsvRows(
  report: Awaited<ReturnType<typeof getEmployeeReportData>>,
  fromLabel: string,
  toLabel: string,
  employeeName?: string,
): string[] {
  const rows: string[] = [];

  // =========================================================
  // REPORT INFORMATION
  // =========================================================

  rows.push(toCsvRow(["Employee Report"]));
  rows.push(toCsvRow(["From", fromLabel]));
  rows.push(toCsvRow(["To", toLabel]));

  if (employeeName) {
    rows.push(toCsvRow(["Employee", employeeName]));
  } else {
    rows.push(toCsvRow(["Employee", "All Employees"]));
  }

  rows.push("");

  // =========================================================
  // SUMMARY
  // =========================================================

  rows.push(toCsvRow(["Summary"]));
  rows.push(toCsvRow(["Total Services", report.summary.totalServices]));
  rows.push(toCsvRow(["Total Revenue", money(report.summary.totalRevenue)]));

  rows.push("");

  // =========================================================
  // DETAILED SERVICES
  // =========================================================

  rows.push(toCsvRow(["Service Details"]));

  rows.push(
    toCsvRow([
      "Date",
      "Invoice #",
      "Employee",
      "Service",
      "Customer",
      "Quantity",
      "Revenue",
    ]),
  );

  for (const row of report.log) {
    rows.push(
      toCsvRow([
        toDateInputInSalonTz(new Date(row.date)),
        row.invoiceNumber,
        row.employeeName,
        row.serviceName,
        row.customerName,
        row.quantity,
        money(row.amount),
      ]),
    );
  }

  return rows;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const employeeId = searchParams.get("employeeId") ?? undefined;

    const fromDate = isValidDateString(fromParam)
      ? fromParam
      : firstDayOfCurrentMonthInSalonTz();

    const toDate = isValidDateString(toParam) ? toParam : todayInSalonTz();

    const from = startOfDayInSalonTz(fromDate);
    const to = endOfDayInSalonTz(toDate);

    const [report, employee] = await Promise.all([
      getEmployeeReportData({
        from,
        to,
        employeeId,
      }),

      employeeId
        ? prisma.employee.findUnique({
            where: { id: employeeId },
            select: { name: true },
          })
        : Promise.resolve(null),
    ]);

    const csvRows = buildCsvRows(report, fromDate, toDate, employee?.name);

    // UTF-8 BOM for proper Excel support
    const csvContent = "\uFEFF" + csvRows.join("\r\n");

    const filename = employee?.name
      ? `employee-report-${employee.name.replace(
          /[^a-zA-Z0-9-_]/g,
          "_",
        )}-${fromDate}-to-${toDate}.csv`
      : `employee-report-all-${fromDate}-to-${toDate}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",

        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Employee CSV report error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate employee report.",
      },
      { status: 500 },
    );
  }
}
