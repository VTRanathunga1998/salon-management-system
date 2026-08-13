import { prisma } from "@/lib/prisma";
import { getEmployeeReportData } from "@/lib/reports/employee";
import EmployeeReportDashboard from "@/components/reports/EmployeeReportDashboard";
import {
  endOfDayInSalonTz,
  startOfDayInSalonTz,
  todayInSalonTz,
} from "@/lib/utils/timezone";

function isValidDateString(value: string | undefined): boolean {
  if (!value) return false;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !isNaN(date.getTime());
}

const EmployeeReportPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    employeeId?: string;
  }>;
}) => {
  const params = await searchParams;

  /*
   * Get today's calendar date in the salon timezone.
   *
   * Example:
   * today = "2026-08-13"
   */
  const today = todayInSalonTz();

  /*
   * First day of the current month.
   *
   * Example:
   * today = 2026-08-13
   * defaultFromString = 2026-08-01
   */
  const [year, month] = today.split("-");

  const defaultFromString = `${year}-${month}-01`;
  const defaultToString = today;

  /*
   * Validate URL date parameters.
   *
   * If invalid/missing, fall back to the current
   * month and today in the salon timezone.
   */
  const fromString = isValidDateString(params.from)
    ? params.from!
    : defaultFromString;

  const toString = isValidDateString(params.to) ? params.to! : defaultToString;

  /*
   * Convert salon calendar dates into absolute Date objects.
   *
   * from:
   *   00:00:00.000 Asia/Colombo
   *
   * to:
   *   23:59:59.999 Asia/Colombo
   */
  const from = startOfDayInSalonTz(fromString);
  const to = endOfDayInSalonTz(toString);

  const employeeId =
    params.employeeId && params.employeeId !== "all"
      ? params.employeeId
      : undefined;

  const [report, employees] = await Promise.all([
    getEmployeeReportData({
      from,
      to,
      employeeId,
    }),

    prisma.employee.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
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
