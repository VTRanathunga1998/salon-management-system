import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getServiceReport } from "@/lib/reports/serviceReport";
import ServiceReportPdfDocument from "@/lib/reports/ServiceReportPdfDocument";
import { todayInSalonTz } from "@/lib/utils/timezone";

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
  const search = searchParams.get("search") ?? undefined;
  const serviceId = searchParams.get("serviceId") ?? undefined;

  const fromDate = isValidDateString(fromParam)
    ? fromParam
    : firstDayOfCurrentMonthInSalonTz();
  const toDate = isValidDateString(toParam) ? toParam : todayInSalonTz();

  const [report, service] = await Promise.all([
    getServiceReport({ search, serviceId, from: fromDate, to: toDate }),
    serviceId
      ? prisma.service.findUnique({
          where: { id: serviceId },
          select: { name: true },
        })
      : Promise.resolve(null),
  ]);

  const buffer = await renderToBuffer(
    React.createElement(ServiceReportPdfDocument, {
      report,
      from: fromDate,
      to: toDate,
      serviceId,
      serviceName: service?.name,
    }) as React.ReactElement<DocumentProps>,
  );

  const filenameSuffix = service?.name
    ? `-${service.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
    : "";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="service-report-${fromDate}-to-${toDate}${filenameSuffix}.pdf"`,
    },
  });
}
