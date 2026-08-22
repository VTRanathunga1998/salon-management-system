"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Calendar } from "lucide-react";

type Service = { id: string; name: string };

const AppointmentFilters = ({ services }: { services: Service[] }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const serviceId = searchParams.get("serviceId") ?? "";

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page"); // reset pagination whenever filters change
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleToday() {
    const today = new Date().toISOString().slice(0, 10);
    updateParams({ from: today, to: today });
  }

  function handleClear() {
    updateParams({ from: null, to: null, serviceId: null });
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 w-full">
      <button
        type="button"
        onClick={handleToday}
        className="text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md px-3 py-2 transition cursor-pointer whitespace-nowrap"
      >
        Today
      </button>
      <div className="hidden md:flex items-center gap-2">
        <input
          type="date"
          value={from}
          onChange={(e) => updateParams({ from: e.target.value || null })}
          className="text-xs ring-[1.5px] ring-gray-200 rounded-md px-2 py-2 outline-none focus:ring-[#C3EBFA]"
        />
        <span className="text-xs text-slate-400">to</span>
        <input
          type="date"
          value={to}
          onChange={(e) => updateParams({ to: e.target.value || null })}
          className="text-xs ring-[1.5px] ring-gray-200 rounded-md px-2 py-2 outline-none focus:ring-[#C3EBFA]"
        />
      </div>
      <select
        value={serviceId}
        onChange={(e) => updateParams({ serviceId: e.target.value || null })}
        className="hidden lg:block text-xs ring-[1.5px] ring-gray-200 rounded-md px-2 py-2 outline-none focus:ring-[#C3EBFA]"
      >
        <option value="">All services</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      {(from || to || serviceId) && (
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-slate-400 hover:text-red-500 underline whitespace-nowrap"
        >
          Clear filters
        </button>
      )}
      
      {/* <button
        type="button"
        disabled
        title="Calendar view — coming soon"
        className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-md px-3 py-2 cursor-not-allowed whitespace-nowrap md:ml-auto"
      >
        <Calendar className="h-3.5 w-3.5" />
        Calendar view
      </button> */}
    </div>
  );
};

export default AppointmentFilters;
