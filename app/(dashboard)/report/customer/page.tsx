import CustomerReportFilters from "@/components/reports/CustomerReportFilters";
import CustomerReportTable from "@/components/reports/CustomerReportTable";
import { getCustomerReport } from "@/lib/reports/customerReport";
import {
  Users,
  Receipt,
  Banknote,
  WalletCards,
  AlertCircle,
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

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-800">
          Customer Report
        </h1>
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
