"use client";

import { useEffect, useRef, useState } from "react";

interface ServiceOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface AppointmentServiceComboboxProps {
  services: ServiceOption[];
  value: string;
  onChange: (serviceId: string) => void;
  error?: string;
  // Services already picked on OTHER rows of this appointment — hidden
  // from results so the same service can't be selected twice.
  excludeIds?: string[];
}

const formatLabel = (s: ServiceOption) =>
  `${s.name}${!s.isActive ? " (inactive)" : ""}`;

const AppointmentServiceCombobox = ({
  services,
  value,
  onChange,
  error,
  excludeIds = [],
}: AppointmentServiceComboboxProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = services.find((s) => s.id === value);
  const [query, setQuery] = useState(selected ? formatLabel(selected) : "");

  // Keep the input text in sync if `value` changes externally (e.g. when
  // editing an existing appointment and defaultValues populate the form).
  useEffect(() => {
    if (selected) {
      setQuery(formatLabel(selected));
    } else if (!value) {
      setQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const excludeSet = new Set(excludeIds.filter((id) => id !== value));

  const results = services
    .filter((s) => !excludeSet.has(s.id))
    .filter((s) => {
      const q = query.trim().toLowerCase();
      return !q || s.name.toLowerCase().includes(q);
    })
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0" ref={ref}>
      <label className="text-xs text-gray-500">Service</label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange(""); // typing invalidates the previous selection
          }}
          placeholder="Search services…"
          className={`w-full rounded-lg bg-white px-3 py-2.5 text-sm ring-[1.5px] transition
            ${open ? "ring-blue-300" : "ring-gray-200 hover:ring-gray-300"}
            ${selected ? "text-gray-800 font-medium" : "text-gray-800"}`}
        />

        {open && (
          <div className="absolute z-50 mt-1.5 w-full rounded-lg bg-white shadow-lg ring-1 ring-gray-200 overflow-hidden">
            <div className="py-1 max-h-56 overflow-y-auto">
              {results.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={!s.isActive}
                  onClick={() => {
                    if (!s.isActive) return;
                    onChange(s.id);
                    setQuery(formatLabel(s));
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2 text-sm text-left transition-colors
                    ${s.id === value ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"}
                    ${!s.isActive ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span>{s.name}</span>
                  {!s.isActive && (
                    <span className="text-xs text-gray-400">Inactive</span>
                  )}
                </button>
              ))}
              {results.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-400">
                  No matching services.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default AppointmentServiceCombobox;
