import { getReportData } from "@/lib/reports/actions";
import ReportDashboard from "@/components/reports/ReportDashboard";
import { endOfDayInSalonTz, startOfDayInSalonTz, todayInSalonTz } from "@/lib/utils/timezone";


function isValidDateString(value: string | undefined): boolean {
  if (!value) return false;

  // Make sure it is actually yyyy-mm-dd
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !isNaN(date.getTime());
}

const ReportPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) => {
  const params = await searchParams;

  /*
   * Get today's date in the salon timezone.
   *
   * Example:
   * Server UTC:       2026-08-12 23:00
   * Salon Colombo:    2026-08-13 04:30
   *
   * todayInSalonTz() correctly returns 2026-08-13.
   */
  const today = todayInSalonTz();

  /*
   * Default "from" = first day of the current month
   * in the salon timezone.
   *
   * Example:
   * today = 2026-08-13
   * from  = 2026-08-01 00:00:00 Asia/Colombo
   */
  const [year, month] = today.split("-");

  const defaultFromString = `${year}-${month}-01`;

  /*
   * Default "to" = today in salon timezone.
   */
  const defaultToString = today;

  /*
   * Validate query parameters.
   */
  const fromString = isValidDateString(params.from)
    ? params.from!
    : defaultFromString;

  const toString = isValidDateString(params.to) ? params.to! : defaultToString;

  /*
   * Convert salon calendar dates into absolute Date objects.
   *
   * These represent:
   *
   * from = 00:00:00.000 Colombo time
   * to   = 23:59:59.999 Colombo time
   */
  const from = startOfDayInSalonTz(fromString);
  const to = endOfDayInSalonTz(toString);

  const report = await getReportData({
    from,
    to,
  });

  return (
    <div className="flex-1 bg-white rounded-md md:p-4 mt-0">
      <ReportDashboard report={report} from={from} to={to} />
    </div>
  );
};

export default ReportPage;
