"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const EmployeeReportFilter = ({
  employees,
}: {
  employees: { id: string; name: string }[];
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("employeeId") ?? "all";

  const setEmployee = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "all") {
      params.delete("employeeId");
    } else {
      params.set("employeeId", id);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      value={current}
      onChange={(e) => setEmployee(e.target.value)}
      className="ring-[1.5px] ring-gray-200 rounded-lg p-2 text-sm bg-white focus:outline-none"
    >
      <option value="all">All employees</option>
      {employees.map((e) => (
        <option key={e.id} value={e.id}>
          {e.name}
        </option>
      ))}
    </select>
  );
};

export default EmployeeReportFilter;
