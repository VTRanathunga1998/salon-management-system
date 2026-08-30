// app/api/reports/expense/xlsx/route.ts

import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getExpenseReportData } from "@/lib/reports/expense";
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

const AED_FORMAT = '"AED" #,##0.00';

export async function GET(req: NextRequest) {
  try {
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

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Salon Management System";
    workbook.lastModifiedBy = "Salon Management System";
    workbook.created = new Date();
    workbook.modified = new Date();

    // ============================================================
    // Shared styles
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

    function addReportHeader(sheet: ExcelJS.Worksheet, title: string) {
      sheet.mergeCells("A1:F1");

      const titleCell = sheet.getCell("A1");
      titleCell.value = title;
      titleCell.font = titleFont;
      titleCell.alignment = {
        vertical: "middle",
        horizontal: "left",
      };

      sheet.getRow(1).height = 32;

      sheet.mergeCells("A2:F2");

      const subtitleCell = sheet.getCell("A2");

      subtitleCell.value = categoryLabel
        ? `Report period: ${fromDate} to ${toDate} • Category: ${categoryLabel}`
        : `Report period: ${fromDate} to ${toDate}`;

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

    addReportHeader(summary, "Expense Report");

    // ── Report Information ──
    summary.mergeCells("A4:F4");
    summary.getCell("A4").value = "Report Information";
    summary.getCell("A4").font = sectionFont;
    summary.getCell("A4").fill = sectionFill;
    summary.getCell("A4").alignment = { vertical: "middle" };

    summary.getRow(4).height = 24;

    summary.getCell("A5").value = "From";
    summary.getCell("B5").value = fromDate;

    summary.getCell("A6").value = "To";
    summary.getCell("B6").value = toDate;

    summary.getCell("A7").value = "Category";
    summary.getCell("B7").value = categoryLabel ?? "All Categories";

    summary.getCell("A8").value = "Generated";
    summary.getCell("B8").value = new Date();
    summary.getCell("B8").numFmt = "yyyy-mm-dd hh:mm";

    for (let row = 5; row <= 8; row++) {
      summary.getCell(`A${row}`).font = { bold: true };

      summary.getCell(`A${row}`).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F3F4F6" },
      };

      summary.getCell(`A${row}`).border = border;
      summary.getCell(`B${row}`).border = border;
    }

    // ── Report Summary (KPI cards) ──
    summary.mergeCells("A10:F10");
    summary.getCell("A10").value = "Report Summary";
    summary.getCell("A10").font = sectionFont;
    summary.getCell("A10").fill = sectionFill;
    summary.getCell("A10").alignment = { vertical: "middle" };

    summary.getRow(10).height = 24;

    const cards = [
      {
        label: "Total Amount",
        value: Number(report.summary.totalAmount),
        format: AED_FORMAT,
      },
      {
        label: "Expense Count",
        value: report.summary.count,
        format: "0",
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

    summary.getRow(12).height = 22;
    summary.getRow(13).height = 30;

    // ── By Category ──
    summary.addRow([]); // row 14 — spacer

    const categorySectionRow = summary.addRow(["By Category"]);
    summary.mergeCells(
      `A${categorySectionRow.number}:F${categorySectionRow.number}`,
    );
    categorySectionRow.getCell(1).font = sectionFont;
    categorySectionRow.getCell(1).fill = sectionFill;
    categorySectionRow.getCell(1).alignment = { vertical: "middle" };
    categorySectionRow.height = 22;

    const categoryHeaderRow = summary.addRow(["Category", "Amount"]);
    styleHeader(categoryHeaderRow);

    report.categoryBreakdown.forEach(
      (c: { category: string; amount: number }, index: number) => {
        const row = summary.addRow([c.category, Number(c.amount)]);
        styleBody(row, index);
        row.getCell(2).numFmt = AED_FORMAT;
      },
    );

    // ── By Payment Method ──
    summary.addRow([]); // spacer

    const methodSectionRow = summary.addRow(["By Payment Method"]);
    summary.mergeCells(
      `A${methodSectionRow.number}:F${methodSectionRow.number}`,
    );
    methodSectionRow.getCell(1).font = sectionFont;
    methodSectionRow.getCell(1).fill = sectionFill;
    methodSectionRow.getCell(1).alignment = { vertical: "middle" };
    methodSectionRow.height = 22;

    const methodHeaderRow = summary.addRow(["Method", "Amount"]);
    styleHeader(methodHeaderRow);

    report.methodBreakdown.forEach(
      (m: { method: string; amount: number }, index: number) => {
        const row = summary.addRow([m.method, Number(m.amount)]);
        styleBody(row, index);
        row.getCell(2).numFmt = AED_FORMAT;
      },
    );

    summary.columns = [
      { width: 24 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
    ];

    // ============================================================
    // 2. EXPENSES SHEET
    //
    // Native Excel Table via addTable() — same reasoning as the other
    // reports' detail sheets: addTable() writes its own header + data
    // rows, so it can't be mixed with manual addRow() calls on the
    // same range. `ref` is a single anchor cell, not a full range.
    //
    // report.series (chart-bucketed day/month totals for the dashboard
    // graph) is intentionally skipped here too — this itemized log
    // already covers every underlying expense, which is what's useful
    // in a spreadsheet export.
    // ============================================================

    const expensesSheet = workbook.addWorksheet("Expenses");

    initSheetView(expensesSheet, 4);

    addReportHeader(expensesSheet, "Expenses");

    expensesSheet.addRow([]); // spacer → table starts at row 4

    const expenseRows = report.expenses.map(
      (e: {
        date: Date | string;
        title: string;
        category: string;
        amount: number;
        method: string;
        notes: string | null;
      }) => [
        toDateInputInSalonTz(new Date(e.date)),
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
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
      },
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

    // numFmt applied post-write — addTable()'s column config has no
    // numFmt option.
    expenseRows.forEach((_: unknown, index: number) => {
      const excelRow = 5 + index; // row 4 = header, data starts row 5
      expensesSheet.getCell(`D${excelRow}`).numFmt = AED_FORMAT;
    });

    expensesSheet.getColumn("A").width = 14;
    expensesSheet.getColumn("B").width = 28;
    expensesSheet.getColumn("C").width = 20;
    expensesSheet.getColumn("D").width = 16;
    expensesSheet.getColumn("E").width = 16;
    expensesSheet.getColumn("F").width = 35;

    // ============================================================
    // Workbook properties
    // ============================================================

    workbook.title = "Expense Report";
    workbook.subject = "Expense breakdown and detail report";
    workbook.company = "Salon Management System";
    workbook.category = "Reports";
    workbook.keywords = "expenses, category, payment method, salon";

    // ============================================================
    // Generate XLSX
    // ============================================================

    const buffer = await workbook.xlsx.writeBuffer();

    const filename = `expense-report-${fromDate}-to-${toDate}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Expense XLSX report error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate expense report.",
      },
      { status: 500 },
    );
  }
}
