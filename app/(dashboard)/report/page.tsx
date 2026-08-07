import { getReportData } from "@/lib/reports/actions";
import ReportDashboard from "@/components/reports/ReportDashboard";

function parseDate(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return isNaN(d.getTime()) ? fallback : d;
}

const ReportPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) => {
  const params = await searchParams;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1); // start of this month
  const defaultTo = now;

  const from = parseDate(params.from, defaultFrom);
  const to = parseDate(params.to, defaultTo);
  to.setHours(23, 59, 59, 999); // inclusive end of the selected day

  const report = await getReportData({ from, to });

  return (
    <div className="flex-1 bg-white rounded-md md:p-4 mt-0">
      <ReportDashboard report={report} from={from} to={to} />
    </div>
  );
};

export default ReportPage;
