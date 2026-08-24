import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { getReportData } from "@/lib/reports/actions";
import ReportPdfDocument from "@/lib/reports/ReportPdfDocument";
import {
  endOfDayInSalonTz,
  startOfDayInSalonTz,
  todayInSalonTz,
} from "@/lib/utils/timezone";

function isValidDateString(value: string | null): boolean {
  if (!value) return false;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !isNaN(date.getTime());
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  /*
   * Get today's date in the salon timezone.
   *
   * Example:
   * 2026-08-13
   */
  const today = todayInSalonTz();

  /*
   * Default from = first day of current month.
   */
  const [year, month] = today.split("-");

  const defaultFromString = `${year}-${month}-01`;
  const defaultToString = today;

  /*
   * Validate query parameters.
   */
  const fromString = isValidDateString(fromParam)
    ? fromParam!
    : defaultFromString;

  const toString = isValidDateString(toParam) ? toParam! : defaultToString;

  /*
   * Convert salon calendar dates into absolute Date values.
   *
   * from:
   *   00:00:00.000 Asia/Colombo
   *
   * to:
   *   23:59:59.999 Asia/Colombo
   */
  const from = startOfDayInSalonTz(fromString);
  const to = endOfDayInSalonTz(toString);

  const report = await getReportData({
    from,
    to,
  });

  /*
   * Use the original yyyy-mm-dd values for the PDF label
   * and filename.
   *
   * Do NOT use toISOString() here because that converts
   * the Date to UTC and can shift the calendar date.
   */
  const fromLabel = fromString;
  const toLabel = toString;

  const buffer = await renderToBuffer(
    React.createElement(ReportPdfDocument, {
      report,
      from: fromLabel,
      to: toLabel,
    }) as React.ReactElement<DocumentProps>,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="report-${fromLabel}-to-${toLabel}.pdf"`,
    },
  });
}
