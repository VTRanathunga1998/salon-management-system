import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServiceReport } from "@/lib/reports/serviceReport";
import { todayInSalonTz, toDateInputInSalonTz } from "@/lib/utils/timezone";
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

  const rows: string[] = [];

  rows.push(toCsvRow(["Service Report"]));
  rows.push(toCsvRow(["From", fromDate]));
  rows.push(toCsvRow(["To", toDate]));
  if (service?.name) rows.push(toCsvRow(["Service", service.name]));
  rows.push("");

  rows.push(toCsvRow(["Summary"]));
  rows.push(toCsvRow(["Service Types", report.summary.totalServiceTypes]));
  rows.push(toCsvRow(["Total Bookings", report.summary.totalBookings]));
  rows.push(toCsvRow(["Total Quantity", report.summary.totalQuantity]));
  rows.push(toCsvRow(["Total Revenue", money(report.summary.totalRevenue)]));
  rows.push("");

  rows.push(toCsvRow(["By Service"]));
  rows.push(
    toCsvRow(["Service", "Active", "Times Performed", "Quantity", "Revenue"]),
  );
  for (const s of report.services) {
    rows.push(
      toCsvRow([
        s.name,
        s.isActive ? "Yes" : "No",
        s.timesPerformed,
        s.totalQuantity,
        money(s.totalRevenue),
      ]),
    );
  }
  rows.push("");

  // Flattened entries: one row per invoice-item, service name repeated so
  // each row is self-contained — this is the part someone will actually
  // filter/sort/pivot on in Excel.
  rows.push(toCsvRow(["Bookings"]));
  rows.push(
    toCsvRow([
      "Service",
      "Date",
      "Invoice #",
      "Customer",
      "Phone",
      "Quantity",
      "Unit Price",
      "Subtotal",
      "Employees",
    ]),
  );
  for (const s of report.services) {
    for (const e of s.entries) {
      rows.push(
        toCsvRow([
          s.name,
          toDateInputInSalonTz(new Date(e.date)),
          e.invoiceNumber,
          e.customerName,
          e.customerPhone,
          e.quantity,
          money(e.unitPrice),
          money(e.subtotal),
          e.employees.join("; "),
        ]),
      );
    }
  }

  const csvContent = buildCsvContent(rows);
  const filenameSuffix = service?.name
    ? `-${service.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
    : "";
  const filename = `service-report-${fromDate}-to-${toDate}${filenameSuffix}.csv`;

  return new NextResponse(csvContent, {
    headers: csvResponseHeaders(filename),
  });
}
