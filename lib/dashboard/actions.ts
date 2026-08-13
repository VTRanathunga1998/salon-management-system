import { prisma } from "@/lib/prisma";
import {
  AppointmentStatus,
  InvoiceStatus,
  PaymentStatus,
} from "@prisma/client";
import { getTodayRangeInSalonTz } from "../utils/timezone";

export async function getDashboardStats() {
  const { start, end } = getTodayRangeInSalonTz();

  const [
    totalServices,
    totalCustomers,
    todaysInvoices,
    todaysAppointments,
    todaysPayments,
    todaysExpenses,
    recentInvoicesRaw,
  ] = await Promise.all([
    // Active services
    prisma.service.count({
      where: {
        isActive: true,
      },
    }),

    // All customers
    prisma.customer.count(),

    // Invoices created today
    prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
        status: {
          not: InvoiceStatus.CANCELLED,
        },
      },
      select: {
        customerId: true,
      },
    }),

    // Actual appointments today
    prisma.appointment.count({
      where: {
        date: {
          gte: start,
          lt: end,
        },
        status: {
          not: AppointmentStatus.CANCELLED,
        },
      },
    }),

    // Money actually collected today
    prisma.payment.aggregate({
      where: {
        paidAt: {
          gte: start,
          lt: end,
        },
        status: PaymentStatus.COMPLETED,
      },
      _sum: {
        amount: true,
      },
    }),

    // Expenses recorded today
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

    // Recent invoices
    prisma.invoice.findMany({
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

  // Distinct customers who had invoices today
  const todaysCustomers = new Set(
    todaysInvoices.map((invoice) => invoice.customerId),
  ).size;

  // Revenue actually received today
  const todaysRevenue = Number(todaysPayments._sum.amount ?? 0);

  // Expenses recorded today
  const todaysExpense = Number(todaysExpenses._sum.amount ?? 0);

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
    totalCustomers,
    todaysCustomers,
    todaysAppointments,
    todaysRevenue,
    todaysExpense,
    recentInvoices,
  };
}
