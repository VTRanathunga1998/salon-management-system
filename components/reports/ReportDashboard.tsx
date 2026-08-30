"use client";

import { useMemo, useState } from "react";
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
import type { ReportData } from "@/lib/reports/actions";
import {
  formatDateInSalonTz,
  toDateInputInSalonTz,
} from "@/lib/utils/timezone";
import { Download } from "lucide-react";

const money = (n: number) => {
  const sign = n < 0 ? "-" : "";
  return `${sign}AED ${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const ReportDashboard = ({
  report,
  from,
  to,
  fromLabel,
  toLabel,
}: {
  report: ReportData;
  from: Date;
  to: Date;
  fromLabel: string;
  toLabel: string;
}) => {
  const {
    summary,
    revenueSeries,
    employeeStats,
    serviceStats,
    topCustomers,
    methodBreakdown,
    employeeServiceLog,
    range,
  } = report;

  const pdfUrl = `/api/reports/overview/pdf?from=${fromLabel}&to=${toLabel}`;
  const csvUrl = `/api/reports/overview/csv?from=${fromLabel}&to=${toLabel}`;
  const excelUrl = `/api/reports/overview/excel?from=${fromLabel}&to=${toLabel}`;

  const [employeeFilter, setEmployeeFilter] = useState<string>("all");

  const employeeOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of employeeServiceLog)
      map.set(row.employeeId, row.employeeName);
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employeeServiceLog]);

  const filteredLog =
    employeeFilter === "all"
      ? employeeServiceLog
      : employeeServiceLog.filter((row) => row.employeeId === employeeFilter);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black tracking-tight text-slate-800">
          Reports
        </h1>

        <div className="flex gap-1">
          <a
            href={excelUrl}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Download size={14} />
            Download Excel
          </a>
          <a
            href={csvUrl}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Download size={14} />
            Download CSV
          </a>

          <a
            href={pdfUrl}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Download size={14} />
            Download PDF
          </a>
        </div>
      </div>

      <ReportFilterBar from={from} to={to} />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          label="Revenue Collected"
          value={money(summary.totalRevenue)}
        />
        <KpiCard
          label="Invoiced (Billed)"
          value={money(summary.invoicedTotal)}
        />
        <KpiCard label="Outstanding" value={money(summary.outstanding)} />
        <KpiCard label="Invoices" value={summary.invoiceCount} />
        <KpiCard label="Customers Served" value={summary.customersServed} />
        <KpiCard label="Total Profit" value={money(summary.totalProfit)} />
      </div>

      {/* Revenue over time */}
      <div className="rounded-lg ring-[1.5px] ring-gray-100 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Revenue ({range.granularity === "day" ? "Daily" : "Monthly"})
        </h2>
        {revenueSeries.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
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
            No payments recorded in this range.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee performance (summary) */}
        <div className="rounded-lg ring-[1.5px] ring-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Employee Performance
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

        {/* Service breakdown */}
        <div className="rounded-lg ring-[1.5px] ring-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Services Breakdown
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="text-left py-2">Service</th>
                <th className="text-center py-2">Times</th>
                <th className="text-right py-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {serviceStats.map((s) => (
                <tr key={s.serviceId} className="border-b border-gray-50">
                  <td className="py-2">{s.name}</td>
                  <td className="py-2 text-center">{s.timesPerformed}</td>
                  <td className="py-2 text-right font-medium">
                    {money(s.revenue)}
                  </td>
                </tr>
              ))}
              {serviceStats.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-400">
                    No data in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Itemized "who did what, when" log */}
      <div className="rounded-lg ring-[1.5px] ring-gray-100 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Services by Employee ({filteredLog.length})
          </h2>
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="ring-[1.5px] ring-gray-200 rounded-lg p-2 text-sm bg-white focus:outline-none"
          >
            <option value="all">All employees</option>
            {employeeOptions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Employee</th>
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
              {filteredLog.map((row, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 text-gray-500 whitespace-nowrap">
                    {formatDateInSalonTz(row.date)}
                  </td>
                  <td className="py-2">{row.employeeName}</td>
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
              {filteredLog.length === 0 && (
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

      {/* Top customers */}
      <div className="rounded-lg ring-[1.5px] ring-gray-100 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Top Customers
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
              <th className="text-left py-2">Customer</th>
              <th className="text-center py-2">Invoices</th>
              <th className="text-right py-2">Total Spend</th>
            </tr>
          </thead>
          <tbody>
            {topCustomers.map((c) => (
              <tr key={c.customerId} className="border-b border-gray-50">
                <td className="py-2">{c.name}</td>
                <td className="py-2 text-center">{c.invoiceCount}</td>
                <td className="py-2 text-right font-medium">
                  {money(c.spend)}
                </td>
              </tr>
            ))}
            {topCustomers.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-gray-400">
                  No data in this range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment methods */}
      <div className="rounded-lg ring-[1.5px] ring-gray-100 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Payments by Method
        </h2>
        <div className="flex flex-wrap gap-4">
          {methodBreakdown.map((m) => (
            <div
              key={m.method}
              className="flex-1 min-w-[140px] rounded-lg bg-gray-50 p-3"
            >
              <p className="text-xs text-gray-400">{m.method}</p>
              <p className="text-lg font-semibold text-gray-800">
                {money(m.amount)}
              </p>
            </div>
          ))}
          {methodBreakdown.length === 0 && (
            <p className="text-gray-400 text-sm">No payments in this range.</p>
          )}
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

export default ReportDashboard;
