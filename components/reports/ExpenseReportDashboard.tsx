"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import ReportFilterBar from "./ReportFilterBar";
import ExpenseCategoryFilter from "./ExpenseCategoryFilter";
import type { ExpenseReportData } from "@/lib/reports/expense";
import {
  formatDateInSalonTz,
  toDateInputInSalonTz,
} from "@/lib/utils/timezone";

const money = (n: number) =>
  `AED ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CATEGORY_COLORS: Record<string, string> = {
  RENT: "#93c5fd",
  UTILITIES: "#fca5a5",
  SUPPLIES: "#fcd34d",
  SALARIES: "#86efac",
  MARKETING: "#c4b5fd",
  MAINTENANCE: "#f9a8d4",
  OTHER: "#a5b4fc",
};

const formatLabel = (v: string) =>
  v.charAt(0) + v.slice(1).toLowerCase().replace("_", " ");

const ExpenseReportDashboard = ({
  report,
  from,
  to,
  selectedCategory,
}: {
  report: ExpenseReportData;
  from: Date;
  to: Date;
  selectedCategory: string;
}) => {
  const {
    summary,
    categoryBreakdown,
    methodBreakdown,
    series,
    expenses,
    range,
  } = report;

  const pdfUrl = `/api/reports/expense/pdf?from=${toDateInputInSalonTz(from)}&to=${toDateInputInSalonTz(to)}${
    selectedCategory !== "ALL" ? `&category=${selectedCategory}` : ""
  }`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black tracking-tight text-slate-800">
          Expense Report
        </h1>
        <a
          href={pdfUrl}
          className="text-sm font-medium bg-gray-800 hover:bg-gray-900 text-white rounded-lg px-4 py-2.5 transition cursor-pointer"
        >
          Download PDF Report
        </a>
      </div>

      <ReportFilterBar from={from} to={to} />

      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">Category</span>
        <ExpenseCategoryFilter />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard label="Total Spent" value={money(summary.totalAmount)} />
        <KpiCard label="Expenses Logged" value={summary.count} />
        <KpiCard
          label="Avg per Expense"
          value={money(
            summary.count > 0 ? summary.totalAmount / summary.count : 0,
          )}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart by category */}
        <div className="rounded-lg ring-[1.5px] ring-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            By Category
          </h2>
          {categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label={(entry: any) => formatLabel(entry.category)}
                >
                  {categoryBreakdown.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={CATEGORY_COLORS[entry.category] ?? "#d1d5db"}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => money(Number(v))} />
                <Legend formatter={(value) => formatLabel(value as string)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 py-16 text-center">
              No expenses in this range.
            </p>
          )}
        </div>

        {/* Trend over time */}
        <div className="rounded-lg ring-[1.5px] ring-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Spend Over Time ({range.granularity === "day" ? "Daily" : "Monthly"}
            )
          </h2>
          {series.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => money(Number(v))} />
                <Bar dataKey="amount" fill="#fca5a5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 py-16 text-center">
              No expenses in this range.
            </p>
          )}
        </div>
      </div>

      {/* Payment methods */}
      <div className="rounded-lg ring-[1.5px] ring-gray-100 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Paid Via</h2>
        <div className="flex flex-wrap gap-4">
          {methodBreakdown.map((m) => (
            <div
              key={m.method}
              className="flex-1 min-w-[140px] rounded-lg bg-gray-50 p-3"
            >
              <p className="text-xs text-gray-400">{formatLabel(m.method)}</p>
              <p className="text-lg font-semibold text-gray-800">
                {money(m.amount)}
              </p>
            </div>
          ))}
          {methodBreakdown.length === 0 && (
            <p className="text-gray-400 text-sm">No expenses in this range.</p>
          )}
        </div>
      </div>

      {/* Expense list */}
      <div className="rounded-lg ring-[1.5px] ring-gray-100 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Expenses ({expenses.length})
        </h2>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Title</th>
                <th className="text-left py-2 hidden md:table-cell">
                  Category
                </th>
                <th className="text-left py-2 hidden md:table-cell">
                  Paid Via
                </th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-gray-50">
                  <td className="py-2 text-gray-500 whitespace-nowrap">
                    {formatDateInSalonTz(e.date)}
                  </td>
                  <td className="py-2">{e.title}</td>
                  <td className="py-2 hidden md:table-cell text-gray-500">
                    {formatLabel(e.category)}
                  </td>
                  <td className="py-2 hidden md:table-cell text-gray-500">
                    {formatLabel(e.method)}
                  </td>
                  <td className="py-2 text-right font-medium">
                    {money(e.amount)}
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-400">
                    No expenses in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="rounded-lg ring-[1.5px] ring-gray-100 p-4">
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className="text-xl font-bold text-gray-800">{value}</p>
  </div>
);

export default ExpenseReportDashboard;
