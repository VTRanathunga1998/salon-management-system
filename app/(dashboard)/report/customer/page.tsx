import CustomerReportFilters from "@/components/reports/customer/CustomerReportFilters";
import CustomerReportTable from "@/components/reports/customer/CustomerReportTable";
import { getCustomerReport } from "@/lib/reports/customer/customerReport";
import {
  Users,
  Receipt,
  Banknote,
  WalletCards,
  AlertCircle,
  Download,
} from "lucide-react";

type SearchParams = {
  search?: string;
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

const CustomerReportPage = async ({ searchParams }: Props) => {
  const params = await searchParams;

  const report = await getCustomerReport({
    search: params.search,
    from: params.from,
    to: params.to,
  });

  const hasFilter =
    Boolean(params.search) || Boolean(params.from) || Boolean(params.to);

  const reportQuery = new URLSearchParams();
  if (params.search) reportQuery.set("search", params.search);
  if (params.from) reportQuery.set("from", params.from);
  if (params.to) reportQuery.set("to", params.to);
  const queryString = reportQuery.toString();

  const pdfUrl = `/api/reports/customer/pdf${queryString ? `?${queryString}` : ""}`;
  const csvUrl = `/api/reports/customer/csv${queryString ? `?${queryString}` : ""}`;
  const excelUrl = `/api/reports/customer/excel${queryString ? `?${queryString}` : ""}`;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-800">
          Customer Report
        </h1>

        <div className="flex gap-1">
          <a
            href={excelUrl}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Download size={14} />
            Download Excel
          </a>
          <a
            href={csvUrl}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Download size={14} />
            Download CSV
          </a>
          <a
            href={pdfUrl}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Download size={14} />
            Download PDF
          </a>
        </div>
      </div>

      {/* Filters */}
      <CustomerReportFilters
        initialSearch={params.search}
        initialFrom={params.from}
        initialTo={params.to}
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <SummaryCard
          label="Customers"
          value={report.summary.totalCustomers.toString()}
          icon={<Users size={19} />}
        />

        <SummaryCard
          label="Invoices"
          value={report.summary.totalInvoices.toString()}
          icon={<Receipt size={19} />}
        />

        <SummaryCard
          label="Total Revenue"
          value={money(report.summary.totalBilled)}
          icon={<Banknote size={19} />}
        />

        <SummaryCard
          label="Total Paid"
          value={money(report.summary.totalPaid)}
          icon={<WalletCards size={19} />}
        />

        <SummaryCard
          label="Outstanding"
          value={money(report.summary.totalOutstanding)}
          icon={<AlertCircle size={19} />}
        />
      </div>

      {/* Active filter summary */}
      {hasFilter && (
        <div className="rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700 ring-1 ring-blue-100">
          Showing customer revenue and service history based on your selected
          filters.
        </div>
      )}

      {/* Customer history */}
      <CustomerReportTable customers={report.customers} />
    </div>
  );
};

const SummaryCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) => {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-500">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-gray-400">{label}</p>

      <p className="mt-1 truncate text-lg font-bold text-gray-800">{value}</p>
    </div>
  );
};

export default CustomerReportPage;
