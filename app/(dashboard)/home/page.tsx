import {
  Scissors,
  Users,
  UserCheck,
  CalendarCheck,
  Banknote,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import RecentInvoicesTable from "@/components/dashboard/RecentInvoicesTable";
import { getDashboardStats } from "@/lib/dashboard/actions";

const DashboardPage = async () => {
  const stats = await getDashboardStats();

  const statCards = [
    {
      title: "Total Services",
      value: stats.totalServices,
      icon: <Scissors className="h-5 w-5" />,
      accent: "bg-violet-500",
      description: "Active services offered",
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      icon: <Users className="h-5 w-5" />,
      accent: "bg-blue-500",
      description: "All-time registered customers",
    },
    {
      title: "Today's Customers",
      value: stats.todaysCustomers,
      icon: <UserCheck className="h-5 w-5" />,
      accent: "bg-teal-500",
      description: "Distinct customers served today",
    },
    {
      title: "Today's Appointments",
      value: stats.todaysAppointments,
      icon: <CalendarCheck className="h-5 w-5" />,
      accent: "bg-amber-500",
      description: "Invoices created today",
    },
    {
      title: "Today's Revenue",
      value: stats.todaysRevenue,
      icon: <Banknote className="h-5 w-5" />,
      accent: "bg-green-500",
      description: "Payments collected today",
      prefix: "Rs.  ",
    },
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-800">
          Dashboard
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Overview of your salon today.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
          At a Glance
        </h2>
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
