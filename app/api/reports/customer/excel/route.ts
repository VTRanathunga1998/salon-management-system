import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

import { getCustomerReport } from "@/lib/reports/customer/customerReport";

function isValidDateString(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

const AED_FORMAT = '"AED" #,##0.00';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const search = searchParams.get("search") ?? undefined;

  const from = isValidDateString(fromParam) ? fromParam : undefined;
  const to = isValidDateString(toParam) ? toParam : undefined;

  const report = await getCustomerReport({
    search,
    from,
    to,
  });

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Salon Management System";
  workbook.lastModifiedBy = "Salon Management System";
  workbook.created = new Date();
  workbook.modified = new Date();

  // ============================================================
  // Shared styles
  // ============================================================

  // Partial<Font>, not Font — ExcelJS's Font type marks most fields as
  // required even though only a subset is ever needed at runtime.
  const titleFont: Partial<ExcelJS.Font> = {
    name: "Aptos Display",
    size: 14,
    bold: false,
  };

  const subtitleFont: Partial<ExcelJS.Font> = {
    name: "Aptos",
    size: 10,
    italic: true,
  };

  const headerFont: Partial<ExcelJS.Font> = {
    name: "Aptos",
    size: 10,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };

  const sectionFont: Partial<ExcelJS.Font> = {
    name: "Aptos",
    size: 11,
    bold: false,
  };

  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1F2937" },
  };

  const sectionFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "E5E7EB" },
  };

  const border: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "D1D5DB" } },
    left: { style: "thin", color: { argb: "D1D5DB" } },
    bottom: { style: "thin", color: { argb: "D1D5DB" } },
    right: { style: "thin", color: { argb: "D1D5DB" } },
  };

  // Freezing header rows lives entirely on `views` in ExcelJS — there is
  // no `worksheet.freezePanes.freezeRows(n)` API. Call this once per
  // sheet instead of setting `views` twice (once for gridlines, again
  // later for freezing), which is what caused the previous runtime crash.
  function initSheetView(sheet: ExcelJS.Worksheet, freezeAtRow: number) {
    sheet.views = [
      {
        showGridLines: false,
        state: "frozen",
        ySplit: freezeAtRow,
      },
    ];
  }

  function styleHeader(row: ExcelJS.Row) {
    row.height = 24;

    row.eachCell((cell) => {
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.alignment = {
        vertical: "middle",
        horizontal: "left",
      };
      cell.border = border;
    });
  }

  function styleBody(row: ExcelJS.Row, index: number) {
    row.eachCell((cell) => {
      cell.border = border;
      cell.alignment = {
        vertical: "middle",
      };

      if (index % 2 === 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "F9FAFB" },
        };
      }
    });
  }

  function addReportHeader(sheet: ExcelJS.Worksheet, title: string) {
    sheet.mergeCells("A1:H1");

    const titleCell = sheet.getCell("A1");
    titleCell.value = title;
    titleCell.font = titleFont;
    titleCell.alignment = {
      vertical: "middle",
      horizontal: "left",
    };

    sheet.getRow(1).height = 32;

    sheet.mergeCells("A2:H2");

    const subtitleCell = sheet.getCell("A2");

    const dateText =
      from && to
        ? `${from} to ${to}`
        : from
          ? `From ${from}`
          : to
            ? `Until ${to}`
            : "All time";

    subtitleCell.value = search
      ? `Report period: ${dateText} • Search: ${search}`
      : `Report period: ${dateText}`;

    subtitleCell.font = subtitleFont;
    subtitleCell.alignment = {
      vertical: "middle",
      horizontal: "left",
    };

    sheet.getRow(2).height = 20;
  }

  // ============================================================
  // 1. SUMMARY SHEET
  // ============================================================

  const summary = workbook.addWorksheet("Summary");

  initSheetView(summary, 0);

  addReportHeader(summary, "Customer Report");

  // ── Report Information (moved above the KPI cards) ──
  summary.mergeCells("A4:H4");
  summary.getCell("A4").value = "Report Information";
  summary.getCell("A4").font = sectionFont;
  summary.getCell("A4").fill = sectionFill;
  summary.getCell("A4").alignment = {
    vertical: "middle",
  };

  summary.getRow(4).height = 24;

  summary.getCell("A5").value = "From";
  summary.getCell("B5").value = from ?? "All time";

  summary.getCell("A6").value = "To";
  summary.getCell("B6").value = to ?? "All time";

  summary.getCell("A7").value = "Search";
  summary.getCell("B7").value = search ?? "All customers";

  summary.getCell("A8").value = "Generated";
  summary.getCell("B8").value = new Date();

  summary.getCell("B8").numFmt = "yyyy-mm-dd hh:mm";

  for (let row = 5; row <= 8; row++) {
    summary.getCell(`A${row}`).font = {
      bold: true,
    };

    summary.getCell(`A${row}`).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F3F4F6" },
    };

    summary.getCell(`A${row}`).border = border;
    summary.getCell(`B${row}`).border = border;
  }

  // ── Report Summary (KPI cards) ──
  summary.mergeCells("A10:H10");

  summary.getCell("A10").value = "Report Summary";
  summary.getCell("A10").font = sectionFont;
  summary.getCell("A10").fill = sectionFill;
  summary.getCell("A10").alignment = {
    vertical: "middle",
  };

  summary.getRow(10).height = 24;

  const cards = [
    {
      label: "Customers",
      value: report.summary.totalCustomers,
      format: "0",
    },
    {
      label: "Total Visits",
      value: report.summary.totalInvoices,
      format: "0",
    },
    {
      label: "Total Revenue",
      value: Number(report.summary.totalBilled),
      format: AED_FORMAT,
    },
    {
      label: "Outstanding Amount",
      value: Number(report.summary.totalOutstanding),
      format: AED_FORMAT,
    },
  ];

  cards.forEach((card, index) => {
    const startCol = index + 1;

    const labelCell = summary.getCell(12, startCol);
    const valueCell = summary.getCell(13, startCol);

    labelCell.value = card.label;
    valueCell.value = card.value;

    labelCell.font = {
      name: "Aptos",
      size: 10,
      bold: false,
      color: { argb: "6B7280" },
    };

    valueCell.font = {
      name: "Aptos",
      size: 14,
      bold: false,
    };

    labelCell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    valueCell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    labelCell.border = border;
    valueCell.border = border;

    labelCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F3F4F6" },
    };

    valueCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFF" },
    };

    valueCell.numFmt = card.format;
  });

  summary.getRow(12).height = 22;
  summary.getRow(13).height = 30;

  summary.columns = [
    { width: 22 },
    { width: 22 },
    { width: 22 },
    { width: 22 },
    { width: 22 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
  ];

  // ============================================================
  // 2. CUSTOMERS SHEET
  //
  // Built as a genuine native Excel Table via addTable(), rather than
  // manual addRow() calls styled to look table-ish. addTable() writes
  // its own header + data rows from `columns`/`rows` — it isn't a
  // "decorate this existing range" call, so it must own all the rows
  // in its range. Mixing manual addRow() with addTable() on the same
  // range (as before) produces a workbook Excel flags as corrupted.
  //
  // `ref` is the table's single top-left anchor cell (e.g. "A4"), not
  // a full "A4:H..." range — ExcelJS derives the range itself from
  // the column/row counts.
  // ============================================================

  const customersSheet = workbook.addWorksheet("Customers");

  initSheetView(customersSheet, 4);

  addReportHeader(customersSheet, "Customers");

  customersSheet.addRow([]); // spacer → table starts at row 4

  const customerTableRows = report.customers.map((customer) => [
    customer.name,
    customer.phone,
    customer.email ?? "",
    customer.address ?? "",
    customer.invoiceCount,
    Number(customer.totalBilled),
    Number(customer.totalPaid),
    Number(customer.outstanding),
  ]);

  customersSheet.addTable({
    name: "CustomersTable",
    ref: "A4",
    headerRow: true,
    totalsRow: false,
    style: {
      theme: "TableStyleMedium2",
      showRowStripes: true,
    },
    columns: [
      { name: "Customer", filterButton: true },
      { name: "Phone", filterButton: true },
      { name: "Email", filterButton: true },
      { name: "Address", filterButton: true },
      { name: "Invoices", filterButton: true },
      { name: "Billed", filterButton: true },
      { name: "Paid", filterButton: true },
      { name: "Outstanding", filterButton: true },
    ],
    rows: customerTableRows,
  });

  // Number formats have to be applied to the written cells after the
  // fact — addTable()'s column config doesn't carry a numFmt option.
  customerTableRows.forEach((_, index) => {
    const excelRow = 5 + index; // row 4 = header, data starts row 5
    customersSheet.getCell(`F${excelRow}`).numFmt = AED_FORMAT;
    customersSheet.getCell(`G${excelRow}`).numFmt = AED_FORMAT;
    customersSheet.getCell(`H${excelRow}`).numFmt = AED_FORMAT;
  });

  customersSheet.getColumn("A").width = 25;
  customersSheet.getColumn("B").width = 17;
  customersSheet.getColumn("C").width = 30;
  customersSheet.getColumn("D").width = 35;
  customersSheet.getColumn("E").width = 12;
  customersSheet.getColumn("F").width = 16;
  customersSheet.getColumn("G").width = 16;
  customersSheet.getColumn("H").width = 18;

  // ============================================================
  // 3. INVOICES SHEET
  // ============================================================

  const invoicesSheet = workbook.addWorksheet("Invoices");

  initSheetView(invoicesSheet, 4);

  addReportHeader(invoicesSheet, "Invoices");

  invoicesSheet.addRow([]);

  const invoiceHeader = invoicesSheet.addRow([
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
  ]);

  styleHeader(invoiceHeader);

  let invoiceRowIndex = 0;

  for (const customer of report.customers) {
    for (const invoice of customer.invoices) {
      const row = invoicesSheet.addRow([
        customer.name,
        invoice.invoiceNumber,
        new Date(invoice.date),
        invoice.status,
        Number(invoice.subtotal),
        Number(invoice.discount),
        Number(invoice.tax),
        Number(invoice.total),
        Number(invoice.paid),
        Number(invoice.balance),
      ]);

      styleBody(row, invoiceRowIndex++);

      row.getCell(3).numFmt = "yyyy-mm-dd";

      for (let col = 5; col <= 10; col++) {
        row.getCell(col).numFmt = AED_FORMAT;
      }
    }
  }

  invoicesSheet.getColumn("A").width = 25;
  invoicesSheet.getColumn("B").width = 20;
  invoicesSheet.getColumn("C").width = 15;
  invoicesSheet.getColumn("D").width = 18;
  invoicesSheet.getColumn("E").width = 15;
  invoicesSheet.getColumn("F").width = 15;
  invoicesSheet.getColumn("G").width = 15;
  invoicesSheet.getColumn("H").width = 15;
  invoicesSheet.getColumn("I").width = 15;
  invoicesSheet.getColumn("J").width = 15;

  invoicesSheet.autoFilter = {
    from: "A4",
    to: `J${invoicesSheet.rowCount}`,
  };

  // ============================================================
  // 4. INVOICE ITEMS SHEET
  // ============================================================

  const itemsSheet = workbook.addWorksheet("Invoice Items");

  initSheetView(itemsSheet, 4);

  addReportHeader(itemsSheet, "Invoice Items");

  itemsSheet.addRow([]);

  const itemsHeader = itemsSheet.addRow([
    "Customer",
    "Invoice #",
    "Date",
    "Service",
    "Quantity",
    "Unit Price",
    "Subtotal",
    "Employees",
  ]);

  styleHeader(itemsHeader);

  let itemRowIndex = 0;

  for (const customer of report.customers) {
    for (const invoice of customer.invoices) {
      for (const item of invoice.items) {
        const row = itemsSheet.addRow([
          customer.name,
          invoice.invoiceNumber,
          new Date(invoice.date),
          item.serviceName,
          item.quantity,
          Number(item.unitPrice),
          Number(item.subtotal),
          item.employees.join("; "),
        ]);

        styleBody(row, itemRowIndex++);

        row.getCell(3).numFmt = "yyyy-mm-dd";
        row.getCell(6).numFmt = AED_FORMAT;
        row.getCell(7).numFmt = AED_FORMAT;
      }
    }
  }

  itemsSheet.getColumn("A").width = 25;
  itemsSheet.getColumn("B").width = 20;
  itemsSheet.getColumn("C").width = 15;
  itemsSheet.getColumn("D").width = 30;
  itemsSheet.getColumn("E").width = 12;
  itemsSheet.getColumn("F").width = 16;
  itemsSheet.getColumn("G").width = 16;
  itemsSheet.getColumn("H").width = 35;

  itemsSheet.autoFilter = {
    from: "A4",
    to: `H${itemsSheet.rowCount}`,
  };

  // ============================================================
  // Workbook properties
  // ============================================================

  workbook.title = "Customer Report";
  workbook.subject = "Customer, invoice and service report";
  workbook.company = "Salon Management System";
  workbook.category = "Reports";
  workbook.keywords = "customer, invoices, revenue, salon";

  // ============================================================
  // Generate XLSX
  // ============================================================

  const buffer = await workbook.xlsx.writeBuffer();

  const rangeSuffix = from && to ? `-${from}-to-${to}` : "";

  const filename = `customer-report${rangeSuffix}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
