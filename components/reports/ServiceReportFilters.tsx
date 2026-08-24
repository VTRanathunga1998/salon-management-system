"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Download } from "lucide-react";

type ServiceOption = { id: string; name: string; isActive: boolean };

type Props = {
  allServices: ServiceOption[];
  initialSearch?: string;
  initialServiceId?: string;
  initialFrom?: string;
  initialTo?: string;
};

type PresetPeriod = "today" | "week" | "month" | "year";

// Salon operates on UTC+4 (Dubai) — matches lib/reports/*.ts boundaries.
function getSalonNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + 4 * 60 * 60 * 1000);
}

function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}

function periodRange(period: PresetPeriod): { from: string; to: string } {
  const now = getSalonNow();
  const to = fmt(now);

  if (period === "today") {
    return { from: to, to };
  }

  if (period === "week") {
    const day = now.getUTCDay(); // 0 = Sun ... 6 = Sat
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - diffToMonday);
    return { from: fmt(monday), to };
  }

  if (period === "month") {
    const first = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    return { from: fmt(first), to };
  }

  // year
  const first = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  return { from: fmt(first), to };
}

const PRESETS: { key: PresetPeriod; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
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
  const [activePreset, setActivePreset] = useState<PresetPeriod | null>(null);

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

  const applyPreset = (period: PresetPeriod) => {
    const { from: f, to: t } = periodRange(period);
    setFrom(f);
    setTo(t);
    setActivePreset(period);
    pushParams({ from: f, to: t });
  };

  const applyCustomRange = () => {
    setActivePreset(null);
    pushParams({ from: from || undefined, to: to || undefined });
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
    router.push(pathname);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-gray-100 shadow-sm">
      {/* Date range */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => applyPreset(p.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              activePreset === p.key
                ? "bg-slate-800 text-white"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            {p.label}
          </button>
        ))}

        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-600"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-600"
          />
          <button
            onClick={applyCustomRange}
            className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-900"
          >
            Apply
          </button>
        </div>

        <button
          onClick={clearAll}
          className="ml-auto text-xs font-medium text-gray-400 hover:text-gray-600"
        >
          Clear all
        </button>
      </div>

      {/* Service search + PDF */}
      <div className="flex flex-wrap items-center gap-2">
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
    </div>
  );
};

export default ServiceReportFilters;
