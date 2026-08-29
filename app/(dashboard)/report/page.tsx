import { getReportData } from "@/lib/reports/actions";
import ReportDashboard from "@/components/reports/ReportDashboard";
import {
  endOfDayInSalonTz,
  startOfDayInSalonTz,
  todayInSalonTz,
} from "@/lib/utils/timezone";

function isValidDateString(value: string | undefined): boolean {
  if (!value) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !isNaN(date.getTime());
}

const ReportPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) => {
  const params = await searchParams;

  const today = todayInSalonTz();
  const [year, month] = today.split("-");
  const defaultFromString = `${year}-${month}-01`;
  const defaultToString = today;

  const fromString = isValidDateString(params.from)
    ? params.from!
    : defaultFromString;
  const toString = isValidDateString(params.to) ? params.to! : defaultToString;

  const from = startOfDayInSalonTz(fromString);
  const to = endOfDayInSalonTz(toString);

  const report = await getReportData({ from, to });

  return (
    <div className="flex-1 bg-white rounded-md md:p-4 mt-0">
      <ReportDashboard
        report={report}
        from={from}
        to={to}
        fromLabel={fromString}
        toLabel={toString}
      />
    </div>
  );
};

export default ReportPage;
