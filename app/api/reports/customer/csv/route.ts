import { NextRequest, NextResponse } from "next/server";
import { getCustomerReport } from "@/lib/reports/customer/customerReport";
import {
  toCsvRow,
  money,
  buildCsvContent,
  csvResponseHeaders,
} from "@/lib/reports/csv";

function isValidDateString(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const search = searchParams.get("search") ?? undefined;

  const from = isValidDateString(fromParam) ? fromParam : undefined;
  const to = isValidDateString(toParam) ? toParam : undefined;

  const report = await getCustomerReport({ search, from, to });

  const rows: string[] = [];

  rows.push(toCsvRow(["Customer Report"]));
  rows.push(toCsvRow(["From", from ?? "All time"]));
  rows.push(toCsvRow(["To", to ?? "All time"]));
  if (search) rows.push(toCsvRow(["Search", search]));
  rows.push("");

  rows.push(toCsvRow(["Summary"]));
  rows.push(toCsvRow(["Total Customers", report.summary.totalCustomers]));
  rows.push(toCsvRow(["Total Invoices", report.summary.totalInvoices]));
  rows.push(toCsvRow(["Total Billed", money(report.summary.totalBilled)]));
  rows.push(toCsvRow(["Total Paid", money(report.summary.totalPaid)]));
  rows.push(
    toCsvRow(["Total Outstanding", money(report.summary.totalOutstanding)]),
  );
  rows.push("");

  rows.push(toCsvRow(["By Customer"]));
  rows.push(
    toCsvRow([
      "Customer",
      "Phone",
      "Email",
      "Address",
      "Invoices",
      "Billed",
      "Paid",
      "Outstanding",
    ]),
  );
  for (const c of report.customers) {
    rows.push(
      toCsvRow([
        c.name,
        c.phone,
        c.email ?? "",
        c.address ?? "",
        c.invoiceCount,
        money(c.totalBilled),
        money(c.totalPaid),
        money(c.outstanding),
      ]),
    );
  }
  rows.push("");

  rows.push(toCsvRow(["Invoices"]));
  rows.push(
    toCsvRow([
      "Customer",
      "Invoice #",
      "Date",
      "Status",
      "Subtotal",
      "Discount",
      "Tax",
      "Total",
      "Paid",
      "Balance",
    ]),
  );
  for (const c of report.customers) {
    for (const inv of c.invoices) {
      rows.push(
        toCsvRow([
          c.name,
          inv.invoiceNumber,
          inv.date.slice(0, 10),
          inv.status,
          money(inv.subtotal),
          money(inv.discount),
          money(inv.tax),
          money(inv.total),
          money(inv.paid),
          money(inv.balance),
        ]),
      );
    }
  }
  rows.push("");

  // Flattened line-item detail — one row per (invoice, service line), same
  // pattern as the service report CSV. This is the level of detail that
  // doesn't fit in the PDF's page-width tables.
  rows.push(toCsvRow(["Invoice Items"]));
  rows.push(
    toCsvRow([
      "Customer",
      "Invoice #",
      "Date",
      "Service",
      "Quantity",
      "Unit Price",
      "Subtotal",
      "Employees",
    ]),
  );
  for (const c of report.customers) {
    for (const inv of c.invoices) {
      for (const item of inv.items) {
        rows.push(
          toCsvRow([
            c.name,
            inv.invoiceNumber,
            inv.date.slice(0, 10),
            item.serviceName,
            item.quantity,
            money(item.unitPrice),
            money(item.subtotal),
            item.employees.join("; "),
          ]),
        );
      }
    }
  }

  const csvContent = buildCsvContent(rows);
  const rangeSuffix = from && to ? `-${from}-to-${to}` : "";

  return new NextResponse(csvContent, {
    headers: csvResponseHeaders(`customer-report${rangeSuffix}.csv`),
  });
}
