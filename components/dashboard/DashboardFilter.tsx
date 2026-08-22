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
      <div className="flex rounded-xl border border-slate-200 bg-white p-1">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => applyRange(opt.value, from, to)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              currentRange === opt.value
                ? "bg-slate-800 text-white"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {currentRange === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600"
          />
          <button
            onClick={() => applyRange("custom", from, to)}
            disabled={!from || !to}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardFilter;
