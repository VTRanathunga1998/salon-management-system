// app/api/reports/employee/xlsx/route.ts

import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
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

const AED_FORMAT = '"AED" #,##0.00';

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

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Salon Management System";
    workbook.lastModifiedBy = "Salon Management System";
    workbook.created = new Date();
    workbook.modified = new Date();

    // ============================================================
    // Shared styles
    // ============================================================

    // Partial<Font>/<Borders>, not the bare types — ExcelJS's Font
    // interface marks most fields as required even though only a
    // subset is ever needed at runtime; Partial<Borders> is fine too
    // (confirmed working) even though Borders' fields are individually
    // optional already.
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

    const employeeLabel = employee?.name ?? "All Employees";

    function addReportHeader(sheet: ExcelJS.Worksheet, title: string) {
      sheet.mergeCells("A1:G1");

      const titleCell = sheet.getCell("A1");
      titleCell.value = title;
      titleCell.font = titleFont;
      titleCell.alignment = {
        vertical: "middle",
        horizontal: "left",
      };

      sheet.getRow(1).height = 32;

      sheet.mergeCells("A2:G2");

      const subtitleCell = sheet.getCell("A2");

      subtitleCell.value = `Report period: ${fromDate} to ${toDate} • Employee: ${employeeLabel}`;

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

    addReportHeader(summary, "Employee Report");

    // ── Report Information ──
    summary.mergeCells("A4:G4");
    summary.getCell("A4").value = "Report Information";
    summary.getCell("A4").font = sectionFont;
    summary.getCell("A4").fill = sectionFill;
    summary.getCell("A4").alignment = {
      vertical: "middle",
    };

    summary.getRow(4).height = 24;

    summary.getCell("A5").value = "From";
    summary.getCell("B5").value = fromDate;

    summary.getCell("A6").value = "To";
    summary.getCell("B6").value = toDate;

    summary.getCell("A7").value = "Employee";
    summary.getCell("B7").value = employeeLabel;

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
    summary.mergeCells("A10:G10");
    summary.getCell("A10").value = "Report Summary";
    summary.getCell("A10").font = sectionFont;
    summary.getCell("A10").fill = sectionFill;
    summary.getCell("A10").alignment = {
      vertical: "middle",
    };

    summary.getRow(10).height = 24;

    const cards = [
      {
        label: "Total Services",
        value: report.summary.totalServices,
        format: "0",
      },
      {
        label: "Total Revenue",
        value: Number(report.summary.totalRevenue),
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

    summary.columns = [
      { width: 22 },
      { width: 22 },
      { width: 22 },
      { width: 22 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
    ];

    // ============================================================
    // 2. SERVICE DETAILS SHEET
    //
    // Native Excel Table via addTable() — same reasoning as the
    // customer report's Customers sheet: addTable() writes its own
    // header + data rows from columns/rows, so it can't be mixed with
    // manual addRow() calls on the same range without corrupting the
    // workbook. `ref` is a single anchor cell, not a full range.
    // ============================================================

    const detailsSheet = workbook.addWorksheet("Service Details");

    initSheetView(detailsSheet, 4);

    addReportHeader(detailsSheet, "Service Details");

    detailsSheet.addRow([]); // spacer → table starts at row 4

    const detailRows = report.log.map((row) => [
      toDateInputInSalonTz(new Date(row.date)),
      row.invoiceNumber,
      row.employeeName,
      row.serviceName,
      row.customerName,
      row.quantity,
      Number(row.amount),
    ]);

    detailsSheet.addTable({
      name: "ServiceDetailsTable",
      ref: "A4",
      headerRow: true,
      totalsRow: false,
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
      },
      columns: [
        { name: "Date", filterButton: true },
        { name: "Invoice #", filterButton: true },
        { name: "Employee", filterButton: true },
        { name: "Service", filterButton: true },
        { name: "Customer", filterButton: true },
        { name: "Quantity", filterButton: true },
        { name: "Revenue", filterButton: true },
      ],
      rows: detailRows,
    });

    // numFmt has to be applied post-write — addTable()'s column config
    // has no numFmt option.
    detailRows.forEach((_, index) => {
      const excelRow = 5 + index; // row 4 = header, data starts row 5
      detailsSheet.getCell(`G${excelRow}`).numFmt = AED_FORMAT;
    });

    detailsSheet.getColumn("A").width = 14;
    detailsSheet.getColumn("B").width = 20;
    detailsSheet.getColumn("C").width = 22;
    detailsSheet.getColumn("D").width = 26;
    detailsSheet.getColumn("E").width = 24;
    detailsSheet.getColumn("F").width = 12;
    detailsSheet.getColumn("G").width = 16;

    // ============================================================
    // Workbook properties
    // ============================================================

    workbook.title = "Employee Report";
    workbook.subject = "Employee service and revenue report";
    workbook.company = "Salon Management System";
    workbook.category = "Reports";
    workbook.keywords = "employee, services, revenue, salon";

    // ============================================================
    // Generate XLSX
    // ============================================================

    const buffer = await workbook.xlsx.writeBuffer();

    const filename = employee?.name
      ? `employee-report-${employee.name.replace(
          /[^a-zA-Z0-9-_]/g,
          "_",
        )}-${fromDate}-to-${toDate}.xlsx`
      : `employee-report-all-${fromDate}-to-${toDate}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Employee XLSX report error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate employee report.",
      },
      { status: 500 },
    );
  }
}
