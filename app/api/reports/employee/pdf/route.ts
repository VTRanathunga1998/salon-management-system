import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getEmployeeReportData } from "@/lib/reports/employee";
import EmployeeReportPdfDocument from "@/lib/reports/EmployeeReportPdfDocument";
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
  const employeeId = searchParams.get("employeeId") ?? undefined;

  // CHANGED: was `new Date(fromParam)` + `to.setHours(...)` — both operate
  // in server-local time, not the salon's timezone. Now anchored explicitly.
  const fromDate = isValidDateString(fromParam)
    ? fromParam
    : firstDayOfCurrentMonthInSalonTz();
  const toDate = isValidDateString(toParam) ? toParam : todayInSalonTz();

  const from = startOfDayInSalonTz(fromDate);
  const to = endOfDayInSalonTz(toDate);

  const [report, employee] = await Promise.all([
    getEmployeeReportData({ from, to, employeeId }),
    employeeId
      ? prisma.employee.findUnique({
          where: { id: employeeId },
          select: { name: true },
        })
      : Promise.resolve(null),
  ]);

  // CHANGED: was `from.toISOString().slice(0, 10)` — pure UTC. The salon-
  // local date strings we already validated above are correct as-is.
  const fromLabel = fromDate;
  const toLabel = toDate;

  const buffer = await renderToBuffer(
    React.createElement(EmployeeReportPdfDocument, {
      report,
      from: fromLabel,
      to: toLabel,
      employeeName: employee?.name,
    }) as React.ReactElement<DocumentProps>,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="employee-report-${fromLabel}-to-${toLabel}.pdf"`,
    },
  });
}
