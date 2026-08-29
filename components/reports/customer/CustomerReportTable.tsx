"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Users,
  Receipt,
} from "lucide-react";

import type { CustomerReportData } from "@/lib/reports/customer/customerReport";
import { formatDateInSalonTz } from "@/lib/utils/timezone";

type Props = {
  customers: CustomerReportData["customers"];
};

const money = (value: number) =>
  `AED ${value.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const statusStyle: Record<string, string> = {
  ISSUED: "bg-yellow-50 text-yellow-700",
  PARTIALLY_PAID: "bg-blue-50 text-blue-700",
  PAID: "bg-green-50 text-green-700",
};

const CustomerReportTable = ({ customers }: Props) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (customers.length === 0) {
    return (
      <div className="rounded-2xl bg-white py-16 text-center ring-1 ring-gray-100">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
          <Users className="text-gray-400" size={22} />
        </div>

        <h3 className="text-sm font-semibold text-gray-700">
          No customers found
        </h3>

        <p className="mt-1 text-xs text-gray-400">
          Try changing your search or date range.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm">
      {/* Desktop header */}
      <div className="hidden md:grid grid-cols-[2fr_1.2fr_1fr_1fr_40px] gap-4 border-b border-gray-100 bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        <span>Customer</span>
        <span>Visits</span>
        <span>Total Billed</span>
        <span>Outstanding</span>
        <span />
      </div>

      {customers.map((customer) => {
        const isOpen = expanded === customer.id;

        return (
          <div
            key={customer.id}
            className="border-b border-gray-100 last:border-0"
          >
            {/* Customer row */}
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : customer.id)}
              className="w-full text-left px-5 py-4 hover:bg-gray-50 transition cursor-pointer"
            >
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1.2fr_1fr_1fr_40px] gap-3 md:gap-4 items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C3EBFA] text-sm font-bold text-gray-700">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {customer.name}
                      </p>

                      <p className="flex items-center gap-1 text-xs text-gray-400">
                        <Phone size={11} />
                        {customer.phone}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {customer.invoiceCount}
                  </p>
                  <p className="text-[11px] text-gray-400">invoices</p>
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {money(customer.totalBilled)}
                  </p>
                  <p className="text-[11px] text-green-600">
                    Paid {money(customer.totalPaid)}
                  </p>
                </div>

                <div>
                  <p
                    className={`text-sm font-bold ${
                      customer.outstanding > 0
                        ? "text-amber-600"
                        : "text-green-600"
                    }`}
                  >
                    {money(customer.outstanding)}
                  </p>
                </div>

                <div className="hidden md:flex justify-end">
                  {isOpen ? (
                    <ChevronDown size={18} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={18} className="text-gray-400" />
                  )}
                </div>
              </div>
            </button>

            {/* Expanded history */}
            {isOpen && (
              <div className="bg-gray-50/70 px-5 pb-5">
                <div className="rounded-xl bg-white p-4 ring-1 ring-gray-100">
                  {/* Customer info */}
                  <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-gray-100 pb-4">
                    {customer.email && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Mail size={13} />
                        {customer.email}
                      </div>
                    )}

                    {customer.address && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin size={13} />
                        {customer.address}
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Receipt size={16} className="text-gray-500" />
                      <h4 className="text-sm font-semibold text-gray-700">
                        Service History
                      </h4>
                    </div>

                    <div className="flex flex-col gap-3">
                      {customer.invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="rounded-xl border border-gray-100 bg-white p-4"
                        >
                          {/* Invoice header */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-gray-100">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {invoice.invoiceNumber}
                              </p>

                              <p className="text-xs text-gray-400">
                                {formatDateInSalonTz(invoice.date)}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                  statusStyle[invoice.status] ??
                                  "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {invoice.status.replace("_", " ")}
                              </span>

                              <span className="text-sm font-bold text-gray-800">
                                {money(invoice.total)}
                              </span>
                            </div>
                          </div>

                          {/* Services */}
                          <div className="pt-3">
                            <div className="hidden sm:grid grid-cols-[2fr_70px_110px_1.5fr] gap-3 mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                              <span>Service</span>
                              <span>Qty</span>
                              <span>Amount</span>
                              <span>Employees</span>
                            </div>

                            {invoice.items.map((item, index) => (
                              <div
                                key={index}
                                className="grid grid-cols-1 sm:grid-cols-[2fr_70px_110px_1.5fr] gap-1 sm:gap-3 py-2 border-t border-gray-50"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-700">
                                    {item.serviceName}
                                  </p>

                                  <p className="text-xs text-gray-400">
                                    {money(item.unitPrice)} each
                                  </p>
                                </div>

                                <div className="text-xs text-gray-500">
                                  Qty: {item.quantity}
                                </div>

                                <div className="text-sm font-semibold text-gray-700">
                                  {money(item.subtotal)}
                                </div>

                                <div className="flex flex-wrap gap-1">
                                  {item.employees.length > 0 ? (
                                    item.employees.map((employee) => (
                                      <span
                                        key={employee}
                                        className="rounded-md bg-gray-50 px-2 py-1 text-[10px] text-gray-600 ring-1 ring-gray-100"
                                      >
                                        {employee}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-gray-400">
                                      No employee assigned
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Invoice totals */}
                          <div className="mt-3 flex justify-end border-t border-gray-100 pt-3">
                            <div className="w-full max-w-xs space-y-1 text-xs">
                              <div className="flex justify-between text-gray-500">
                                <span>Subtotal</span>
                                <span>{money(invoice.subtotal)}</span>
                              </div>

                              <div className="flex justify-between text-gray-500">
                                <span>Discount</span>
                                <span>- {money(invoice.discount)}</span>
                              </div>

                              <div className="flex justify-between text-gray-500">
                                <span>Tax</span>
                                <span>{money(invoice.tax)}</span>
                              </div>

                              <div className="flex justify-between border-t border-gray-100 pt-2 font-semibold text-gray-800">
                                <span>Total</span>
                                <span>{money(invoice.total)}</span>
                              </div>

                              <div className="flex justify-between text-green-600">
                                <span>Paid</span>
                                <span>{money(invoice.paid)}</span>
                              </div>

                              {invoice.balance > 0 && (
                                <div className="flex justify-between font-semibold text-amber-600">
                                  <span>Balance</span>
                                  <span>{money(invoice.balance)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CustomerReportTable;
