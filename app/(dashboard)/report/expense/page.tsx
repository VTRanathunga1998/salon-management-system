import { ExpenseCategory } from "@prisma/client";

import { getExpenseReportData } from "@/lib/reports/expense";
import ExpenseReportDashboard from "@/components/reports/ExpenseReportDashboard";
import {
  endOfDayInSalonTz,
  startOfDayInSalonTz,
  todayInSalonTz,
} from "@/lib/utils/timezone";

function firstDayOfCurrentMonthInSalonTz(): string {
  const today = todayInSalonTz();

  const [year, month] = today.split("-").map(Number);

  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function isValidDateString(value: string | undefined): value is string {
  if (!value) return false;

  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

const ExpenseReportPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    category?: string;
  }>;
}) => {
  const params = await searchParams;

  // Default range = current month in salon timezone
  const defaultFrom = firstDayOfCurrentMonthInSalonTz();
  const defaultTo = todayInSalonTz();

  // Get requested dates

  const fromDate = isValidDateString(params.from) ? params.from : defaultFrom;

  const toDate = isValidDateString(params.to) ? params.to : defaultTo;

  // Convert salon dates → absolute UTC instants

  const from = startOfDayInSalonTz(fromDate);
  const to = endOfDayInSalonTz(toDate);

  // Category

  const category =
    params.category && params.category !== "ALL"
      ? Object.values(ExpenseCategory).includes(
          params.category as ExpenseCategory,
        )
        ? (params.category as ExpenseCategory)
        : undefined
      : undefined;

  // Get report

  const report = await getExpenseReportData({
    from,
    to,
    category,
  });

  // console.log(report);

  return (
    <div className="flex-1 bg-white rounded-md md:p-4 mt-0">
      <ExpenseReportDashboard
        report={report}
        from={from}
        to={to}
        selectedCategory={category ?? "ALL"}
      />
    </div>
  );
};

export default ExpenseReportPage;
