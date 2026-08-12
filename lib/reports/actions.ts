import { prisma } from "@/lib/prisma";
import { toDateInputInSalonTz, toMonthInSalonTz } from "../utils/timezone";

export interface ReportFilters {
  from: Date;
  to: Date; // should already be set to end-of-day by the caller
}

export async function getReportData({ from, to }: ReportFilters) {
  const [payments, invoices, newCustomersCount] = await Promise.all([
    // Actual cash collected in the range (what "revenue" means to an owner)
    prisma.payment.findMany({
      where: { status: "COMPLETED", paidAt: { gte: from, lte: to } },
      select: { amount: true, paidAt: true, method: true },
    }),

    // Everything billed in the range, regardless of payment status
    prisma.invoice.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { not: "CANCELLED" },
      },
      select: {
        id: true,
        invoiceNumber: true, // NEW — needed for the itemized log below
        total: true,
        status: true,
        createdAt: true,
        customerId: true,
        customer: { select: { name: true } },
        items: {
          select: {
            subtotal: true,
            quantity: true,
            serviceId: true,
            serviceNameSnapshot: true,
            employees: {
              select: {
                employeeId: true,
                employee: { select: { name: true } },
              },
            },
          },
        },
        payments: { where: { status: "COMPLETED" }, select: { amount: true } },
      },
    }),

    prisma.customer.count({ where: { createdAt: { gte: from, lte: to } } }),
  ]);

  // --- Headline numbers ---
  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);
  const invoicedTotal = invoices.reduce((s, inv) => s + Number(inv.total), 0);
  const outstanding = invoices.reduce((s, inv) => {
    const paid = inv.payments.reduce((ps, p) => ps + Number(p.amount), 0);
    return s + Math.max(Number(inv.total) - paid, 0);
  }, 0);

  // --- Time series: daily buckets for ranges up to a month, monthly beyond that ---
  const rangeDays = Math.max(
    1,
    Math.ceil((to.getTime() - from.getTime()) / 86_400_000),
  );
  const granularity: "day" | "month" = rangeDays <= 31 ? "day" : "month";
  const bucketKey = (d: Date) =>
    granularity === "day" ? toDateInputInSalonTz (d) : toMonthInSalonTz(d);

  const revenueBuckets = new Map<string, number>();
  for (const p of payments) {
    const key = bucketKey(new Date(p.paidAt));
    revenueBuckets.set(key, (revenueBuckets.get(key) ?? 0) + Number(p.amount));
  }
  const revenueSeries = Array.from(revenueBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));

  // --- Payment method breakdown ---
  const methodMap = new Map<string, number>();
  for (const p of payments) {
    methodMap.set(p.method, (methodMap.get(p.method) ?? 0) + Number(p.amount));
  }
  const methodBreakdown = Array.from(methodMap.entries()).map(
    ([method, amount]) => ({
      method,
      amount,
    }),
  );

  // --- Employee performance, service breakdown, customer spend, AND the
  //     itemized "who did what" log — all derived from the same pass ---
  const employeeMap = new Map<
    string,
    { employeeId: string; name: string; servicesCount: number; revenue: number }
  >();
  const serviceMap = new Map<
    string,
    { serviceId: string; name: string; timesPerformed: number; revenue: number }
  >();
  const customerMap = new Map<
    string,
    { customerId: string; name: string; invoiceCount: number; spend: number }
  >();

  interface EmployeeServiceLogRow {
    employeeId: string;
    employeeName: string;
    serviceName: string;
    customerName: string;
    invoiceNumber: string;
    quantity: number;
    amount: number;
    date: Date;
  }
  const employeeServiceLog: EmployeeServiceLogRow[] = [];

  for (const inv of invoices) {
    const custEntry = customerMap.get(inv.customerId) ?? {
      customerId: inv.customerId,
      name: inv.customer.name,
      invoiceCount: 0,
      spend: 0,
    };
    custEntry.invoiceCount += 1;
    custEntry.spend += Number(inv.total);
    customerMap.set(inv.customerId, custEntry);

    for (const item of inv.items) {
      // Split this line's revenue evenly across however many employees are
      // assigned to it. A single-employee line is unaffected (divides by 1).
      // "Services performed" still gets full credit per employee — they did
      // participate in the full service — only the money is divided.
      const employeeCount = item.employees.length || 1;
      const revenueShare = Number(item.subtotal) / employeeCount;

      for (const assignment of item.employees) {
        const empEntry = employeeMap.get(assignment.employeeId) ?? {
          employeeId: assignment.employeeId,
          name: assignment.employee.name,
          servicesCount: 0,
          revenue: 0,
        };
        empEntry.servicesCount += item.quantity;
        empEntry.revenue += revenueShare;
        employeeMap.set(assignment.employeeId, empEntry);

        // One row per (employee, service line) — amount reflects this
        // employee's share, not the full line total, when co-performed.
        employeeServiceLog.push({
          employeeId: assignment.employeeId,
          employeeName: assignment.employee.name,
          serviceName: item.serviceNameSnapshot,
          customerName: inv.customer.name,
          invoiceNumber: inv.invoiceNumber,
          quantity: item.quantity,
          amount: revenueShare,
          date: inv.createdAt,
        });
      }

      const svcEntry = serviceMap.get(item.serviceId) ?? {
        serviceId: item.serviceId,
        name: item.serviceNameSnapshot,
        timesPerformed: 0,
        revenue: 0,
      };
      svcEntry.timesPerformed += item.quantity;
      svcEntry.revenue += Number(item.subtotal); // service-level total is unaffected — it's not attributed to any one person
      serviceMap.set(item.serviceId, svcEntry);
    }
  }

  employeeServiceLog.sort((a, b) => b.date.getTime() - a.date.getTime());

  const employeeStats = Array.from(employeeMap.values()).sort(
    (a, b) => b.revenue - a.revenue,
  );
  const serviceStats = Array.from(serviceMap.values()).sort(
    (a, b) => b.revenue - a.revenue,
  );
  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);

  const statusBreakdown = invoices.reduce<Record<string, number>>(
    (acc, inv) => {
      acc[inv.status] = (acc[inv.status] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return {
    range: { from, to, granularity },
    summary: {
      totalRevenue,
      invoicedTotal,
      outstanding,
      invoiceCount: invoices.length,
      newCustomers: newCustomersCount,
      customersServed: customerMap.size,
    },
    revenueSeries,
    methodBreakdown,
    employeeStats,
    serviceStats,
    topCustomers,
    statusBreakdown,
    employeeServiceLog, // NEW
  };
}

export type ReportData = Awaited<ReturnType<typeof getReportData>>;
