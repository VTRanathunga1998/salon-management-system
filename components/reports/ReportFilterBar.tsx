"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import {
  todayInSalonTz,
  toDateInputInSalonTz,
  startOfDayInSalonTz,
} from "@/lib/utils/timezone";

const presets = [
  "Today",
  "Last 7 days",
  "Last 30 days",
  "This month",
  "This year",
];

// Shifts a "yyyy-mm-dd" date by N days (can be negative), staying anchored
// to the salon's timezone throughout — avoids the raw UTC-slice bug where
// `.toISOString().slice(0, 10)` can land on the wrong calendar day
// depending on time-of-day and server region.
function addDaysToSalonDate(dateStr: string, days: number): string {
  const base = startOfDayInSalonTz(dateStr);
  const shifted = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  return toDateInputInSalonTz(shifted);
}

const ReportFilterBar = ({ from, to }: { from: Date; to: Date }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [localFrom, setLocalFrom] = useState(toDateInputInSalonTz(from));
  const [localTo, setLocalTo] = useState(toDateInputInSalonTz(to));

  const applyRange = (fromStr: string, toStr: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", fromStr);
    params.set("to", toStr);
    router.push(`${pathname}?${params.toString()}`);
  };

  const applyPreset = (label: string) => {
    const today = todayInSalonTz();
    let fromStr: string;
    const toStr = today;

    switch (label) {
      case "Today":
        fromStr = today;
        break;
      case "Last 7 days":
        fromStr = addDaysToSalonDate(today, -6);
        break;
      case "Last 30 days":
        fromStr = addDaysToSalonDate(today, -29);
        break;
      case "This month":
        fromStr = `${today.slice(0, 7)}-01`;
        break;
      case "This year":
        fromStr = `${today.slice(0, 4)}-01-01`;
        break;
      default:
        fromStr = today;
    }

    setLocalFrom(fromStr);
    setLocalTo(toStr);
    applyRange(fromStr, toStr);
  };

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-100">
      <div className="flex flex-wrap gap-2">
        {presets.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => applyPreset(label)}
            className="text-xs font-medium px-3 py-1.5 rounded-full ring-[1.5px] ring-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={localFrom}
          onChange={(e) => setLocalFrom(e.target.value)}
          className="ring-[1.5px] ring-gray-200 rounded-lg p-2 text-sm focus:outline-none"
        />
        <span className="text-gray-400 text-sm">to</span>
        <input
          type="date"
          value={localTo}
          onChange={(e) => setLocalTo(e.target.value)}
          className="ring-[1.5px] ring-gray-200 rounded-lg p-2 text-sm focus:outline-none"
        />
        <button
          type="button"
          onClick={() => applyRange(localFrom, localTo)}
          className="text-sm font-medium bg-[#C3EBFA] hover:brightness-95 rounded-lg px-3 py-2 transition cursor-pointer"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default ReportFilterBar;
