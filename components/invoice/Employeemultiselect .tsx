"use client";

import { useEffect, useRef, useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface EmployeeMultiSelectProps {
  label: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  placeholder?: string;
}

const EmployeeMultiSelect = ({
  label,
  options,
  value,
  onChange,
  error,
  placeholder,
}: EmployeeMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter((o) => value.includes(o.value));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0" ref={ref}>
      <label className="text-xs text-gray-500">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className={`inline-flex w-full items-center justify-between gap-x-1.5 rounded-lg bg-white px-3 py-2.5 text-sm ring-[1.5px] transition
            ${open ? "ring-blue-300" : "ring-gray-200 hover:ring-gray-300"}`}
        >
          <span
            className={`truncate ${selectedOptions.length ? "text-gray-800 font-medium" : "text-gray-400"}`}
          >
            {selectedOptions.length > 0
              ? selectedOptions.map((o) => o.label).join(", ")
              : (placeholder ?? "Select staff…")}
          </span>
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`size-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-1.5 w-full rounded-lg bg-white shadow-lg ring-1 ring-gray-200 overflow-hidden">
            <div className="py-1 max-h-56 overflow-y-auto">
              {options.map((option) => {
                const checked = value.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(option.value)}
                      className="rounded border-gray-300"
                    />
                    {option.label}
                  </label>
                );
              })}
              {options.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-400">
                  No staff available.
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

export default EmployeeMultiSelect;
