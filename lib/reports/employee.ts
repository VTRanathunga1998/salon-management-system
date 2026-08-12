import { prisma } from "@/lib/prisma";

export interface EmployeeReportFilters {
  from: Date;
  to: Date;
  employeeId?: string; // undefined = all employees
}

export async function getEmployeeReportData({
  from,
  to,
  employeeId,
}: EmployeeReportFilters) {
  const invoices = await prisma.invoice.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      status: { not: "CANCELLED" },
      // Narrow at the DB level for efficiency — the loop below still
      // filters individual assignments, since an invoice matching this
      // clause may have OTHER items with OTHER employees too.
      ...(employeeId
        ? { items: { some: { employees: { some: { employeeId } } } } }
        : {}),
    },
    select: {
      invoiceNumber: true,
      createdAt: true,
      customer: { select: { name: true } },
      items: {
        select: {
          subtotal: true,
          quantity: true,
          serviceNameSnapshot: true,
          employees: {
            select: {
              employeeId: true,
              employee: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  interface LogRow {
    employeeId: string;
    employeeName: string;
    serviceName: string;
    customerName: string;
    invoiceNumber: string;
    quantity: number;
    amount: number;
    date: Date;
  }

  const employeeMap = new Map<
    string,
    { employeeId: string; name: string; servicesCount: number; revenue: number }
  >();
  const log: LogRow[] = [];
  const dailyRevenue = new Map<string, number>();

  const rangeDays = Math.max(
    1,
    Math.ceil((to.getTime() - from.getTime()) / 86_400_000),
  );
  const granularity: "day" | "month" = rangeDays <= 31 ? "day" : "month";
  const bucketKey = (d: Date) =>
    granularity === "day"
      ? d.toISOString().slice(0, 10)
      : d.toISOString().slice(0, 7);

  for (const inv of invoices) {
    for (const item of inv.items) {
      const employeeCount = item.employees.length || 1;
      const revenueShare = Number(item.subtotal) / employeeCount;

      for (const assignment of item.employees) {
        if (employeeId && assignment.employeeId !== employeeId) continue;

        const entry = employeeMap.get(assignment.employeeId) ?? {
          employeeId: assignment.employeeId,
          name: assignment.employee.name,
          servicesCount: 0,
          revenue: 0,
        };
        entry.servicesCount += item.quantity;
        entry.revenue += revenueShare;
        employeeMap.set(assignment.employeeId, entry);

        log.push({
          employeeId: assignment.employeeId,
          employeeName: assignment.employee.name,
          serviceName: item.serviceNameSnapshot,
          customerName: inv.customer.name,
          invoiceNumber: inv.invoiceNumber,
          quantity: item.quantity,
          amount: revenueShare,
          date: inv.createdAt,
        });

        const key = bucketKey(new Date(inv.createdAt));
        dailyRevenue.set(key, (dailyRevenue.get(key) ?? 0) + revenueShare);
      }
    }
  }

  log.sort((a, b) => b.date.getTime() - a.date.getTime());

  const employeeStats = Array.from(employeeMap.values()).sort(
    (a, b) => b.revenue - a.revenue,
  );
  const revenueSeries = Array.from(dailyRevenue.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));

  const totalRevenue = employeeStats.reduce((s, e) => s + e.revenue, 0);
  const totalServices = employeeStats.reduce((s, e) => s + e.servicesCount, 0);

  return {
    range: { from, to, granularity },
    summary: {
      totalRevenue,
      totalServices,
      employeeCount: employeeStats.length,
    },
    employeeStats,
    revenueSeries,
    log,
  };
}

export type EmployeeReportData = Awaited<
  ReturnType<typeof getEmployeeReportData>
>;
