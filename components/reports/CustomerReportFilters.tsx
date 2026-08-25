"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, CalendarDays, RotateCcw } from "lucide-react";
import {
  getDashboardDateRange,
  DashboardRangeType,
} from "@/lib/utils/timezone";

type Props = {
  initialSearch?: string;
  initialFrom?: string;
  initialTo?: string;
};

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

  const applyFilter = (nextFrom = from, nextTo = to, nextSearch = search) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextSearch.trim()) {
      params.set("search", nextSearch.trim());
    } else {
      params.delete("search");
    }

    if (nextFrom) {
      params.set("from", nextFrom);
    } else {
      params.delete("from");
    }

    if (nextTo) {
      params.set("to", nextTo);
    } else {
      params.delete("to");
    }

    const queryString = params.toString();

    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const setPreset = (type: "day" | "week" | "month") => {
    const rangeType: DashboardRangeType =
      type === "day" ? "today" : type === "week" ? "week" : "month";

    const { from, to } = getDashboardDateRange(rangeType);

    setFrom(from);
    setTo(to);

    applyFilter(from, to);
  };

  const clearFilters = () => {
    setSearch("");
    setFrom("");
    setTo("");

    router.push(pathname);
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 md:p-5">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  applyFilter();
                }
              }}
              placeholder="Search customer name or phone..."
              className="w-full rounded-xl border-0 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-700 outline-none ring-1 ring-gray-200 transition focus:ring-2 focus:ring-[#C3EBFA]"
            />
          </div>

          <button
            type="button"
            onClick={() => applyFilter()}
            className="w-full cursor-pointer rounded-xl bg-[#C3EBFA] px-6 py-2.5 text-sm font-semibold text-gray-800 transition hover:brightness-95 md:w-auto"
          >
            Search
          </button>
        </div>

        {/* Date controls */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          {/* From */}
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              From
            </label>

            <div className="relative">
              <CalendarDays
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-xl bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-[#C3EBFA]"
              />
            </div>
          </div>

          {/* To */}
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              To
            </label>

            <div className="relative">
              <CalendarDays
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-xl bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-[#C3EBFA]"
              />
            </div>
          </div>

          {/* Apply */}
          <button
            type="button"
            onClick={() => applyFilter()}
            disabled={!from || !to}
            className="w-full cursor-pointer rounded-xl bg-gray-800 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
          >
            Apply
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={clearFilters}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-50 px-5 py-2.5 text-sm font-medium text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-100 lg:w-auto"
          >
            <RotateCcw size={15} />
            Reset
          </button>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setPreset("day")}
            className="cursor-pointer rounded-lg bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100"
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => setPreset("week")}
            className="cursor-pointer rounded-lg bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100"
          >
            This Week
          </button>

          <button
            type="button"
            onClick={() => setPreset("month")}
            className="cursor-pointer rounded-lg bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100"
          >
            This Month
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerReportFilters;
