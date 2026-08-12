"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import ReportFilterBar from "./ReportFilterBar";
import EmployeeReportFilter from "./EmployeeReportFilter";
import type { EmployeeReportData } from "@/lib/reports/employee";
import {
  formatDateInSalonTz,
  toDateInputInSalonTz,
} from "@/lib/utils/timezone";

const money = (n: number) =>
  `Rs. ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const EmployeeReportDashboard = ({
  report,
  from,
  to,
  employees,
  selectedEmployeeId,
}: {
  report: EmployeeReportData;
  from: Date;
  to: Date;
  employees: { id: string; name: string }[];
  selectedEmployeeId: string;
}) => {
  const { summary, employeeStats, revenueSeries, log, range } = report;

  const pdfUrl = `/api/reports/employee/pdf?from=${toDateInputInSalonTz(from)}&to=${toDateInputInSalonTz(to)}${
    selectedEmployeeId !== "all" ? `&employeeId=${selectedEmployeeId}` : ""
  }`;

  const selectedName =
    selectedEmployeeId !== "all"
      ? employees.find((e) => e.id === selectedEmployeeId)?.name
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black tracking-tight text-slate-800">
          Employee Report{selectedName ? ` — ${selectedName}` : ""}
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
        <span className="text-xs text-gray-500">Employee</span>
        <EmployeeReportFilter employees={employees} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard label="Revenue" value={money(summary.totalRevenue)} />
        <KpiCard label="Services Performed" value={summary.totalServices} />
        <KpiCard
          label={selectedEmployeeId === "all" ? "Employees" : "Selected"}
          value={
            selectedEmployeeId === "all"
              ? summary.employeeCount
              : (selectedName ?? "—")
          }
        />
      </div>

      {/* Revenue over time */}
      <div className="rounded-lg ring-[1.5px] ring-gray-100 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Revenue ({range.granularity === "day" ? "Daily" : "Monthly"})
        </h2>
        {revenueSeries.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => money(Number(value))} />
              <Bar dataKey="amount" fill="#93c5fd" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 py-10 text-center">
            No data in this range.
          </p>
        )}
      </div>

      {/* Per-employee summary (only meaningful when viewing all) */}
      {selectedEmployeeId === "all" && (
        <div className="rounded-lg ring-[1.5px] ring-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            By Employee
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="text-left py-2">Employee</th>
                <th className="text-center py-2">Services</th>
                <th className="text-right py-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {employeeStats.map((e) => (
                <tr key={e.employeeId} className="border-b border-gray-50">
                  <td className="py-2">{e.name}</td>
                  <td className="py-2 text-center">{e.servicesCount}</td>
                  <td className="py-2 text-right font-medium">
                    {money(e.revenue)}
                  </td>
                </tr>
              ))}
              {employeeStats.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-400">
                    No data in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Itemized log */}
      <div className="rounded-lg ring-[1.5px] ring-gray-100 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Services ({log.length})
        </h2>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="text-left py-2">Date</th>
                {selectedEmployeeId === "all" && (
                  <th className="text-left py-2">Employee</th>
                )}
                <th className="text-left py-2">Service</th>
                <th className="text-left py-2 hidden md:table-cell">
                  Customer
                </th>
                <th className="text-left py-2 hidden md:table-cell">Invoice</th>
                <th className="text-center py-2">Qty</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {log.map((row, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 text-gray-500 whitespace-nowrap">
                    {formatDateInSalonTz(row.date)}
                  </td>
                  {selectedEmployeeId === "all" && (
                    <td className="py-2">{row.employeeName}</td>
                  )}
                  <td className="py-2">{row.serviceName}</td>
                  <td className="py-2 hidden md:table-cell text-gray-500">
                    {row.customerName}
                  </td>
                  <td className="py-2 hidden md:table-cell text-gray-400">
                    {row.invoiceNumber}
                  </td>
                  <td className="py-2 text-center">{row.quantity}</td>
                  <td className="py-2 text-right font-medium">
                    {money(row.amount)}
                  </td>
                </tr>
              ))}
              {log.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-400">
                    No services in this range.
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

export default EmployeeReportDashboard;
