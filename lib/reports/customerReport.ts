// lib/reports/customerReport.ts

import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@prisma/client";

export type CustomerReportFilters = {
  search?: string;
  from?: string;
  to?: string;
};

export type CustomerReportData = {
  summary: {
    totalCustomers: number;
    totalInvoices: number;
    totalBilled: number;
    totalPaid: number;
    totalOutstanding: number;
  };

  customers: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;

    totalBilled: number;
    totalPaid: number;
    outstanding: number;
    invoiceCount: number;

    invoices: {
      id: string;
      invoiceNumber: string;
      date: string;
      status: string;

      subtotal: number;
      discount: number;
      tax: number;
      total: number;
      paid: number;
      balance: number;

      items: {
        serviceName: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
        employees: string[];
      }[];
    }[];
  }[];
};

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

/**
 * Converts YYYY-MM-DD to the beginning of that day
 * in the configured salon timezone.
 *
 * Example:
 * 2026-08-21
 * -> 2026-08-20T20:00:00.000Z for Dubai (+04:00)
 */
function startOfSalonDay(dateString: string): Date {
  return new Date(`${dateString}T00:00:00+04:00`);
}

/**
 * Converts YYYY-MM-DD to the beginning of the NEXT day.
 */
function endOfSalonDay(dateString: string): Date {
  const date = new Date(`${dateString}T00:00:00+04:00`);

  date.setUTCDate(date.getUTCDate() + 1);

  return date;
}

export async function getCustomerReport(
  filters: CustomerReportFilters = {},
): Promise<CustomerReportData> {
  const search = filters.search?.trim() || "";

  let fromDate: Date | undefined;
  let toDate: Date | undefined;

  /*
   * Date filtering
   */
  if (filters.from) {
    fromDate = startOfSalonDay(filters.from);
  }

  if (filters.to) {
    toDate = endOfSalonDay(filters.to);
  }

  /*
   * If no date filter is provided,
   * show all historical invoice data.
   */
  const invoices = await prisma.invoice.findMany({
    where: {
      /*
       * Draft/cancelled/refunded invoices are not considered
       * customer revenue history.
       */
      status: {
        in: [
          InvoiceStatus.ISSUED,
          InvoiceStatus.PARTIALLY_PAID,
          InvoiceStatus.PAID,
        ],
      },

      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lt: toDate } : {}),
            },
          }
        : {}),

      customer: search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                phone: {
                  contains: search,
                },
              },
            ],
          }
        : undefined,
    },

    include: {
      customer: true,

      items: {
        include: {
          employees: {
            include: {
              employee: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },

      payments: {
        where: {
          status: "COMPLETED",
        },
        select: {
          amount: true,
          paidAt: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  /*
   * Group invoices by customer.
   */
  const customerMap = new Map<
    string,
    CustomerReportData["customers"][number]
  >();

  for (const invoice of invoices) {
    const customerId = invoice.customer.id;

    if (!customerMap.has(customerId)) {
      customerMap.set(customerId, {
        id: customerId,
        name: invoice.customer.name,
        phone: invoice.customer.phone,
        email: invoice.customer.email,
        address: invoice.customer.address,

        totalBilled: 0,
        totalPaid: 0,
        outstanding: 0,
        invoiceCount: 0,

        invoices: [],
      });
    }

    const customer = customerMap.get(customerId)!;

    const total = toNumber(invoice.total);

    const paid = invoice.payments.reduce(
      (sum, payment) => sum + toNumber(payment.amount),
      0,
    );

    const balance = Math.max(total - paid, 0);

    customer.totalBilled += total;
    customer.totalPaid += paid;
    customer.outstanding += balance;
    customer.invoiceCount += 1;

    customer.invoices.push({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,

      date: invoice.createdAt.toISOString(),

      status: invoice.status,

      subtotal: toNumber(invoice.subtotal),
      discount: toNumber(invoice.discountTotal),
      tax: toNumber(invoice.taxTotal),
      total,

      paid,
      balance,

      items: invoice.items.map((item) => ({
        serviceName: item.serviceNameSnapshot,
        quantity: item.quantity,
        unitPrice: toNumber(item.unitPrice),
        subtotal: toNumber(item.subtotal),

        employees: item.employees.map((assignment) => assignment.employee.name),
      })),
    });
  }

  const customers = Array.from(customerMap.values());

  /*
   * Sort highest revenue customers first.
   */
  customers.sort((a, b) => b.totalBilled - a.totalBilled);

  const summary = customers.reduce(
    (acc, customer) => {
      acc.totalBilled += customer.totalBilled;
      acc.totalPaid += customer.totalPaid;
      acc.totalOutstanding += customer.outstanding;
      acc.totalInvoices += customer.invoiceCount;

      return acc;
    },
    {
      totalCustomers: customers.length,
      totalInvoices: 0,
      totalBilled: 0,
      totalPaid: 0,
      totalOutstanding: 0,
    },
  );

  return {
    summary,
    customers,
  };
}
