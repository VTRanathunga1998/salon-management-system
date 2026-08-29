"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import {
  getDashboardDateRange,
  DashboardRangeType,
} from "@/lib/utils/timezone";

type Props = {
  initialSearch?: string;
  initialFrom?: string;
  initialTo?: string;
};

type PresetKey = "today" | "week" | "month" | "year" | "custom";

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
  { key: "custom", label: "Custom" },
];

const CustomerReportFilters = ({
  initialSearch = "",
  initialFrom = "",
  initialTo = "",
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);
  const [showCustom, setShowCustom] = useState(
    Boolean(initialFrom || initialTo),
  );

  const pushParams = (nextFrom: string, nextTo: string, nextSearch: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    else params.delete("search");

    if (nextFrom) params.set("from", nextFrom);
    else params.delete("from");

    if (nextTo) params.set("to", nextTo);
    else params.delete("to");

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const applySearch = () => pushParams(from, to, search);

  const applyPreset = (key: PresetKey) => {
    if (key === "custom") {
      setActivePreset("custom");
      setShowCustom(true);
      return;
    }

    setShowCustom(false);
    setActivePreset(key);

    const rangeType: DashboardRangeType = key;
    const { from: f, to: t } = getDashboardDateRange(rangeType);

    setFrom(f);
    setTo(t);
    pushParams(f, t, search);
  };

  const applyCustomRange = () => {
    if (!from || !to) return;
    pushParams(from, to, search);
  };

  const clearFilters = () => {
    setSearch("");
    setFrom("");
    setTo("");
    setActivePreset(null);
    setShowCustom(false);
    router.push(pathname);
  };

  const hasActiveFilter = Boolean(search || from || to);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex flex-col gap-3">
        {/* Single row: search + presets + reset */}
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1 lg:max-w-xs">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder="Search name or phone..."
              className="w-full rounded-lg border-0 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 outline-none ring-1 ring-gray-200 transition focus:ring-2 focus:ring-[#C3EBFA]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex flex-wrap rounded-xl border border-gray-200 bg-gray-50 p-1">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p.key)}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activePreset === p.key
                      ? "bg-slate-800 text-white"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-600"
                aria-label="Reset filters"
              >
                <RotateCcw size={13} />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Custom date range — only shown when "Custom" is active */}
        {showCustom && (
          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-[#C3EBFA]"
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-[#C3EBFA]"
            />
            <button
              type="button"
              onClick={applyCustomRange}
              disabled={!from || !to}
              className="rounded-lg bg-gray-800 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerReportFilters;
