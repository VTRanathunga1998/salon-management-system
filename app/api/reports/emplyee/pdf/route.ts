import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getEmployeeReportData } from "@/lib/reports/employee";
import EmployeeReportPdfDocument from "@/lib/reports/EmployeeReportPdfDocument";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const employeeId = searchParams.get("employeeId") ?? undefined;

  const now = new Date();
  const from = fromParam
    ? new Date(fromParam)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = toParam ? new Date(toParam) : now;
  to.setHours(23, 59, 59, 999);

  const [report, employee] = await Promise.all([
    getEmployeeReportData({ from, to, employeeId }),
    employeeId
      ? prisma.employee.findUnique({
          where: { id: employeeId },
          select: { name: true },
        })
      : Promise.resolve(null),
  ]);

  const fromLabel = from.toISOString().slice(0, 10);
  const toLabel = to.toISOString().slice(0, 10);

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
