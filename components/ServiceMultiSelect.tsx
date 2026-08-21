"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Service = { id: string; name: string; isActive: boolean };

interface ServiceMultiSelectProps {
  label?: string;
  services: Service[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  placeholder?: string;
}

const ServiceMultiSelect = ({
  label = "Services",
  services,
  value,
  onChange,
  error,
  placeholder = "Select services…",
}: ServiceMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Opening with an empty query shows everything — the "must show all
  // services first, scrollable" requirement — filtering only narrows
  // from there as the person types.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, query]);

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((s) => value.includes(s.id));

  // "Select all" respects the current search filter rather than always
  // selecting literally every service — e.g. searching "hair" then
  // clicking select-all only selects the hair-related results shown.
  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredIds = new Set(filtered.map((s) => s.id));
      onChange(value.filter((id) => !filteredIds.has(id)));
    } else {
      const merged = new Set([...value, ...filtered.map((s) => s.id)]);
      onChange(Array.from(merged));
    }
  };

  const selectedNames = services
    .filter((s) => value.includes(s.id))
    .map((s) => s.name);

  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0" ref={ref}>
      <label className="text-xs text-gray-500">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`inline-flex w-full items-center justify-between gap-x-1.5 rounded-lg bg-white px-3 py-2.5 text-sm ring-[1.5px] transition text-left
            ${open ? "ring-blue-300" : "ring-gray-200 hover:ring-gray-300"}
          `}
        >
          <span
            className={`truncate ${value.length === 0 ? "text-gray-400" : "text-gray-800 font-medium"}`}
          >
            {value.length === 0
              ? placeholder
              : value.length <= 2
                ? selectedNames.join(", ")
                : `${value.length} services selected`}
          </span>
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className={`size-4 shrink-0 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-1.5 w-full rounded-lg bg-white shadow-lg ring-1 ring-gray-200 overflow-hidden ">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search services…"
                className="w-full rounded-md bg-gray-50 px-2.5 py-2 text-sm outline-none ring-1 ring-transparent focus:ring-blue-200"
              />
            </div>

            <button
              type="button"
              onClick={toggleSelectAll}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 border-b border-gray-100"
            >
              <span>{allFilteredSelected ? "Clear all" : "Select all"}</span>
              <span className="text-gray-400 font-normal">
                {filtered.length}{" "}
                {filtered.length === 1 ? "service" : "services"}
              </span>
            </button>

            <div className="max-h-[260px] overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">
                  No services found.
                </p>
              ) : (
                filtered.map((service) => {
                  const checked = value.includes(service.id);
                  return (
                    <label
                      key={service.id}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(service.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="truncate">
                        {service.name}
                        {!service.isActive && (
                          <span className="text-gray-400"> (inactive)</span>
                        )}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default ServiceMultiSelect;
