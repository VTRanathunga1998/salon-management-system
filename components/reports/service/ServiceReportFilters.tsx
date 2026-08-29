"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, RotateCcw } from "lucide-react";
import { getDashboardDateRange } from "@/lib/utils/timezone";

type ServiceOption = { id: string; name: string; isActive: boolean };

type Props = {
  allServices: ServiceOption[];
  initialSearch?: string;
  initialServiceId?: string;
  initialFrom?: string;
  initialTo?: string;
};

type PresetKey = "today" | "week" | "month" | "year" | "custom";

function periodRange(period: Exclude<PresetKey, "custom">): {
  from: string;
  to: string;
} {
  const { from, to } = getDashboardDateRange(period);
  return { from, to };
}

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
  { key: "custom", label: "Custom" },
];

const ServiceReportFilters = ({
  allServices,
  initialSearch,
  initialServiceId,
  initialFrom,
  initialTo,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialSearch ?? "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [from, setFrom] = useState(initialFrom ?? "");
  const [to, setTo] = useState(initialTo ?? "");
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);
  const [showCustom, setShowCustom] = useState(
    Boolean(initialFrom || initialTo),
  );

  const boxRef = useRef<HTMLDivElement>(null);

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allServices.slice(0, 8);
    return allServices
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, allServices]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const pushParams = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  const applyPreset = (key: PresetKey) => {
    if (key === "custom") {
      setActivePreset("custom");
      setShowCustom(true);
      return;
    }

    setShowCustom(false);
    setActivePreset(key);

    const { from: f, to: t } = periodRange(key);
    setFrom(f);
    setTo(t);
    pushParams({ from: f, to: t });
  };

  const applyCustomRange = () => {
    if (!from || !to) return;
    pushParams({ from, to });
  };

  const selectService = (service: ServiceOption) => {
    setQuery(service.name);
    setShowDropdown(false);
    pushParams({ search: service.name, serviceId: service.id });
  };

  const clearService = () => {
    setQuery("");
    pushParams({ search: undefined, serviceId: undefined });
  };

  const clearAll = () => {
    setQuery("");
    setFrom("");
    setTo("");
    setActivePreset(null);
    setShowCustom(false);
    router.push(pathname);
  };

  const hasActiveFilter = Boolean(query || from || to);

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-gray-100 shadow-sm">
      {/* Presets + reset */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Service search */}
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100">
          <div ref={boxRef} className="relative w-full max-w-xs">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
              <Search size={15} className="text-gray-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value) clearService();
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search a service..."
                className="w-full text-sm outline-none placeholder:text-gray-400"
              />
              {initialServiceId && (
                <button
                  onClick={clearService}
                  aria-label="Clear selected service"
                >
                  <X size={14} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {showDropdown && filteredServices.length > 0 && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-gray-100">
                {filteredServices.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectService(s)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span>{s.name}</span>
                    {!s.isActive && (
                      <span className="text-[10px] font-medium text-gray-400">
                        inactive
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

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
            onClick={clearAll}
            className="ml-auto flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600"
          >
            <RotateCcw size={13} />
            Clear all
          </button>
        )}
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
  );
};

export default ServiceReportFilters;
