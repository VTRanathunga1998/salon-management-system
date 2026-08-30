// app/api/reports/xlsx/route.ts
//
// Single combined workbook: one download containing Expense, Service, and
// Business report data as separate tabs, replacing the three individual
// /api/reports/{expense,service,business}/xlsx routes.

import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getExpenseReportData } from "@/lib/reports/expense";
import { getServiceReport } from "@/lib/reports/serviceReport";
import { getReportData } from "@/lib/reports/actions";
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

const AED_FORMAT = '"AED" #,##0.00';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // Sub-report-specific filters — optional, default to "all"
    const expenseCategoryId = searchParams.get("categoryId") ?? undefined;
    const serviceSearch = searchParams.get("search") ?? undefined;
    const serviceId = searchParams.get("serviceId") ?? undefined;

    const fromLabel = isValidDateString(fromParam)
      ? fromParam
      : firstDayOfCurrentMonthInSalonTz();
    const toLabel = isValidDateString(toParam) ? toParam : todayInSalonTz();

    const from = startOfDayInSalonTz(fromLabel);
    const to = endOfDayInSalonTz(toLabel);

    const [
      expenseReport,
      expenseCategory,
      serviceReport,
      service,
      businessReport,
    ] = await Promise.all([
      getExpenseReportData({ from, to, categoryId: expenseCategoryId }),
      expenseCategoryId
        ? prisma.expenseCategory.findUnique({
            where: { id: expenseCategoryId },
            select: { name: true },
          })
        : Promise.resolve(null),
      getServiceReport({
        search: serviceSearch,
        serviceId,
        from: fromLabel,
        to: toLabel,
      }),
      serviceId
        ? prisma.service.findUnique({
            where: { id: serviceId },
            select: { name: true },
          })
        : Promise.resolve(null),
      getReportData({ from, to }),
    ]);

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Salon Management System";
    workbook.lastModifiedBy = "Salon Management System";
    workbook.created = new Date();
    workbook.modified = new Date();

    // ============================================================
    // Shared styles — reused across every tab
    // ============================================================

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

    function addReportHeader(
      sheet: ExcelJS.Worksheet,
      title: string,
      subtitle: string,
      lastCol: string = "F",
    ) {
      sheet.mergeCells(`A1:${lastCol}1`);

      const titleCell = sheet.getCell("A1");
      titleCell.value = title;
      titleCell.font = titleFont;
      titleCell.alignment = {
        vertical: "middle",
        horizontal: "left",
      };

      sheet.getRow(1).height = 32;

      sheet.mergeCells(`A2:${lastCol}2`);

      const subtitleCell = sheet.getCell("A2");
      subtitleCell.value = subtitle;
      subtitleCell.font = subtitleFont;
      subtitleCell.alignment = {
        vertical: "middle",
        horizontal: "left",
      };

      sheet.getRow(2).height = 20;
    }

    const periodSubtitle = `Report period: ${fromLabel} to ${toLabel}`;

    // ============================================================
    // TAB 1 — Expense Summary
    // ============================================================

    const expenseSummary = workbook.addWorksheet("Expense Summary");

    initSheetView(expenseSummary, 0);

    addReportHeader(
      expenseSummary,
      "Expense Report",
      expenseCategory?.name
        ? `${periodSubtitle} • Category: ${expenseCategory.name}`
        : periodSubtitle,
    );

    expenseSummary.mergeCells("A4:F4");
    expenseSummary.getCell("A4").value = "Report Information";
    expenseSummary.getCell("A4").font = sectionFont;
    expenseSummary.getCell("A4").fill = sectionFill;
    expenseSummary.getCell("A4").alignment = { vertical: "middle" };
    expenseSummary.getRow(4).height = 24;

    expenseSummary.getCell("A5").value = "From";
    expenseSummary.getCell("B5").value = fromLabel;
    expenseSummary.getCell("A6").value = "To";
    expenseSummary.getCell("B6").value = toLabel;
    expenseSummary.getCell("A7").value = "Category";
    expenseSummary.getCell("B7").value =
      expenseCategory?.name ?? "All Categories";
    expenseSummary.getCell("A8").value = "Generated";
    expenseSummary.getCell("B8").value = new Date();
    expenseSummary.getCell("B8").numFmt = "yyyy-mm-dd hh:mm";

    for (let row = 5; row <= 8; row++) {
      expenseSummary.getCell(`A${row}`).font = { bold: true };
      expenseSummary.getCell(`A${row}`).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F3F4F6" },
      };
      expenseSummary.getCell(`A${row}`).border = border;
      expenseSummary.getCell(`B${row}`).border = border;
    }

    expenseSummary.mergeCells("A10:F10");
    expenseSummary.getCell("A10").value = "Report Summary";
    expenseSummary.getCell("A10").font = sectionFont;
    expenseSummary.getCell("A10").fill = sectionFill;
    expenseSummary.getCell("A10").alignment = { vertical: "middle" };
    expenseSummary.getRow(10).height = 24;

    const expenseCards = [
      {
        label: "Total Amount",
        value: Number(expenseReport.summary.totalAmount),
        format: AED_FORMAT,
      },
      {
        label: "Expense Count",
        value: expenseReport.summary.count,
        format: "0",
      },
    ];

    expenseCards.forEach((card, index) => {
      const startCol = index + 1;
      const labelCell = expenseSummary.getCell(12, startCol);
      const valueCell = expenseSummary.getCell(13, startCol);

      labelCell.value = card.label;
      valueCell.value = card.value;
      labelCell.font = { name: "Aptos", size: 10, color: { argb: "6B7280" } };
      valueCell.font = { name: "Aptos", size: 14 };
      labelCell.alignment = { horizontal: "center", vertical: "middle" };
      valueCell.alignment = { horizontal: "center", vertical: "middle" };
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

    expenseSummary.getRow(12).height = 22;
    expenseSummary.getRow(13).height = 30;

    expenseSummary.addRow([]);
    const expCategorySectionRow = expenseSummary.addRow(["By Category"]);
    expenseSummary.mergeCells(
      `A${expCategorySectionRow.number}:F${expCategorySectionRow.number}`,
    );
    expCategorySectionRow.getCell(1).font = sectionFont;
    expCategorySectionRow.getCell(1).fill = sectionFill;
    expCategorySectionRow.getCell(1).alignment = { vertical: "middle" };
    expCategorySectionRow.height = 22;

    const expCategoryHeaderRow = expenseSummary.addRow(["Category", "Amount"]);
    styleHeader(expCategoryHeaderRow);

    expenseReport.categoryBreakdown.forEach(
      (c: { category: string; amount: number }, index: number) => {
        const row = expenseSummary.addRow([c.category, Number(c.amount)]);
        styleBody(row, index);
        row.getCell(2).numFmt = AED_FORMAT;
      },
    );

    expenseSummary.addRow([]);
    const expMethodSectionRow = expenseSummary.addRow(["By Payment Method"]);
    expenseSummary.mergeCells(
      `A${expMethodSectionRow.number}:F${expMethodSectionRow.number}`,
    );
    expMethodSectionRow.getCell(1).font = sectionFont;
    expMethodSectionRow.getCell(1).fill = sectionFill;
    expMethodSectionRow.getCell(1).alignment = { vertical: "middle" };
    expMethodSectionRow.height = 22;

    const expMethodHeaderRow = expenseSummary.addRow(["Method", "Amount"]);
    styleHeader(expMethodHeaderRow);

    expenseReport.methodBreakdown.forEach(
      (m: { method: string; amount: number }, index: number) => {
        const row = expenseSummary.addRow([m.method, Number(m.amount)]);
        styleBody(row, index);
        row.getCell(2).numFmt = AED_FORMAT;
      },
    );

    expenseSummary.columns = [
      { width: 24 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
    ];

    // ============================================================
    // TAB 2 — Expenses (detail table)
    // ============================================================

    const expensesSheet = workbook.addWorksheet("Expenses");

    initSheetView(expensesSheet, 4);

    addReportHeader(expensesSheet, "Expenses", periodSubtitle);

    expensesSheet.addRow([]);

    const expenseRows = expenseReport.expenses.map(
      (e: {
        date: Date | string;
        title: string;
        category: string;
        amount: number;
        method: string;
        notes: string | null;
      }) => [
        new Date(e.date).toISOString().slice(0, 10),
        e.title,
        e.category,
        Number(e.amount),
        e.method,
        e.notes ?? "",
      ],
    );

    expensesSheet.addTable({
      name: "ExpensesTable",
      ref: "A4",
      headerRow: true,
      totalsRow: false,
      style: { theme: "TableStyleMedium2", showRowStripes: true },
      columns: [
        { name: "Date", filterButton: true },
        { name: "Title", filterButton: true },
        { name: "Category", filterButton: true },
        { name: "Amount", filterButton: true },
        { name: "Method", filterButton: true },
        { name: "Notes", filterButton: true },
      ],
      rows: expenseRows,
    });

    expenseRows.forEach((_: unknown, index: number) => {
      expensesSheet.getCell(`D${5 + index}`).numFmt = AED_FORMAT;
    });

    expensesSheet.getColumn("A").width = 14;
    expensesSheet.getColumn("B").width = 28;
    expensesSheet.getColumn("C").width = 20;
    expensesSheet.getColumn("D").width = 16;
    expensesSheet.getColumn("E").width = 16;
    expensesSheet.getColumn("F").width = 35;

    // ============================================================
    // TAB 3 — Service Summary
    // ============================================================

    const serviceSummary = workbook.addWorksheet("Service Summary");

    initSheetView(serviceSummary, 0);

    addReportHeader(
      serviceSummary,
      "Service Report",
      service?.name
        ? `${periodSubtitle} • Service: ${service.name}`
        : periodSubtitle,
    );

    serviceSummary.mergeCells("A4:F4");
    serviceSummary.getCell("A4").value = "Report Information";
    serviceSummary.getCell("A4").font = sectionFont;
    serviceSummary.getCell("A4").fill = sectionFill;
    serviceSummary.getCell("A4").alignment = { vertical: "middle" };
    serviceSummary.getRow(4).height = 24;

    serviceSummary.getCell("A5").value = "From";
    serviceSummary.getCell("B5").value = fromLabel;
    serviceSummary.getCell("A6").value = "To";
    serviceSummary.getCell("B6").value = toLabel;
    serviceSummary.getCell("A7").value = "Service";
    serviceSummary.getCell("B7").value = service?.name ?? "All Services";
    serviceSummary.getCell("A8").value = "Generated";
    serviceSummary.getCell("B8").value = new Date();
    serviceSummary.getCell("B8").numFmt = "yyyy-mm-dd hh:mm";

    for (let row = 5; row <= 8; row++) {
      serviceSummary.getCell(`A${row}`).font = { bold: true };
      serviceSummary.getCell(`A${row}`).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F3F4F6" },
      };
      serviceSummary.getCell(`A${row}`).border = border;
      serviceSummary.getCell(`B${row}`).border = border;
    }

    serviceSummary.mergeCells("A10:F10");
    serviceSummary.getCell("A10").value = "Report Summary";
    serviceSummary.getCell("A10").font = sectionFont;
    serviceSummary.getCell("A10").fill = sectionFill;
    serviceSummary.getCell("A10").alignment = { vertical: "middle" };
    serviceSummary.getRow(10).height = 24;

    const serviceCards = [
      {
        label: "Service Types",
        value: serviceReport.summary.totalServiceTypes,
        format: "0",
      },
      {
        label: "Total Bookings",
        value: serviceReport.summary.totalBookings,
        format: "0",
      },
      {
        label: "Total Quantity",
        value: serviceReport.summary.totalQuantity,
        format: "0",
      },
      {
        label: "Total Revenue",
        value: Number(serviceReport.summary.totalRevenue),
        format: AED_FORMAT,
      },
    ];

    serviceCards.forEach((card, index) => {
      const startCol = index + 1;
      const labelCell = serviceSummary.getCell(12, startCol);
      const valueCell = serviceSummary.getCell(13, startCol);

      labelCell.value = card.label;
      valueCell.value = card.value;
      labelCell.font = { name: "Aptos", size: 10, color: { argb: "6B7280" } };
      valueCell.font = { name: "Aptos", size: 14 };
      labelCell.alignment = { horizontal: "center", vertical: "middle" };
      valueCell.alignment = { horizontal: "center", vertical: "middle" };
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

    serviceSummary.getRow(12).height = 22;
    serviceSummary.getRow(13).height = 30;

    serviceSummary.addRow([]);
    const byServiceSectionRow = serviceSummary.addRow(["By Service"]);
    serviceSummary.mergeCells(
      `A${byServiceSectionRow.number}:F${byServiceSectionRow.number}`,
    );
    byServiceSectionRow.getCell(1).font = sectionFont;
    byServiceSectionRow.getCell(1).fill = sectionFill;
    byServiceSectionRow.getCell(1).alignment = { vertical: "middle" };
    byServiceSectionRow.height = 22;

    const byServiceHeaderRow = serviceSummary.addRow([
      "Service",
      "Active",
      "Times Performed",
      "Quantity",
      "Revenue",
    ]);
    styleHeader(byServiceHeaderRow);

    serviceReport.services.forEach((s, index) => {
      const row = serviceSummary.addRow([
        s.name,
        s.isActive ? "Yes" : "No",
        s.timesPerformed,
        s.totalQuantity,
        Number(s.totalRevenue),
      ]);
      styleBody(row, index);
      row.getCell(5).numFmt = AED_FORMAT;
    });

    serviceSummary.columns = [
      { width: 24 },
      { width: 16 },
      { width: 18 },
      { width: 14 },
      { width: 18 },
      { width: 18 },
    ];

    // ============================================================
    // TAB 4 — Bookings (service detail table)
    // ============================================================

    const bookingsSheet = workbook.addWorksheet("Bookings");

    initSheetView(bookingsSheet, 4);

    addReportHeader(bookingsSheet, "Bookings", periodSubtitle);

    bookingsSheet.addRow([]);

    const bookingRows: (string | number)[][] = [];

    for (const s of serviceReport.services) {
      for (const e of s.entries) {
        bookingRows.push([
          s.name,
          new Date(e.date).toISOString().slice(0, 10),
          e.invoiceNumber,
          e.customerName,
          e.customerPhone,
          e.quantity,
          Number(e.unitPrice),
          Number(e.subtotal),
          e.employees.join("; "),
        ]);
      }
    }

    bookingsSheet.addTable({
      name: "BookingsTable",
      ref: "A4",
      headerRow: true,
      totalsRow: false,
      style: { theme: "TableStyleMedium2", showRowStripes: true },
      columns: [
        { name: "Service", filterButton: true },
        { name: "Date", filterButton: true },
        { name: "Invoice #", filterButton: true },
        { name: "Customer", filterButton: true },
        { name: "Phone", filterButton: true },
        { name: "Quantity", filterButton: true },
        { name: "Unit Price", filterButton: true },
        { name: "Subtotal", filterButton: true },
        { name: "Employees", filterButton: true },
      ],
      rows: bookingRows,
    });

    bookingRows.forEach((_, index) => {
      const excelRow = 5 + index;
      bookingsSheet.getCell(`G${excelRow}`).numFmt = AED_FORMAT;
      bookingsSheet.getCell(`H${excelRow}`).numFmt = AED_FORMAT;
    });

    bookingsSheet.getColumn("A").width = 22;
    bookingsSheet.getColumn("B").width = 14;
    bookingsSheet.getColumn("C").width = 16;
    bookingsSheet.getColumn("D").width = 22;
    bookingsSheet.getColumn("E").width = 16;
    bookingsSheet.getColumn("F").width = 12;
    bookingsSheet.getColumn("G").width = 14;
    bookingsSheet.getColumn("H").width = 14;
    bookingsSheet.getColumn("I").width = 30;

    // ============================================================
    // TAB 5 — Business Summary
    // ============================================================

    const businessSummary = workbook.addWorksheet("Business Summary");

    initSheetView(businessSummary, 0);

    addReportHeader(businessSummary, "Business Report", periodSubtitle);

    businessSummary.mergeCells("A4:F4");
    businessSummary.getCell("A4").value = "Report Information";
    businessSummary.getCell("A4").font = sectionFont;
    businessSummary.getCell("A4").fill = sectionFill;
    businessSummary.getCell("A4").alignment = { vertical: "middle" };
    businessSummary.getRow(4).height = 24;

    businessSummary.getCell("A5").value = "From";
    businessSummary.getCell("B5").value = fromLabel;
    businessSummary.getCell("A6").value = "To";
    businessSummary.getCell("B6").value = toLabel;
    businessSummary.getCell("A7").value = "Generated";
    businessSummary.getCell("B7").value = new Date();
    businessSummary.getCell("B7").numFmt = "yyyy-mm-dd hh:mm";

    for (let row = 5; row <= 7; row++) {
      businessSummary.getCell(`A${row}`).font = { bold: true };
      businessSummary.getCell(`A${row}`).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F3F4F6" },
      };
      businessSummary.getCell(`A${row}`).border = border;
      businessSummary.getCell(`B${row}`).border = border;
    }

    businessSummary.mergeCells("A9:F9");
    businessSummary.getCell("A9").value = "Report Summary";
    businessSummary.getCell("A9").font = sectionFont;
    businessSummary.getCell("A9").fill = sectionFill;
    businessSummary.getCell("A9").alignment = { vertical: "middle" };
    businessSummary.getRow(9).height = 24;

    const businessCards = [
      {
        label: "Total Revenue",
        value: Number(businessReport.summary.totalRevenue),
        format: AED_FORMAT,
      },
      {
        label: "Invoiced Total",
        value: Number(businessReport.summary.invoicedTotal),
        format: AED_FORMAT,
      },
      {
        label: "Outstanding",
        value: Number(businessReport.summary.outstanding),
        format: AED_FORMAT,
      },
      {
        label: "Invoice Count",
        value: businessReport.summary.invoiceCount,
        format: "0",
      },
      {
        label: "Total Expense",
        value: Number(businessReport.summary.totalExpense),
        format: AED_FORMAT,
      },
      {
        label: "Total Profit",
        value: Number(businessReport.summary.totalProfit),
        format: AED_FORMAT,
      },
      {
        label: "Customers Served",
        value: businessReport.summary.customersServed,
        format: "0",
      },
    ];

    const CARDS_PER_ROW = 4;

    businessCards.forEach((card, index) => {
      const startCol = (index % CARDS_PER_ROW) + 1;
      const rowOffset = Math.floor(index / CARDS_PER_ROW) * 2;
      const labelRow = 11 + rowOffset;
      const valueRow = 12 + rowOffset;

      const labelCell = businessSummary.getCell(labelRow, startCol);
      const valueCell = businessSummary.getCell(valueRow, startCol);

      labelCell.value = card.label;
      valueCell.value = card.value;
      labelCell.font = { name: "Aptos", size: 10, color: { argb: "6B7280" } };
      valueCell.font = { name: "Aptos", size: 14 };
      labelCell.alignment = { horizontal: "center", vertical: "middle" };
      valueCell.alignment = { horizontal: "center", vertical: "middle" };
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

      businessSummary.getRow(labelRow).height = 22;
      businessSummary.getRow(valueRow).height = 30;
    });

    const kpiRowCount = Math.ceil(businessCards.length / CARDS_PER_ROW);
    let cursorRow = 11 + kpiRowCount * 2 + 1;

    const methodSectionRow = businessSummary.getRow(cursorRow);
    methodSectionRow.getCell(1).value = "By Payment Method";
    businessSummary.mergeCells(`A${cursorRow}:F${cursorRow}`);
    methodSectionRow.getCell(1).font = sectionFont;
    methodSectionRow.getCell(1).fill = sectionFill;
    methodSectionRow.getCell(1).alignment = { vertical: "middle" };
    methodSectionRow.height = 22;
    cursorRow += 1;

    const methodHeaderRow = businessSummary.getRow(cursorRow);
    methodHeaderRow.getCell(1).value = "Method";
    methodHeaderRow.getCell(2).value = "Amount";
    styleHeader(methodHeaderRow);
    cursorRow += 1;

    businessReport.methodBreakdown.forEach(
      (m: { method: string; amount: number }, index: number) => {
        const row = businessSummary.getRow(cursorRow);
        row.getCell(1).value = m.method;
        row.getCell(2).value = Number(m.amount);
        row.getCell(2).numFmt = AED_FORMAT;
        styleBody(row, index);
        cursorRow += 1;
      },
    );

    cursorRow += 1;

    const statusSectionRow = businessSummary.getRow(cursorRow);
    statusSectionRow.getCell(1).value = "Invoices By Status";
    businessSummary.mergeCells(`A${cursorRow}:F${cursorRow}`);
    statusSectionRow.getCell(1).font = sectionFont;
    statusSectionRow.getCell(1).fill = sectionFill;
    statusSectionRow.getCell(1).alignment = { vertical: "middle" };
    statusSectionRow.height = 22;
    cursorRow += 1;

    const statusHeaderRow = businessSummary.getRow(cursorRow);
    statusHeaderRow.getCell(1).value = "Status";
    statusHeaderRow.getCell(2).value = "Count";
    styleHeader(statusHeaderRow);
    cursorRow += 1;

    Object.entries(businessReport.statusBreakdown).forEach(
      ([status, count], index) => {
        const row = businessSummary.getRow(cursorRow);
        row.getCell(1).value = status;
        row.getCell(2).value = count as number;
        styleBody(row, index);
        cursorRow += 1;
      },
    );

    businessSummary.columns = [
      { width: 24 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
    ];

    // ============================================================
    // TAB 6 — Revenue Over Time
    // ============================================================

    const revenueSheet = workbook.addWorksheet("Revenue Over Time");

    initSheetView(revenueSheet, 4);

    addReportHeader(revenueSheet, "Revenue Over Time", periodSubtitle, "B");

    revenueSheet.addRow([]);

    const revenueRows = businessReport.revenueSeries.map(
      (point: { date: string; amount: number }) => [
        point.date,
        Number(point.amount),
      ],
    );

    revenueSheet.addTable({
      name: "RevenueTable",
      ref: "A4",
      headerRow: true,
      totalsRow: false,
      style: { theme: "TableStyleMedium2", showRowStripes: true },
      columns: [
        { name: "Date", filterButton: true },
        { name: "Revenue", filterButton: true },
      ],
      rows: revenueRows,
    });

    revenueRows.forEach((_: unknown, index: number) => {
      revenueSheet.getCell(`B${5 + index}`).numFmt = AED_FORMAT;
    });

    revenueSheet.getColumn("A").width = 16;
    revenueSheet.getColumn("B").width = 18;

    // ============================================================
    // TAB 7 — Employees
    // ============================================================

    const employeesSheet = workbook.addWorksheet("Employees");

    initSheetView(employeesSheet, 4);

    addReportHeader(employeesSheet, "By Employee", periodSubtitle, "C");

    employeesSheet.addRow([]);

    const employeeRows = businessReport.employeeStats.map(
      (e: { name: string; servicesCount: number; revenue: number }) => [
        e.name,
        e.servicesCount,
        Number(e.revenue),
      ],
    );

    employeesSheet.addTable({
      name: "EmployeesTable",
      ref: "A4",
      headerRow: true,
      totalsRow: false,
      style: { theme: "TableStyleMedium2", showRowStripes: true },
      columns: [
        { name: "Employee", filterButton: true },
        { name: "Services Count", filterButton: true },
        { name: "Revenue", filterButton: true },
      ],
      rows: employeeRows,
    });

    employeeRows.forEach((_: unknown, index: number) => {
      employeesSheet.getCell(`C${5 + index}`).numFmt = AED_FORMAT;
    });

    employeesSheet.getColumn("A").width = 24;
    employeesSheet.getColumn("B").width = 18;
    employeesSheet.getColumn("C").width = 18;

    // ============================================================
    // TAB 8 — Services
    // ============================================================

    const servicesSheet = workbook.addWorksheet("Services");

    initSheetView(servicesSheet, 4);

    addReportHeader(servicesSheet, "By Service", periodSubtitle, "C");

    servicesSheet.addRow([]);

    const serviceStatRows = businessReport.serviceStats.map(
      (s: { name: string; timesPerformed: number; revenue: number }) => [
        s.name,
        s.timesPerformed,
        Number(s.revenue),
      ],
    );

    servicesSheet.addTable({
      name: "ServicesTable",
      ref: "A4",
      headerRow: true,
      totalsRow: false,
      style: { theme: "TableStyleMedium2", showRowStripes: true },
      columns: [
        { name: "Service", filterButton: true },
        { name: "Times Performed", filterButton: true },
        { name: "Revenue", filterButton: true },
      ],
      rows: serviceStatRows,
    });

    serviceStatRows.forEach((_: unknown, index: number) => {
      servicesSheet.getCell(`C${5 + index}`).numFmt = AED_FORMAT;
    });

    servicesSheet.getColumn("A").width = 24;
    servicesSheet.getColumn("B").width = 18;
    servicesSheet.getColumn("C").width = 18;

    // ============================================================
    // TAB 9 — Top Customers
    // ============================================================

    const customersSheet = workbook.addWorksheet("Top Customers");

    initSheetView(customersSheet, 4);

    addReportHeader(customersSheet, "Top Customers", periodSubtitle, "C");

    customersSheet.addRow([]);

    const customerRows = businessReport.topCustomers.map(
      (c: { name: string; invoiceCount: number; spend: number }) => [
        c.name,
        c.invoiceCount,
        Number(c.spend),
      ],
    );

    customersSheet.addTable({
      name: "TopCustomersTable",
      ref: "A4",
      headerRow: true,
      totalsRow: false,
      style: { theme: "TableStyleMedium2", showRowStripes: true },
      columns: [
        { name: "Customer", filterButton: true },
        { name: "Invoice Count", filterButton: true },
        { name: "Spend", filterButton: true },
      ],
      rows: customerRows,
    });

    customerRows.forEach((_: unknown, index: number) => {
      customersSheet.getCell(`C${5 + index}`).numFmt = AED_FORMAT;
    });

    customersSheet.getColumn("A").width = 24;
    customersSheet.getColumn("B").width = 18;
    customersSheet.getColumn("C").width = 18;

    // ============================================================
    // TAB 10 — Service Log
    // ============================================================

    const logSheet = workbook.addWorksheet("Service Log");

    initSheetView(logSheet, 4);

    addReportHeader(logSheet, "Employee Service Log", periodSubtitle, "G");

    logSheet.addRow([]);

    const logRows = businessReport.employeeServiceLog.map(
      (row: {
        date: Date | string;
        employeeName: string;
        serviceName: string;
        customerName: string;
        invoiceNumber: string;
        quantity: number;
        amount: number;
      }) => [
        new Date(row.date).toISOString().slice(0, 10),
        row.employeeName,
        row.serviceName,
        row.customerName,
        row.invoiceNumber,
        row.quantity,
        Number(row.amount),
      ],
    );

    logSheet.addTable({
      name: "ServiceLogTable",
      ref: "A4",
      headerRow: true,
      totalsRow: false,
      style: { theme: "TableStyleMedium2", showRowStripes: true },
      columns: [
        { name: "Date", filterButton: true },
        { name: "Employee", filterButton: true },
        { name: "Service", filterButton: true },
        { name: "Customer", filterButton: true },
        { name: "Invoice #", filterButton: true },
        { name: "Quantity", filterButton: true },
        { name: "Amount", filterButton: true },
      ],
      rows: logRows,
    });

    logRows.forEach((_: unknown, index: number) => {
      logSheet.getCell(`G${5 + index}`).numFmt = AED_FORMAT;
    });

    logSheet.getColumn("A").width = 14;
    logSheet.getColumn("B").width = 20;
    logSheet.getColumn("C").width = 22;
    logSheet.getColumn("D").width = 22;
    logSheet.getColumn("E").width = 16;
    logSheet.getColumn("F").width = 12;
    logSheet.getColumn("G").width = 14;

    // ============================================================
    // Workbook properties
    // ============================================================

    workbook.title = "Combined Report";
    workbook.subject = "Expense, service, and business report";
    workbook.company = "Salon Management System";
    workbook.category = "Reports";
    workbook.keywords =
      "expenses, services, revenue, employees, customers, salon";

    // ============================================================
    // Generate XLSX
    // ============================================================

    const buffer = await workbook.xlsx.writeBuffer();

    const filename = `combined-report-${fromLabel}-to-${toLabel}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Combined XLSX report error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate combined report.",
      },
      { status: 500 },
    );
  }
}
