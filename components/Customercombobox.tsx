"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createQuickCustomer } from "@/lib/customers/actions";

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
}

interface CustomerComboboxProps {
  customers: CustomerOption[];
  value: string;
  onChange: (customerId: string) => void;
  error?: string;
}

const formatLabel = (c: CustomerOption) => `${c.name}`;

const CustomerCombobox = ({
  customers,
  value,
  onChange,
  error,
}: CustomerComboboxProps) => {
  const router = useRouter();
  const [localCustomers, setLocalCustomers] = useState(customers);
  useEffect(() => setLocalCustomers(customers), [customers]);

  const selected = localCustomers.find((c) => c.id === value);

  const [query, setQuery] = useState(selected ? formatLabel(selected) : "");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"search" | "create">("search");
  const ref = useRef<HTMLDivElement>(null);

  // Keep the input text synced if `value` is set externally (e.g. edit mode)
  useEffect(() => {
    if (selected) setQuery(formatLabel(selected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setMode("search");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return localCustomers.slice(0, 8);
    return localCustomers
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .slice(0, 8);
  }, [query, localCustomers]);

  const exactMatch = results.some(
    (c) => formatLabel(c).toLowerCase() === query.trim().toLowerCase(),
  );

  // ---- Inline "create new customer" sub-form state ----
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const openCreateMode = () => {
    setNewName(query.trim());
    setNewPhone("");
    setNewEmail("");
    setNewAddress("");
    setCreateError("");
    setMode("create");
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      setCreateError("Name is required.");
      return;
    }
    if (!newPhone.trim()) {
      setCreateError("Phone is required.");
      return;
    }

    setCreating(true);
    setCreateError("");

    const res = await createQuickCustomer({
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      address: newAddress.trim() || undefined,
    });

    setCreating(false);

    if (!res.success || !res.customer) {
      setCreateError(res.message || "Failed to create customer.");
      return;
    }

    const created = res.customer;
    setLocalCustomers((prev) => [created, ...prev]);
    onChange(created.id);
    setQuery(formatLabel(created));
    setMode("search");
    setOpen(false);
    router.refresh(); // re-fetches server components (FormContainer's customer list, etc.)
  };

  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0" ref={ref}>
      <label className="text-xs text-gray-500">Customer</label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setMode("search");
            if (value) onChange("");
          }}
          placeholder="Search by name or phone…"
          className={`w-full rounded-lg bg-white px-3 py-2.5 text-sm ring-[1.5px] transition
            ${open ? "ring-blue-300" : "ring-gray-200 hover:ring-gray-300"}
            ${!selected ? "text-gray-800" : "text-gray-800 font-medium"}
          `}
        />

        {open && (
          <div className="absolute z-50 mt-1.5 w-full rounded-lg bg-white shadow-lg ring-1 ring-gray-200 overflow-hidden">
            {mode === "search" ? (
              <div className="py-1 max-h-60 overflow-y-auto">
                {results.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onChange(c.id);
                      setQuery(formatLabel(c));
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2 text-sm text-left transition-colors
                      ${c.id === value ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"}
                    `}
                  >
                    <span>{c.name}</span>
                    <span className="text-xs text-gray-400">{c.phone}</span>
                  </button>
                ))}

                {results.length === 0 && (
                  <p className="px-4 py-3 text-sm text-gray-400">
                    No customers found.
                  </p>
                )}

                {query.trim() && !exactMatch && (
                  <button
                    type="button"
                    onClick={openCreateMode}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-left text-[#7c6f2a] bg-[#FAE27C]/30 hover:bg-[#FAE27C]/50 border-t border-gray-100"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    Create new customer &ldquo;{query.trim()}&rdquo;
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-600 mb-0.5">
                  New customer
                </p>

                <input
                  type="text"
                  placeholder="Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="ring-[1.5px] ring-gray-200 rounded-md p-2 text-sm focus:outline-none"
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="ring-[1.5px] ring-gray-200 rounded-md p-2 text-sm focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="ring-[1.5px] ring-gray-200 rounded-md p-2 text-sm focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Address (optional)"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="ring-[1.5px] ring-gray-200 rounded-md p-2 text-sm focus:outline-none"
                />

                {createError && (
                  <p className="text-xs text-red-500">{createError}</p>
                )}

                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setMode("search")}
                    className="flex-1 py-2 rounded-md ring-[1.5px] ring-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex-1 py-2 rounded-md bg-[#C3EBFA] hover:brightness-95 disabled:opacity-50 text-xs font-medium text-gray-800 cursor-pointer"
                  >
                    {creating ? "Creating…" : "Create & select"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400">Customer is required!</p>}
    </div>
  );
};

export default CustomerCombobox;
