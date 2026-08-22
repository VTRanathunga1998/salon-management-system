"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

const RANGE_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "Custom", value: "custom" },
] as const;

const DashboardFilter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentRange = searchParams.get("range") ?? "month";
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");

  const applyRange = (range: string, fromDate?: string, toDate?: string) => {
    const params = new URLSearchParams();
    params.set("range", range);
    if (range === "custom" && fromDate && toDate) {
      params.set("from", fromDate);
      params.set("to", toDate);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Range options */}
        <div className="flex w-full flex-wrap rounded-xl border border-slate-200 bg-white p-1 sm:w-auto">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => applyRange(opt.value, from, to)}
              className={`flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:flex-none ${
                currentRange === opt.value
                  ? "bg-slate-800 text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {currentRange === "custom" && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600 sm:w-auto"
            />

            <span className="hidden text-xs text-slate-400 sm:inline">to</span>

            <span className="text-center text-xs text-slate-400 sm:hidden">
              to
            </span>

            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600 sm:w-auto"
            />

            <button
              type="button"
              onClick={() => applyRange("custom", from, to)}
              disabled={!from || !to}
              className="w-full rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardFilter;
