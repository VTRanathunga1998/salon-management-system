// lib/reports/serviceReport.ts

import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@prisma/client";
import { startOfDayInSalonTz, endOfDayInSalonTz } from "@/lib/utils/timezone";

export type ServiceReportFilters = {
  search?: string;
  serviceId?: string;
  from?: string;
  to?: string;
};

export type ServiceReportEntry = {
  invoiceId: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;

  quantity: number;
  unitPrice: number;
  subtotal: number;

  employees: string[];
};

export type ServiceReportRow = {
  id: string;
  name: string;
  isActive: boolean;

  timesPerformed: number;
  totalQuantity: number;
  totalRevenue: number;

  entries: ServiceReportEntry[];
};

export type ServiceReportData = {
  summary: {
    totalServiceTypes: number;
    totalBookings: number;
    totalQuantity: number;
    totalRevenue: number;
  };

  services: ServiceReportRow[];
};

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

/**
 * Builds a full service report.
 *
 * - Revenue considers ALL non-draft / non-cancelled / non-refunded
 *   invoices, regardless of whether they've been paid yet (this
 *   intentionally mirrors the customer report's status filter).
 * - When `serviceId` is provided, results are scoped to that single
 *   service (used for the drill-down view). `search` is otherwise used
 *   to pre-filter which services show up in the aggregate list.
 */
export async function getServiceReport(
  filters: ServiceReportFilters = {},
): Promise<ServiceReportData> {
  const search = filters.search?.trim() || "";

  let fromDate: Date | undefined;
  let toDate: Date | undefined;

  if (filters.from) {
    fromDate = startOfDayInSalonTz(filters.from);
  }

  if (filters.to) {
    toDate = endOfDayInSalonTz(filters.to);
  }

  const items = await prisma.invoiceItem.findMany({
    where: {
      invoice: {
        /*
         * Draft/cancelled/refunded invoices are not considered
         * real service history — same rule as the customer report.
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
                ...(toDate ? { lte: toDate } : {}),
              },
            }
          : {}),
      },

      // Drill-down into one specific service.
      ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),

      // Otherwise, narrow the aggregate list by service name.
      service:
        search && !filters.serviceId
          ? {
              name: {
                contains: search,
                mode: "insensitive",
              },
            }
          : undefined,
    },

    include: {
      service: {
        select: { id: true, name: true, isActive: true },
      },

      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          createdAt: true,
          customer: {
            select: { name: true, phone: true },
          },
        },
      },

      employees: {
        include: {
          employee: {
            select: { id: true, name: true },
          },
        },
      },
    },

    orderBy: {
      invoice: { createdAt: "desc" },
    },
  });

  /*
   * Group invoice items by service.
   */
  const serviceMap = new Map<string, ServiceReportRow>();

  for (const item of items) {
    const serviceId = item.serviceId;

    if (!serviceMap.has(serviceId)) {
      serviceMap.set(serviceId, {
        id: serviceId,
        name: item.service.name,
        isActive: item.service.isActive,

        timesPerformed: 0,
        totalQuantity: 0,
        totalRevenue: 0,

        entries: [],
      });
    }

    const row = serviceMap.get(serviceId)!;

    const subtotal = toNumber(item.subtotal);

    row.timesPerformed += 1;
    row.totalQuantity += item.quantity;
    row.totalRevenue += subtotal;

    row.entries.push({
      invoiceId: item.invoice.id,
      invoiceNumber: item.invoice.invoiceNumber,
      date: item.invoice.createdAt.toISOString(),
      customerName: item.invoice.customer.name,
      customerPhone: item.invoice.customer.phone,

      quantity: item.quantity,
      unitPrice: toNumber(item.unitPrice),
      subtotal,

      employees: item.employees.map((assignment) => assignment.employee.name),
    });
  }

  /*
   * Sort highest revenue services first.
   */
  const services = Array.from(serviceMap.values()).sort(
    (a, b) => b.totalRevenue - a.totalRevenue,
  );

  const summary = services.reduce(
    (acc, service) => {
      acc.totalBookings += service.timesPerformed;
      acc.totalQuantity += service.totalQuantity;
      acc.totalRevenue += service.totalRevenue;
      return acc;
    },
    {
      totalServiceTypes: services.length,
      totalBookings: 0,
      totalQuantity: 0,
      totalRevenue: 0,
    },
  );

  return { summary, services };
}

/**
 * Lightweight list of all services, used to power the search
 * dropdown in the filter bar (independent of the active date range).
 */
export async function getAllServiceNames() {
  return prisma.service.findMany({
    select: { id: true, name: true, isActive: true },
    orderBy: { name: "asc" },
  });
}
