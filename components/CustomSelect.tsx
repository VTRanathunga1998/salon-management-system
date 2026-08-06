// components/CustomSelect.tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  label: string;
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  placeholder?: string;
}

const CustomSelect = ({
  label,
  options,
  value,
  onChange,
  error,
  placeholder,
}: CustomSelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

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

  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0" ref={ref}>
      <label className="text-xs text-gray-500">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`inline-flex w-full items-center justify-between gap-x-1.5 rounded-lg bg-white px-3 py-2.5 text-sm ring-[1.5px] transition
            ${open ? "ring-blue-300" : "ring-gray-200 hover:ring-gray-300"}
            ${!selected ? "text-gray-400" : "text-gray-800 font-medium"}
          `}
        >
          <span className="truncate">
            {selected ? selected.label : placeholder ?? "Select…"}
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
          <div className="absolute z-50 mt-1.5 w-full rounded-lg bg-white shadow-lg ring-1 ring-gray-200 overflow-hidden">
            <div className="py-1 overflow-y-auto">
              {options.map((option) => {
                const isActive = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors
                      ${isActive
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    {isActive && (
                      <svg className="size-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default CustomSelect;