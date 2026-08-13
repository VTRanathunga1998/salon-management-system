"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { AlertCircle } from "lucide-react";

import { createQuickCustomer } from "@/lib/customers/actions";

import {
  quickCustomerSchema,
  type QuickCustomerSchema,
} from "@/lib/formValidationsSchemas";

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

const formatLabel = (customer: CustomerOption) => customer.name;

// Keep these in sync with the input filters below — they exist purely to
// stop obviously-invalid characters from being typed. Zod (via
// quickCustomerSchema) is still the actual source of truth and re-validates
// everything on submit, so this is UX polish, not a security boundary.
const stripNonDigits = (value: string) => value.replace(/\D/g, "");
const stripInvalidNameChars = (value: string) =>
  value.replace(/[^a-zA-Z\s'-]/g, "");

const CustomerCombobox = ({
  customers,
  value,
  onChange,
  error,
}: CustomerComboboxProps) => {
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);

  const [localCustomers, setLocalCustomers] =
    useState<CustomerOption[]>(customers);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"search" | "create">("search");

  useEffect(() => {
    setLocalCustomers(customers);
  }, [customers]);

  const selected = localCustomers.find((customer) => customer.id === value);

  /*
   * ---------------------------------------------------------
   * Quick customer form
   * ---------------------------------------------------------
   */

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuickCustomerSchema>({
    resolver: zodResolver(quickCustomerSchema),

    mode: "onSubmit",

    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  /*
   * Keep selected customer displayed in search box.
   */
  useEffect(() => {
    if (selected) {
      setQuery(formatLabel(selected));
    }
  }, [selected]);

  /*
   * Close dropdown when clicking outside.
   */
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setMode("search");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * Search
   * ---------------------------------------------------------
   */

  const results = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return localCustomers.slice(0, 8);
    }

    // Strip non-digits so searching "071 524" or "071-524" still matches
    // phone numbers, which are always stored as plain digit strings.
    const digitsOnlySearch = stripNonDigits(search);

    return localCustomers
      .filter((customer) => {
        const nameMatch = customer.name.toLowerCase().includes(search);
        const phoneMatch = digitsOnlySearch
          ? customer.phone.includes(digitsOnlySearch)
          : false;
        return nameMatch || phoneMatch;
      })
      .slice(0, 8);
  }, [query, localCustomers]);

  const exactMatch = results.some(
    (customer) => customer.name.toLowerCase() === query.trim().toLowerCase(),
  );

  /*
   * ---------------------------------------------------------
   * Open create mode
   * ---------------------------------------------------------
   */

  const openCreateMode = () => {
    reset({
      // Pre-fill from the search box, but only carry over valid name
      // characters — the search box itself isn't restricted, so a query
      // like "071..." shouldn't get shoved into the name field as-is.
      name: stripInvalidNameChars(query.trim()),
      phone: "",
      email: "",
      address: "",
    });

    setMode("create");
    setOpen(true);
  };

  /*
   * ---------------------------------------------------------
   * Create customer
   * ---------------------------------------------------------
   */

  const handleCreate = async (data: QuickCustomerSchema) => {
    try {

      const result = await createQuickCustomer(data);

      if (!result.success || !result.customer) {
        toast.error(result.message || "Failed to create customer.");

        return;
      }

      /*
       * Add newly created customer locally.
       */
      setLocalCustomers((previous) => [result.customer!, ...previous]);

      /*
       * Select newly created customer.
       */
      onChange(result.customer.id);

      /*
       * Show selected customer.
       */
      setQuery(result.customer.name);

      /*
       * Close create UI.
       */
      setMode("search");
      setOpen(false);

      /*
       * Clear create form.
       */
      reset();

      /*
       * Success toast.
       */
      toast.success(`${result.customer.name} created successfully.`);

      /*
       * Refresh server components.
       */
      router.refresh();
    } catch (error) {
      console.error("QUICK CUSTOMER ERROR:", error);

      toast.error("Something went wrong while creating the customer.");
    }
  };

  /*
   * ---------------------------------------------------------
   * IMPORTANT
   *
   * This prevents Enter from submitting the OUTER
   * Invoice form while creating a customer.
   * ---------------------------------------------------------
   */

  const preventEnter = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  };

  /*
   * ---------------------------------------------------------
   * Render
   * ---------------------------------------------------------
   */

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-xs font-medium text-gray-600">
        Customer
      </label>

      {/* Search */}
      <input
        type="text"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setMode("search");

          if (value) {
            onChange("");
          }
        }}
        placeholder="Search by name or phone..."
        className={`w-full rounded-lg bg-white px-3 py-2.5 text-sm ring-[1.5px] outline-none transition ${
          open ? "ring-blue-300" : "ring-gray-200 hover:ring-gray-300"
        }`}
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-gray-200">
          {mode === "search" ? (
            <div className="max-h-60 overflow-y-auto py-1">
              {/* Existing customers */}
              {results.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => {
                    onChange(customer.id);
                    setQuery(customer.name);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm ${
                    customer.id === value
                      ? "bg-blue-50 font-medium text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{customer.name}</span>

                  <span className="text-xs text-gray-400">
                    {customer.phone}
                  </span>
                </button>
              ))}

              {/* No results */}
              {results.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-400">
                  No customers found.
                </p>
              )}

              {/* Create */}
              {query.trim() && !exactMatch && (
                <button
                  type="button"
                  onClick={openCreateMode}
                  className="flex w-full items-center gap-2 border-t border-gray-100 bg-[#FAE27C]/30 px-4 py-2.5 text-left text-sm text-[#7c6f2a] hover:bg-[#FAE27C]/50"
                >
                  <span className="text-lg">+</span>
                  Create new customer "{query.trim()}"
                </button>
              )}
            </div>
          ) : (
            /*
             * ------------------------------------------------
             * Create customer UI
             *
             * IMPORTANT:
             * This is DIV, NOT FORM.
             * ------------------------------------------------
             */
            <div className="flex flex-col gap-3 p-3" onKeyDown={preventEnter}>
              <div>
                <p className="text-xs font-semibold text-gray-700">
                  New customer
                </p>

                <p className="mt-0.5 text-[11px] text-gray-400">
                  Enter customer details.
                </p>
              </div>

              {/* NAME */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="quick-customer-name"
                  className="text-xs font-medium text-gray-600"
                >
                  Name
                </label>

                <input
                  id="quick-customer-name"
                  type="text"
                  placeholder="Customer name"
                  autoFocus
                  {...register("name")}
                  onInput={(event) => {
                    event.currentTarget.value = stripInvalidNameChars(
                      event.currentTarget.value,
                    );
                  }}
                  className={`w-full rounded-md bg-white p-2.5 text-sm outline-none ring-[1.5px] ${
                    errors.name
                      ? "ring-red-300"
                      : "ring-gray-200 focus:ring-blue-300"
                  }`}
                />

                {errors.name && (
                  <p className="flex items-center gap-1 text-[11px] text-red-500">
                    <AlertCircle size={12} />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* PHONE */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="quick-customer-phone"
                  className="text-xs font-medium text-gray-600"
                >
                  Phone
                </label>

                <input
                  id="quick-customer-phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="0501234567"
                  {...register("phone")}
                  onInput={(event) => {
                    event.currentTarget.value = stripNonDigits(
                      event.currentTarget.value,
                    );
                  }}
                  className={`w-full rounded-md bg-white p-2.5 text-sm outline-none ring-[1.5px] ${
                    errors.phone
                      ? "ring-red-300"
                      : "ring-gray-200 focus:ring-blue-300"
                  }`}
                />

                {errors.phone && (
                  <p className="flex items-center gap-1 text-[11px] text-red-500">
                    <AlertCircle size={12} />
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* EMAIL */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="quick-customer-email"
                  className="text-xs font-medium text-gray-600"
                >
                  Email
                  <span className="ml-1 text-gray-400">(optional)</span>
                </label>

                <input
                  id="quick-customer-email"
                  type="email"
                  placeholder="customer@example.com"
                  autoCapitalize="none"
                  {...register("email")}
                  onInput={(event) => {
                    // Lowercase as-you-type. The schema also normalizes
                    // this on submit, but doing it live avoids a jarring
                    // "your input changed after you left the field" moment.
                    const el = event.currentTarget;
                    const cursor = el.selectionStart;
                    el.value = el.value.toLowerCase();
                    if (cursor !== null) el.setSelectionRange(cursor, cursor);
                  }}
                  className={`w-full rounded-md bg-white p-2.5 text-sm outline-none ring-[1.5px] ${
                    errors.email
                      ? "ring-red-300"
                      : "ring-gray-200 focus:ring-blue-300"
                  }`}
                />

                {errors.email && (
                  <p className="flex items-center gap-1 text-[11px] text-red-500">
                    <AlertCircle size={12} />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* ADDRESS */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="quick-customer-address"
                  className="text-xs font-medium text-gray-600"
                >
                  Address
                  <span className="ml-1 text-gray-400">(optional)</span>
                </label>

                <input
                  id="quick-customer-address"
                  type="text"
                  placeholder="Address"
                  {...register("address")}
                  className={`w-full rounded-md bg-white p-2.5 text-sm outline-none ring-[1.5px] ${
                    errors.address
                      ? "ring-red-300"
                      : "ring-gray-200 focus:ring-blue-300"
                  }`}
                />

                {errors.address && (
                  <p className="flex items-center gap-1 text-[11px] text-red-500">
                    <AlertCircle size={12} />
                    {errors.address.message}
                  </p>
                )}
              </div>

              {/* BUTTONS */}
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    reset();
                    setMode("search");
                  }}
                  className="flex-1 rounded-md py-2 text-xs font-medium text-gray-600 ring-[1.5px] ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
                >
                  Back
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit(handleCreate)}
                  className="flex-1 rounded-md bg-[#C3EBFA] py-2 text-xs font-medium text-gray-800 hover:brightness-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create & select"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invoice-level customer validation */}
      {error && (
        <p className="mt-1 text-xs text-red-400">Customer is required!</p>
      )}
    </div>
  );
};

export default CustomerCombobox;
