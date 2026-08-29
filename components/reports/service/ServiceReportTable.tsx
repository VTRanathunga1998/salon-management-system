"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Users } from "lucide-react";

type Entry = {
  invoiceId: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;

  quantity: number;
  unitPrice: number;
  subtotal: number;

  employees: string[];
};

type ServiceRow = {
  id: string;
  name: string;
  isActive: boolean;

  timesPerformed: number;
  totalQuantity: number;
  totalRevenue: number;

  entries: Entry[];
};

type Props = {
  services: ServiceRow[];
  selectedServiceId?: string;
};

const money = (v: number) =>
  `AED ${v.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-AE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const ServiceReportTable = ({ services, selectedServiceId }: Props) => {
  // Single-service drill-down.
  if (selectedServiceId) {
    const selected = services.find((s) => s.id === selectedServiceId);

    if (!selected) {
      return (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-400 ring-1 ring-gray-100">
          No revenue recorded for this service in the selected range.
        </div>
      );
    }

    return <SingleServiceView service={selected} />;
  }

  // Aggregate view across all (filtered) services.
  if (services.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-400 ring-1 ring-gray-100">
        No service activity found for the selected filters.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {services.map((service) => (
        <ServiceRowCard key={service.id} service={service} />
      ))}
    </div>
  );
};

const ServiceRowCard = ({ service }: { service: ServiceRow }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-2.5">
          {open ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronRight size={16} className="text-gray-400" />
          )}
          <div>
            <p className="text-sm font-bold text-gray-800">
              {service.name}
              {!service.isActive && (
                <span className="ml-2 text-[10px] font-medium text-gray-400">
                  inactive
                </span>
              )}
            </p>
            <p className="text-xs text-gray-400">
              {service.timesPerformed} bookings · {service.totalQuantity} qty
            </p>
          </div>
        </div>

        <p className="text-sm font-bold text-gray-800">
          {money(service.totalRevenue)}
        </p>
      </button>

      {open && <EntriesTable entries={service.entries} />}
    </div>
  );
};

const SingleServiceView = ({ service }: { service: ServiceRow }) => (
  <div className="flex flex-col gap-3">
    <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100 shadow-sm">
      <p className="text-sm font-bold text-gray-800">
        {service.name}
        {!service.isActive && (
          <span className="ml-2 text-[10px] font-medium text-gray-400">
            inactive
          </span>
        )}
      </p>
      <p className="mt-1 text-xs text-gray-400">
        {service.timesPerformed} bookings · {service.totalQuantity} qty ·{" "}
        {money(service.totalRevenue)} total revenue
      </p>
    </div>

    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm">
      <EntriesTable entries={service.entries} />
    </div>
  </div>
);

const EntriesTable = ({ entries }: { entries: Entry[] }) => (
  <div className="overflow-x-auto border-t border-gray-100">
    <table className="w-full text-left text-xs">
      <thead>
        <tr className="text-gray-400">
          <th className="px-4 py-2.5 font-medium">Date</th>
          <th className="px-4 py-2.5 font-medium">Invoice</th>
          <th className="px-4 py-2.5 font-medium">Customer</th>
          <th className="px-4 py-2.5 font-medium">Staff</th>
          <th className="px-4 py-2.5 text-right font-medium">Qty</th>
          <th className="px-4 py-2.5 text-right font-medium">Unit</th>
          <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, idx) => (
          <tr
            key={`${entry.invoiceId}-${idx}`}
            className="border-t border-gray-50 text-gray-600"
          >
            <td className="px-4 py-2.5">{formatDate(entry.date)}</td>
            <td className="px-4 py-2.5 font-medium text-gray-700">
              {entry.invoiceNumber}
            </td>
            <td className="px-4 py-2.5">{entry.customerName}</td>
            <td className="px-4 py-2.5">
              {entry.employees.length > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Users size={11} className="text-gray-400" />
                  {entry.employees.join(", ")}
                </span>
              ) : (
                <span className="text-gray-300">—</span>
              )}
            </td>
            <td className="px-4 py-2.5 text-right">{entry.quantity}</td>
            <td className="px-4 py-2.5 text-right">{money(entry.unitPrice)}</td>
            <td className="px-4 py-2.5 text-right font-semibold text-gray-800">
              {money(entry.subtotal)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ServiceReportTable;
