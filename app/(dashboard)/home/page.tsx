import { Scissors, Users, Banknote, Receipt, FileText, CalendarDays } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import RecentInvoicesTable from "@/components/dashboard/RecentInvoicesTable";
import DashboardFilter from "@/components/dashboard/DashboardFilter";
import { getDashboardStats } from "@/lib/dashboard/actions";
import { DashboardRangeType } from "@/lib/utils/timezone";

type DashboardPageProps = {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
};

const VALID_RANGES: DashboardRangeType[] = [
  "today",
  "week",
  "month",
  "year",
  "custom",
];

const RANGE_LABELS: Record<DashboardRangeType, string> = {
  today: "today",
  week: "this week",
  month: "this month",
  year: "this year",
  custom: "the selected range",
};
const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
  const params = await searchParams;

  let range = VALID_RANGES.includes(params.range as DashboardRangeType)
    ? (params.range as DashboardRangeType)
    : "month";

  // Fall back to month if custom is selected but dates aren't set yet
  if (range === "custom" && (!params.from || !params.to)) {
    range = "month";
  }

  const stats = await getDashboardStats(range, params.from, params.to);
  const rangeLabel = RANGE_LABELS[range];

  const statCards = [
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      icon: <Users className="h-5 w-5" />,
      accent: "bg-blue-500",
      description: `Distinct customers invoiced ${rangeLabel}`,
    },
    {
      title: "Total Services",
      value: stats.totalServices,
      icon: <Scissors className="h-5 w-5" />,
      accent: "bg-violet-500",
      description: "Active services offered",
    },
    {
      title: "Total Invoices",
      value: stats.totalInvoices,
      icon: <FileText className="h-5 w-5" />,
      accent: "bg-amber-500",
      description: `Services billed ${rangeLabel}`,
    },
    {
      title: "Total Revenue",
      value: stats.revenue,
      icon: <Banknote className="h-5 w-5" />,
      accent: "bg-green-500",
      description: `Payments collected ${rangeLabel}`,
      prefix: "AED ",
    },
    {
      title: "Total Expenses",
      value: stats.totalExpenses,
      icon: <Receipt className="h-5 w-5" />,
      accent: "bg-red-500",
      description: `Expenses recorded ${rangeLabel}`,
      prefix: "AED ",
    },
    {
      title: "Total Appointments",
      value: stats.totalAppointments,
      icon: <CalendarDays className="h-5 w-5" />,
      accent: "bg-cyan-500",
      description: `Appointments scheduled ${rangeLabel}`,
    },
    
  ];

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            Dashboard
          </h1>
        </div>
        <DashboardFilter />
      </div>

      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section>
        <RecentInvoicesTable invoices={stats.recentInvoices} />
      </section>
    </div>
  );
};

export default DashboardPage;


