import { prisma } from "@/lib/prisma";
import { getDashboardDateRange, DashboardRangeType } from "../utils/timezone";

export async function getDashboardStats(
  rangeType: DashboardRangeType,
  customFrom?: string,
  customTo?: string,
) {
  const { start, end } = getDashboardDateRange(rangeType, customFrom, customTo);

  const [
    servicesAgg,
    totalAppointments,
    invoicesInRange,
    revenueAgg,
    expensesAgg,
    recentInvoicesRaw,
  ] = await Promise.all([

    prisma.invoiceItem.aggregate({
      where: {
        invoice: {
          createdAt: {
            gte: start,
            lte: end,
          },
          status: {
            notIn: ["REFUNDED", "CANCELLED"],
          },
        },
      },
      _sum: {
        quantity: true,
      },
    }),

    // Total Appointments in the selected date range
    prisma.appointment.count({ where: { date: { gte: start, lte: end } } }),

    // All invoices in the selected range
    prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        customerId: true,
      },
    }),

    // Total Sales: sum of all invoice totals in the selected range
    prisma.invoice.aggregate({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: {
          notIn: ["REFUNDED", "CANCELLED"],
        },
      },
      _sum: {
        total: true,
      },
    }),

    // Total Expenses recorded in the range
    prisma.expense.aggregate({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
    }),

    // Recent paid invoices in the selected range
    prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: "PAID",
      },
      take: 6,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const totalServices = servicesAgg._sum.quantity ?? 0;

  const totalInvoices = invoicesInRange.length;

  const totalCustomers = new Set(
    invoicesInRange.map((invoice) => invoice.customerId),
  ).size;

  const revenue = Number(revenueAgg._sum.total ?? 0);
  const totalExpenses = Number(expensesAgg._sum.amount ?? 0);

  const recentInvoices = recentInvoicesRaw.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customer.name,
    total: Number(invoice.total),
    status: invoice.status,
    createdAt: invoice.createdAt,
  }));

  return {
    totalServices,
    totalAppointments,
    totalCustomers,
    totalInvoices,
    revenue,
    totalExpenses,
    recentInvoices,
  };
}
