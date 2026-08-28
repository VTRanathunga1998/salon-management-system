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

  const defaultFrom = firstDayOfCurrentMonthInSalonTz();
  const defaultTo = todayInSalonTz();

  const fromDate = isValidDateString(params.from) ? params.from : defaultFrom;

  const toDate = isValidDateString(params.to) ? params.to : defaultTo;

  const from = startOfDayInSalonTz(fromDate);
  const to = endOfDayInSalonTz(toDate);

  const categoryId =
    params.category && params.category !== "ALL" ? params.category : undefined;

  const report = await getExpenseReportData({
    from,
    to,
    categoryId,
  });

  return (
    <div className="flex-1 bg-white rounded-md md:p-4 mt-0">
      <ExpenseReportDashboard
        report={report}
        from={from}
        to={to}
        selectedCategory={categoryId ?? "ALL"}
      />
    </div>
  );
};

export default ExpenseReportPage;
