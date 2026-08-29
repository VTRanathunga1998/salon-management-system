"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const categories = [
  "ALL",
  "RENT",
  "UTILITIES",
  "SUPPLIES",
  "SALARIES",
  "MARKETING",
  "MAINTENANCE",
  "OTHER",
];

const labels: Record<string, string> = {
  ALL: "All categories",
  RENT: "Rent",
  UTILITIES: "Utilities",
  SUPPLIES: "Supplies",
  SALARIES: "Salaries",
  MARKETING: "Marketing",
  MAINTENANCE: "Maintenance",
  OTHER: "Other",
};

const ExpenseCategoryFilter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("category") ?? "ALL";

  const setCategory = (c: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (c === "ALL") {
      params.delete("category");
    } else {
      params.set("category", c);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      value={current}
      onChange={(e) => setCategory(e.target.value)}
      className="ring-[1.5px] ring-gray-200 rounded-lg p-2 text-sm bg-white focus:outline-none"
    >
      {categories.map((c) => (
        <option key={c} value={c}>
          {labels[c]}
        </option>
      ))}
    </select>
  );
};

export default ExpenseCategoryFilter;
