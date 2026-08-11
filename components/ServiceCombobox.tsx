"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Service = {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
};

interface ServiceComboboxProps {
  label?: string;
  services: Service[];
  value: string;
  onChange: (serviceId: string) => void;
  error?: string;
  placeholder?: string;
}

const money = (n: number) => `Rs.  ${n.toFixed(2)}`;

const ServiceCombobox = ({
  label = "Service",
  services,
  value,
  onChange,
  error,
  placeholder = "Type to search services…",
}: ServiceComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = services.find((s) => s.id === value);

  // Keep the visible text in sync with the actual selection whenever it
  // changes from outside (e.g. defaultValues on edit) or the list closes.
  useEffect(() => {
    if (!open) {
      setQuery(selected ? selected.name : "");
    }
  }, [selected, open]);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, query]);

  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0" ref={ref}>
      <label className="text-xs text-gray-500">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            // Typing away from a confirmed selection clears it — forces an
            // explicit re-pick rather than silently keeping a stale id.
            if (value) onChange("");
          }}
          className={`w-full rounded-lg bg-white px-3 py-2.5 text-sm outline-none ring-[1.5px] transition
            ${open ? "ring-blue-300" : "ring-gray-200 hover:ring-gray-300"}
          `}
        />

        {open && (
          <div className="absolute z-50 mt-1.5 w-full rounded-lg bg-white shadow-lg ring-1 ring-gray-200 overflow-hidden">
            <div className="py-1 max-h-[240px] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">
                  No services found.
                </p>
              ) : (
                filtered.map((service) => {
                  const isActive = service.id === value;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        onChange(service.id);
                        setQuery(service.name);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-sm transition-colors
                        ${
                          isActive
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }
                      `}
                    >
                      <span className="truncate">
                        {service.name}
                        {!service.isActive && (
                          <span className="text-gray-400"> (inactive)</span>
                        )}
                      </span>
                    </button>
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

export default ServiceCombobox;
