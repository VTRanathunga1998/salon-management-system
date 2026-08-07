import { prisma } from "@/lib/prisma";
import { InvoiceStatus, PaymentStatus } from "@prisma/client";

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function getDashboardStats() {
  const { start, end } = getTodayRange();

  const [
    totalServices,
    totalCustomers,
    todaysInvoices,
    todaysPayments,
    recentInvoicesRaw,
  ] = await Promise.all([
    prisma.service.count({ where: { isActive: true } }),
    prisma.customer.count(),
    // Invoices created today — used for both "today's appointments" (count)
    // and "today's customers" (distinct customerId), excluding cancellations.
    prisma.invoice.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        status: { not: InvoiceStatus.CANCELLED },
      },
      select: { customerId: true },
    }),
    // Revenue = money actually collected today, not invoice totals.
    prisma.payment.aggregate({
      where: {
        paidAt: { gte: start, lt: end },
        status: PaymentStatus.COMPLETED,
      },
      _sum: { amount: true },
    }),
    prisma.invoice.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } } },
    }),
  ]);

  const todaysAppointments = todaysInvoices.length;
  const todaysCustomers = new Set(todaysInvoices.map((i) => i.customerId)).size;
  const todaysRevenue = Number(todaysPayments._sum.amount ?? 0);

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
    recentInvoices,
  };
}
