"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, CalendarDays, RotateCcw } from "lucide-react";

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

    router.push(`${pathname}?${params.toString()}`);
  };

  const setPreset = (type: "day" | "week" | "month") => {
    const today = new Date();

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    const end = new Date(today);
    let start = new Date(today);

    if (type === "week") {
      const day = today.getDay();

      const mondayOffset = day === 0 ? 6 : day - 1;

      start.setDate(today.getDate() - mondayOffset);
    }

    if (type === "month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    const nextFrom = formatDate(start);
    const nextTo = formatDate(end);

    setFrom(nextFrom);
    setTo(nextTo);

    applyFilter(nextFrom, nextTo);
  };

  const clearFilters = () => {
    setSearch("");
    setFrom("");
    setTo("");

    router.push(pathname);
  };

  return (
    <div className="rounded-2xl bg-white p-4 md:p-5 ring-1 ring-gray-100 shadow-sm">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="flex flex-col md:flex-row gap-3">
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
              className="w-full rounded-xl border-0 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-700 ring-1 ring-gray-200 outline-none transition focus:ring-2 focus:ring-[#C3EBFA]"
            />
          </div>

          <button
            type="button"
            onClick={() => applyFilter()}
            className="rounded-xl bg-[#C3EBFA] px-6 py-2.5 text-sm font-semibold text-gray-800 transition hover:brightness-95 cursor-pointer"
          >
            Search
          </button>
        </div>

        {/* Date controls */}
        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="flex-1">
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
                className="w-full rounded-xl bg-gray-50 py-2.5 pl-9 pr-3 text-sm ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-[#C3EBFA]"
              />
            </div>
          </div>

          <div className="flex-1">
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
                className="w-full rounded-xl bg-gray-50 py-2.5 pl-9 pr-3 text-sm ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-[#C3EBFA]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => applyFilter()}
            className="rounded-xl bg-gray-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition cursor-pointer"
          >
            Apply
          </button>

          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-5 py-2.5 text-sm font-medium text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100 transition cursor-pointer"
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
            className="rounded-lg bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100 cursor-pointer"
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => setPreset("week")}
            className="rounded-lg bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100 cursor-pointer"
          >
            This Week
          </button>

          <button
            type="button"
            onClick={() => setPreset("month")}
            className="rounded-lg bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100 cursor-pointer"
          >
            This Month
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerReportFilters;
