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
import type { ReportData } from "@/lib/reports/actions";

const money = (n: number) =>
  `Rs. ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const toInputDate = (d: Date) => d.toISOString().slice(0, 10);

const ReportDashboard = ({
  report,
  from,
  to,
}: {
  report: ReportData;
  from: Date;
  to: Date;
}) => {
  const {
    summary,
    revenueSeries,
    employeeStats,
    serviceStats,
    topCustomers,
    methodBreakdown,
    range,
  } = report;

  const pdfUrl = `/api/reports/pdf?from=${toInputDate(from)}&to=${toInputDate(to)}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black tracking-tight text-slate-800">
          Reports
        </h1>
        <a
          href={pdfUrl}
          className="text-sm font-medium bg-gray-800 hover:bg-gray-900 text-white rounded-lg px-4 py-2.5 transition cursor-pointer"
        >
          Download PDF Report
        </a>
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
        <KpiCard label="New Customers" value={summary.newCustomers} />
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
        {/* Employee performance */}
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
