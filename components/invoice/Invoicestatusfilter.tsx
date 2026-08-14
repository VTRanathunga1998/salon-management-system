"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const statuses = ["ALL", "ISSUED", "PARTIALLY_PAID", "PAID", "CANCELLED"];

const labels: Record<string, string> = {
  ALL: "All",
  ISSUED: "Unpaid",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

const InvoiceStatusFilter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "ALL";

  const setStatus = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "ALL") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    params.delete("page"); // reset pagination when the filter changes
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="hidden lg:flex flex-wrap gap-2">
      {statuses.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => setStatus(s)}
          className={`text-xs font-medium px-3 py-1.5 rounded-full ring-[1.5px] transition cursor-pointer ${
            current === s
              ? "bg-gray-800 text-white ring-gray-800"
              : "ring-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {labels[s]}
        </button>
      ))}
    </div>
  );
};

export default InvoiceStatusFilter;
