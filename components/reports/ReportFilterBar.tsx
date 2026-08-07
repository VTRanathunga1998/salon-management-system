"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

const toInputDate = (d: Date) => d.toISOString().slice(0, 10);

const presets = [
  "Today",
  "Last 7 days",
  "Last 30 days",
  "This month",
  "This year",
];

const ReportFilterBar = ({ from, to }: { from: Date; to: Date }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [localFrom, setLocalFrom] = useState(toInputDate(from));
  const [localTo, setLocalTo] = useState(toInputDate(to));

  const applyRange = (fromStr: string, toStr: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", fromStr);
    params.set("to", toStr);
    router.push(`${pathname}?${params.toString()}`);
  };

  const applyPreset = (label: string) => {
    const now = new Date();
    let f: Date;
    const t = now;

    switch (label) {
      case "Today":
        f = now;
        break;
      case "Last 7 days":
        f = new Date(now.getTime() - 6 * 86_400_000);
        break;
      case "Last 30 days":
        f = new Date(now.getTime() - 29 * 86_400_000);
        break;
      case "This month":
        f = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "This year":
        f = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        f = now;
    }

    const fromStr = toInputDate(f);
    const toStr = toInputDate(t);
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
