// app/api/reports/service/xlsx/route.ts

import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getServiceReport } from "@/lib/reports/serviceReport";
import { todayInSalonTz, toDateInputInSalonTz } from "@/lib/utils/timezone";

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

      subtitleCell.value = service?.name
        ? `Report period: ${fromDate} to ${toDate} • Service: ${service.name}`
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

    addReportHeader(summary, "Service Report");

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

    summary.getCell("A7").value = "Service";
    summary.getCell("B7").value = service?.name ?? "All Services";

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
        label: "Service Types",
        value: report.summary.totalServiceTypes,
        format: "0",
      },
      {
        label: "Total Bookings",
        value: report.summary.totalBookings,
        format: "0",
      },
      {
        label: "Total Quantity",
        value: report.summary.totalQuantity,
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

    // ── By Service ──
    summary.addRow([]); // spacer

    const serviceSectionRow = summary.addRow(["By Service"]);
    summary.mergeCells(
      `A${serviceSectionRow.number}:F${serviceSectionRow.number}`,
    );
    serviceSectionRow.getCell(1).font = sectionFont;
    serviceSectionRow.getCell(1).fill = sectionFill;
    serviceSectionRow.getCell(1).alignment = { vertical: "middle" };
    serviceSectionRow.height = 22;

    const serviceHeaderRow = summary.addRow([
      "Service",
      "Active",
      "Times Performed",
      "Quantity",
      "Revenue",
    ]);
    styleHeader(serviceHeaderRow);

    report.services.forEach((s, index) => {
      const row = summary.addRow([
        s.name,
        s.isActive ? "Yes" : "No",
        s.timesPerformed,
        s.totalQuantity,
        Number(s.totalRevenue),
      ]);
      styleBody(row, index);
      row.getCell(5).numFmt = AED_FORMAT;
    });

    summary.columns = [
      { width: 24 },
      { width: 16 },
      { width: 18 },
      { width: 14 },
      { width: 18 },
      { width: 18 },
    ];

    // ============================================================
    // 2. BOOKINGS SHEET
    //
    // Native Excel Table via addTable() — same reasoning as the expense
    // report: addTable() writes its own header + data rows, so it can't
    // be mixed with manual addRow() calls on the same range. `ref` is a
    // single anchor cell, not a full range.
    //
    // One row per invoice-item, service name repeated so each row is
    // self-contained for filtering/sorting/pivoting — matches the
    // flattening already done in the CSV export.
    // ============================================================

    const bookingsSheet = workbook.addWorksheet("Bookings");

    initSheetView(bookingsSheet, 4);

    addReportHeader(bookingsSheet, "Bookings");

    bookingsSheet.addRow([]); // spacer → table starts at row 4

    const bookingRows: (string | number)[][] = [];

    for (const s of report.services) {
      for (const e of s.entries) {
        bookingRows.push([
          s.name,
          toDateInputInSalonTz(new Date(e.date)),
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
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
      },
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

    // numFmt applied post-write — addTable()'s column config has no
    // numFmt option.
    bookingRows.forEach((_, index) => {
      const excelRow = 5 + index; // row 4 = header, data starts row 5
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
    // Workbook properties
    // ============================================================

    workbook.title = "Service Report";
    workbook.subject = "Service performance and booking detail report";
    workbook.company = "Salon Management System";
    workbook.category = "Reports";
    workbook.keywords = "services, bookings, revenue, salon";

    // ============================================================
    // Generate XLSX
    // ============================================================

    const buffer = await workbook.xlsx.writeBuffer();

    const filenameSuffix = service?.name
      ? `-${service.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
      : "";
    const filename = `service-report-${fromDate}-to-${toDate}${filenameSuffix}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Service XLSX report error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate service report.",
      },
      { status: 500 },
    );
  }
}