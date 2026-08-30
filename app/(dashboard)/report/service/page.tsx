import ServiceReportFilters from "@/components/reports/service/ServiceReportFilters";
import ServiceReportTable from "@/components/reports/service/ServiceReportTable";
import SummaryCard from "@/components/reports/SummaryCard";
import {
  getServiceReport,
  getAllServiceNames,
} from "@/lib/reports/serviceReport";
import {
  Wrench,
  CalendarCheck,
  Layers,
  Banknote,
  Download,
} from "lucide-react";

type SearchParams = {
  search?: string;
  serviceId?: string;
  from?: string;
  to?: string;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

const money = (value: number) =>
  `AED ${value.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const ServiceReportPage = async ({ searchParams }: Props) => {
  const params = await searchParams;

  const [report, allServices] = await Promise.all([
    getServiceReport({
      search: params.search,
      serviceId: params.serviceId,
      from: params.from,
      to: params.to,
    }),
    getAllServiceNames(),
  ]);

  const hasFilter =
    Boolean(params.search) ||
    Boolean(params.serviceId) ||
    Boolean(params.from) ||
    Boolean(params.to);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-800">
          Service Report
        </h1>

        <div className="flex gap-1">
          <a
            href={`/api/reports/service/csv?${searchParams.toString()}`}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Download size={14} />
            Download CSV
          </a>

          <a
            href={`/api/reports/service/pdf?${searchParams.toString()}`}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Download size={14} />
            Download PDF
          </a>
        </div>
      </div>

      {/* Filters */}
      <ServiceReportFilters
        allServices={allServices}
        initialSearch={params.search}
        initialServiceId={params.serviceId}
        initialFrom={params.from}
        initialTo={params.to}
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          label="Service Types"
          value={report.summary.totalServiceTypes.toString()}
          description="Different services performed"
          icon={<Wrench size={18} />}
        />

        <SummaryCard
          label="Service Entries"
          value={report.summary.totalBookings.toString()}
          description="Invoice service entries"
          icon={<CalendarCheck size={18} />}
        />

        <SummaryCard
          label="Services Performed"
          value={report.summary.totalQuantity.toString()}
          description="Total service units"
          icon={<Layers size={18} />}
        />

        <SummaryCard
          label="Service Revenue"
          value={money(report.summary.totalRevenue)}
          description="Revenue generated"
          icon={<Banknote size={18} />}
        />
      </div>

      {/* Active filter summary */}
      {hasFilter && (
        <div className="rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700 ring-1 ring-blue-100">
          Showing service revenue and history based on your selected filters.
        </div>
      )}

      {/* Service history */}
      <ServiceReportTable
        services={report.services}
        selectedServiceId={params.serviceId}
      />
    </div>
  );
};

export default ServiceReportPage;
