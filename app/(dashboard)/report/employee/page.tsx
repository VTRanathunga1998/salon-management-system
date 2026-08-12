import { prisma } from "@/lib/prisma";
import { getEmployeeReportData } from "@/lib/reports/employee";
import EmployeeReportDashboard from "@/components/reports/EmployeeReportDashboard";

function parseDate(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return isNaN(d.getTime()) ? fallback : d;
}

const EmployeeReportPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; employeeId?: string }>;
}) => {
  const params = await searchParams;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = now;

  const from = parseDate(params.from, defaultFrom);
  const to = parseDate(params.to, defaultTo);
  to.setHours(23, 59, 59, 999);

  const employeeId =
    params.employeeId && params.employeeId !== "all"
      ? params.employeeId
      : undefined;

  const [report, employees] = await Promise.all([
    getEmployeeReportData({ from, to, employeeId }),
    prisma.employee.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex-1 bg-white rounded-md md:p-4 mt-0">
      <EmployeeReportDashboard
        report={report}
        from={from}
        to={to}
        employees={employees}
        selectedEmployeeId={employeeId ?? "all"}
      />
    </div>
  );
};

export default EmployeeReportPage;