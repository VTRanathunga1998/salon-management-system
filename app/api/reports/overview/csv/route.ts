import { NextRequest, NextResponse } from "next/server";
import { getReportData } from "@/lib/reports/actions";
import {
  endOfDayInSalonTz,
  startOfDayInSalonTz,
  todayInSalonTz,
} from "@/lib/utils/timezone";
import {
  toCsvRow,
  money,
  buildCsvContent,
  csvResponseHeaders,
} from "@/lib/reports/csv";

function isValidDateString(value: string | null): boolean {
  if (!value) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !isNaN(date.getTime());
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const today = todayInSalonTz();
  const [year, month] = today.split("-");
  const defaultFromString = `${year}-${month}-01`;
  const defaultToString = today;

  const fromString = isValidDateString(fromParam)
    ? fromParam!
    : defaultFromString;
  const toString = isValidDateString(toParam) ? toParam! : defaultToString;

  const from = startOfDayInSalonTz(fromString);
  const to = endOfDayInSalonTz(toString);

  const report = await getReportData({ from, to });

  const fromLabel = fromString;
  const toLabel = toString;

  const rows: string[] = [];

  rows.push(toCsvRow(["Business Report"]));
  rows.push(toCsvRow(["From", fromLabel]));
  rows.push(toCsvRow(["To", toLabel]));
  rows.push("");

  rows.push(toCsvRow(["Summary"]));
  rows.push(toCsvRow(["Total Revenue", money(report.summary.totalRevenue)]));
  rows.push(toCsvRow(["Invoiced Total", money(report.summary.invoicedTotal)]));
  rows.push(toCsvRow(["Outstanding", money(report.summary.outstanding)]));
  rows.push(toCsvRow(["Invoice Count", report.summary.invoiceCount]));
  rows.push(toCsvRow(["Total Expense", money(report.summary.totalExpense)]));
  rows.push(toCsvRow(["Total Profit", money(report.summary.totalProfit)]));
  rows.push(toCsvRow(["Customers Served", report.summary.customersServed]));
  rows.push("");

  // Skipped `report.range.granularity` — chart-axis metadata only, no
  // meaning as a CSV column. `revenueSeries` itself is kept below since
  // it's real tabular data (date -> amount).

  rows.push(toCsvRow(["Revenue Over Time"]));
  rows.push(toCsvRow(["Date", "Revenue"]));
  for (const point of report.revenueSeries) {
    rows.push(toCsvRow([point.date, money(point.amount)]));
  }
  rows.push("");

  rows.push(toCsvRow(["By Payment Method"]));
  rows.push(toCsvRow(["Method", "Amount"]));
  for (const m of report.methodBreakdown) {
    rows.push(toCsvRow([m.method, money(m.amount)]));
  }
  rows.push("");

  rows.push(toCsvRow(["By Employee"]));
  rows.push(toCsvRow(["Employee", "Services Count", "Revenue"]));
  for (const e of report.employeeStats) {
    rows.push(toCsvRow([e.name, e.servicesCount, money(e.revenue)]));
  }
  rows.push("");

  rows.push(toCsvRow(["By Service"]));
  rows.push(toCsvRow(["Service", "Times Performed", "Revenue"]));
  for (const s of report.serviceStats) {
    rows.push(toCsvRow([s.name, s.timesPerformed, money(s.revenue)]));
  }
  rows.push("");

  rows.push(toCsvRow(["Top Customers"]));
  rows.push(toCsvRow(["Customer", "Invoice Count", "Spend"]));
  for (const c of report.topCustomers) {
    rows.push(toCsvRow([c.name, c.invoiceCount, money(c.spend)]));
  }
  rows.push("");

  rows.push(toCsvRow(["Invoices By Status"]));
  rows.push(toCsvRow(["Status", "Count"]));
  for (const [status, count] of Object.entries(report.statusBreakdown)) {
    rows.push(toCsvRow([status, count]));
  }
  rows.push("");

  // employeeServiceLog is the one-row-per-(employee, service line) detail —
  // useful for a full audit trail, kept as the final section.
  rows.push(toCsvRow(["Employee Service Log"]));
  rows.push(
    toCsvRow([
      "Date",
      "Employee",
      "Service",
      "Customer",
      "Invoice #",
      "Quantity",
      "Amount",
    ]),
  );
  for (const row of report.employeeServiceLog) {
    rows.push(
      toCsvRow([
        new Date(row.date).toISOString().slice(0, 10),
        row.employeeName,
        row.serviceName,
        row.customerName,
        row.invoiceNumber,
        row.quantity,
        money(row.amount),
      ]),
    );
  }

  const csvContent = buildCsvContent(rows);
  const filename = `business-report-${fromLabel}-to-${toLabel}.csv`;

  return new NextResponse(csvContent, {
    headers: csvResponseHeaders(filename),
  });
}
