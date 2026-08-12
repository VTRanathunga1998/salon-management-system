import { ExpenseCategory } from "@prisma/client";
import { getExpenseReportData } from "@/lib/reports/expense";
import ExpenseReportDashboard from "@/components/reports/ExpenseReportDashboard";

function parseDate(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return isNaN(d.getTime()) ? fallback : d;
}

const ExpenseReportPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; category?: string }>;
}) => {
  const params = await searchParams;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = now;

  const from = parseDate(params.from, defaultFrom);
  const to = parseDate(params.to, defaultTo);
  to.setHours(23, 59, 59, 999);

  const category =
    params.category && params.category !== "ALL"
      ? (params.category as ExpenseCategory)
      : undefined;

  const report = await getExpenseReportData({ from, to, category });

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