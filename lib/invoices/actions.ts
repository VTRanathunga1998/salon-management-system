"use server";

import { Prisma, DiscountType, InvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { InvoiceSchema } from "@/lib/formValidationsSchemas";
import { serializeData } from "../utils/serialize";
import { todayInSalonTz } from "../utils/timezone";

type CurrentState = {
  success: boolean;
  error: boolean;
  message?: string;
  invoice?: any;
};

const TX_OPTS = { maxWait: 10000, timeout: 15000 };

async function getNextInvoiceNumber(tx: Prisma.TransactionClient) {
  const seriesKey = todayInSalonTz().slice(0, 4);
  const counter = await tx.invoiceCounter.upsert({
    where: { seriesKey },
    create: { seriesKey, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return `INV-${seriesKey}-${counter.lastNumber.toString().padStart(6, "0")}`;
}

async function computeItemsAndTotals(
  items: InvoiceSchema["items"],
  discountType: DiscountType,
  discountValue: number,
  taxRate: number,
) {
  const serviceIds = [...new Set(items.map((i) => i.serviceId))];
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
  });
  const serviceMap = new Map(services.map((s) => [s.id, s]));

  const itemsData = items.map((item) => {
    const service = serviceMap.get(item.serviceId);
    if (!service)
      throw new Error("One of the selected services no longer exists.");

    const unitPrice =
      item.customPrice !== undefined && item.customPrice !== null
        ? new Prisma.Decimal(item.customPrice)
        : service.price;

    const subtotal = unitPrice.mul(item.quantity);

    return {
      serviceId: item.serviceId,
      serviceNameSnapshot: service.name,
      quantity: item.quantity,
      unitPrice,
      subtotal,
      employees: {
        create: item.employeeIds.map((employeeId) => ({ employeeId })),
      },
    };
  });

  const subtotal = itemsData.reduce(
    (sum, i) => sum.add(i.subtotal),
    new Prisma.Decimal(0),
  );

  const discountTotal =
    discountType === "PERCENTAGE"
      ? subtotal.mul(discountValue).div(100)
      : new Prisma.Decimal(discountValue);

  const taxableAmount = subtotal.sub(discountTotal);
  const taxTotal = taxableAmount.mul(taxRate).div(100);
  const total = taxableAmount.add(taxTotal);

  return { itemsData, subtotal, discountTotal, taxTotal, total };
}

const invoiceInclude = {
  customer: true,
  items: { include: { employees: { include: { employee: true } } } },
  payments: { where: { status: "COMPLETED" as const } },
  dueCollections: true,
};

export async function createInvoice(
  currentState: CurrentState,
  data: InvoiceSchema,
): Promise<CurrentState> {
  try {
    const { itemsData, subtotal, discountTotal, taxTotal, total } =
      await computeItemsAndTotals(
        data.items,
        data.discountType,
        data.discountValue,
        data.taxRate,
      );

    const invoice = await prisma.$transaction(async (tx) => {
      const invoiceNumber = await getNextInvoiceNumber(tx);

      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: data.customerId,
          status: InvoiceStatus.ISSUED,
          subtotal,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountTotal,
          taxRate: data.taxRate,
          taxTotal,
          total,
          notes: data.notes || null,
          items: { create: itemsData },
        },
        include: invoiceInclude,
      });

      if (data.appointmentId) {
        const appt = await tx.appointment.findUniqueOrThrow({
          where: { id: data.appointmentId },
        });
        if (appt.status === "CANCELLED") {
          throw new Error("Can't invoice a cancelled appointment.");
        }
        await tx.appointment.update({
          where: { id: data.appointmentId },
          data: { status: "COMPLETED" },
        });
      }

      return created;
    }, TX_OPTS);

    return {
      success: true,
      error: false,
      message: "Invoice created.",
      invoice: serializeData(invoice),
    };
  } catch (err) {
    console.error(err);
    const message =
      err instanceof Error ? err.message : "Failed to create invoice.";
    return { success: false, error: true, message };
  }
}

export async function updateInvoice(
  currentState: CurrentState,
  data: InvoiceSchema,
): Promise<CurrentState> {
  if (!data.id)
    return { success: false, error: true, message: "Missing invoice id." };

  try {
    const precheck = await prisma.invoice.findUniqueOrThrow({
      where: { id: data.id },
    });
    if (precheck.status === "PAID") {
      throw new Error(
        "This invoice is fully paid and can't be edited. You can still print, download, or email it.",
      );
    }
    if (precheck.status === "CANCELLED") {
      throw new Error("This invoice has been cancelled and can't be edited.");
    }

    // Cancellation path — single write, no need for items/totals at all.
    if (data.status === "CANCELLED") {
      const invoice = await prisma.invoice.update({
        where: { id: data.id },
        data: {
          status: InvoiceStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: data.cancelReason || null,
        },
        include: invoiceInclude,
      });

      return {
        success: true,
        error: false,
        message: "Invoice updated.",
        invoice: serializeData(invoice),
      };
    }

    const { itemsData, subtotal, discountTotal, taxTotal, total } =
      await computeItemsAndTotals(
        data.items,
        data.discountType,
        data.discountValue,
        data.taxRate,
      );

    const invoice = await prisma.$transaction(async (tx) => {
      const existing = await tx.invoice.findUniqueOrThrow({
        where: { id: data.id },
      });
      if (existing.status === "PAID") {
        throw new Error(
          "This invoice is fully paid and can't be edited. You can still print, download, or email it.",
        );
      }
      if (existing.status === "CANCELLED") {
        throw new Error("This invoice has been cancelled and can't be edited.");
      }

      await tx.invoiceItem.deleteMany({ where: { invoiceId: data.id } });

      const paidAgg = await tx.payment.aggregate({
        where: { invoiceId: data.id, status: "COMPLETED" },
        _sum: { amount: true },
      });
      const paidSoFar = paidAgg._sum.amount ?? new Prisma.Decimal(0);

      const newStatus = paidSoFar.gte(total)
        ? InvoiceStatus.PAID
        : paidSoFar.gt(0)
          ? InvoiceStatus.PARTIALLY_PAID
          : InvoiceStatus.ISSUED;

      return tx.invoice.update({
        where: { id: data.id },
        data: {
          subtotal,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountTotal,
          taxRate: data.taxRate,
          taxTotal,
          total,
          notes: data.notes || null,
          status: newStatus,
          items: { create: itemsData },
        },
        include: invoiceInclude,
      });
    }, TX_OPTS);

    return {
      success: true,
      error: false,
      message: "Invoice updated.",
      invoice: serializeData(invoice),
    };
  } catch (err) {
    console.error(err);
    const message =
      err instanceof Error ? err.message : "Failed to update invoice.";
    return { success: false, error: true, message };
  }
}

export async function recordInvoicePayment(
  invoiceId: string,
  amount: number,
  method: "CASH" | "CARD" | "BANK_TRANSFER",
): Promise<{
  success: boolean;
  message?: string;
  invoice?: any;
  change?: number;
}> {
  try {
    if (amount <= 0) {
      return {
        success: false,
        message: "Payment amount must be greater than zero.",
      };
    }

    let changeGiven = 0;

    const invoice = await prisma.$transaction(async (tx) => {
      const current = await tx.invoice.findUniqueOrThrow({
        where: { id: invoiceId },
        include: { payments: { where: { status: "COMPLETED" } } },
      });

      if (current.status === "CANCELLED") {
        throw new Error("Cannot record a payment on a cancelled invoice.");
      }

      const alreadyPaid = current.payments.reduce(
        (sum, p) => sum.add(p.amount),
        new Prisma.Decimal(0),
      );
      const rawBalanceDue = current.total.sub(alreadyPaid);
      const balanceDue = rawBalanceDue.isNegative()
        ? new Prisma.Decimal(0)
        : rawBalanceDue;

      if (balanceDue.lte(0)) {
        throw new Error("This invoice has no remaining balance.");
      }

      // Partial payments are allowed: whatever is tendered, up to the
      // balance due, gets applied. Anything tendered beyond the balance
      // due is change handed back to the customer, not revenue.
      const tenderedDecimal = new Prisma.Decimal(amount);
      const appliedAmount = tenderedDecimal.gt(balanceDue)
        ? balanceDue
        : tenderedDecimal;
      changeGiven = Number(tenderedDecimal.sub(appliedAmount));

      await tx.payment.create({
        data: {
          invoiceId,
          amount: appliedAmount,
          amountTendered: tenderedDecimal,
          changeGiven,
          method,
          status: "COMPLETED",
        },
      });

      const totalPaid = alreadyPaid.add(appliedAmount);
      const newStatus = totalPaid.gte(current.total)
        ? InvoiceStatus.PAID
        : InvoiceStatus.PARTIALLY_PAID;

      return tx.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus },
        include: invoiceInclude,
      });
    }, TX_OPTS);

    return {
      success: true,
      invoice: serializeData(invoice),
      change: changeGiven,
    };
  } catch (err) {
    console.error(err);
    const message =
      err instanceof Error ? err.message : "Failed to record payment.";
    return { success: false, message };
  }
}

export async function deleteInvoice(
  currentState: CurrentState,
  formData: FormData,
): Promise<CurrentState> {
  const id = formData.get("id") as string;

  try {
    const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id } });

    if (invoice.status === "PAID" || invoice.status === "PARTIALLY_PAID") {
      return {
        success: false,
        error: true,
        message:
          "Paid invoices can't be deleted — cancel or refund them instead.",
      };
    }

    await prisma.invoice.delete({ where: { id } });

    return { success: true, error: false, message: "Invoice deleted." };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      error: true,
      message: "Failed to delete invoice.",
    };
  }
}

export async function refundInvoice(invoiceId: string, reason: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    return { success: false, message: "Invoice not found." };
  }

  if (invoice.status !== "PAID") {
    return {
      success: false,
      message: "Only fully paid invoices can be refunded.",
    };
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.refund.create({
      data: {
        invoiceId,
        amount: invoice.total,
        reason: reason || null,
        // createdById: currentUserId,
      },
    });

    await tx.payment.updateMany({
      where: { invoiceId, status: "COMPLETED" },
      data: { status: "REFUNDED" },
    });

    return tx.invoice.update({
      where: { id: invoiceId },
      data: { status: "REFUNDED" },
      include: {
        customer: true,
        payments: true,
        items: {
          include: {
            employees: {
              include: {
                employee: true,
              },
            },
          },
        },
      },
    });
  }, TX_OPTS);

  return {
    success: true,
    invoice: serializeData(updated),
    message: `Invoice ${updated.invoiceNumber} refunded.`,
  };
}

export async function getCustomerOutstandingInvoices(
  customerId: string,
  excludeInvoiceId?: string,
) {
  const invoices = await prisma.invoice.findMany({
    where: {
      customerId,
      status: { in: ["ISSUED", "PARTIALLY_PAID"] },
      ...(excludeInvoiceId ? { id: { not: excludeInvoiceId } } : {}),
    },
    include: {
      payments: { where: { status: "COMPLETED" } },
    },
    orderBy: { createdAt: "asc" },
  });

  return invoices
    .map((inv) => {
      const paid = inv.payments.reduce(
        (sum, p) => sum.add(p.amount),
        new Prisma.Decimal(0),
      );
      const balanceDue = Number(inv.total.sub(paid));
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        createdAt: inv.createdAt.toISOString(),
        balanceDue,
      };
    })
    .filter((inv) => inv.balanceDue > 0);
}

export async function recordInvoicePaymentWithDue(
  currentInvoiceId: string,
  dueInvoiceIds: string[],
  amount: number,
  method: "CASH" | "CARD" | "BANK_TRANSFER",
): Promise<{
  success: boolean;
  message?: string;
  invoice?: any;
  change?: number;
  settledDueInvoices?: {
    id: string;
    invoiceNumber: string;
    amountApplied: number;
    status: "PAID" | "PARTIALLY_PAID";
  }[];
}> {
  try {
    if (amount <= 0) {
      return {
        success: false,
        message: "Payment amount must be greater than zero.",
      };
    }

    let changeGiven = 0;
    const settled: {
      id: string;
      invoiceNumber: string;
      amountApplied: number;
      status: "PAID" | "PARTIALLY_PAID";
    }[] = [];

    const currentInvoice = await prisma.$transaction(async (tx) => {
      const dueInvoicesRaw = dueInvoiceIds.length
        ? await tx.invoice.findMany({
            where: { id: { in: dueInvoiceIds } },
            include: { payments: { where: { status: "COMPLETED" } } },
            orderBy: { createdAt: "asc" },
          })
        : [];

      let remaining = new Prisma.Decimal(amount);

      for (const due of dueInvoicesRaw) {
        if (remaining.lte(0)) break;
        if (
          due.status === "CANCELLED" ||
          due.status === "REFUNDED" ||
          due.status === "PAID"
        ) {
          continue;
        }

        const alreadyPaid = due.payments.reduce(
          (sum, p) => sum.add(p.amount),
          new Prisma.Decimal(0),
        );
        const rawBalance = due.total.sub(alreadyPaid);
        const balance = rawBalance.isNegative()
          ? new Prisma.Decimal(0)
          : rawBalance;
        if (balance.lte(0)) continue;

        const applied = remaining.gt(balance) ? balance : remaining;

        await tx.payment.create({
          data: {
            invoiceId: due.id,
            amount: applied,
            amountTendered: applied,
            changeGiven: 0,
            method,
            status: "COMPLETED",
          },
        });

        const newTotalPaid = alreadyPaid.add(applied);
        const newStatus = newTotalPaid.gte(due.total)
          ? InvoiceStatus.PAID
          : InvoiceStatus.PARTIALLY_PAID;

        await tx.invoice.update({
          where: { id: due.id },
          data: { status: newStatus },
        });

        settled.push({
          id: due.id,
          invoiceNumber: due.invoiceNumber,
          amountApplied: Number(applied),
          status: newStatus === InvoiceStatus.PAID ? "PAID" : "PARTIALLY_PAID",
        });

        remaining = remaining.sub(applied);
      }

      const current = await tx.invoice.findUniqueOrThrow({
        where: { id: currentInvoiceId },
        include: { payments: { where: { status: "COMPLETED" } } },
      });

      if (current.status === "CANCELLED") {
        throw new Error("Cannot record a payment on a cancelled invoice.");
      }

      const currentAlreadyPaid = current.payments.reduce(
        (sum, p) => sum.add(p.amount),
        new Prisma.Decimal(0),
      );
      const currentRawBalance = current.total.sub(currentAlreadyPaid);
      const currentBalance = currentRawBalance.isNegative()
        ? new Prisma.Decimal(0)
        : currentRawBalance;

      if (remaining.gt(0) && currentBalance.gt(0)) {
        const appliedToCurrent = remaining.gt(currentBalance)
          ? currentBalance
          : remaining;
        changeGiven = Number(remaining.sub(appliedToCurrent));

        await tx.payment.create({
          data: {
            invoiceId: currentInvoiceId,
            amount: appliedToCurrent,
            amountTendered: remaining,
            changeGiven,
            method,
            status: "COMPLETED",
          },
        });

        const newCurrentPaid = currentAlreadyPaid.add(appliedToCurrent);
        const newCurrentStatus = newCurrentPaid.gte(current.total)
          ? InvoiceStatus.PAID
          : InvoiceStatus.PARTIALLY_PAID;

        await tx.invoice.update({
          where: { id: currentInvoiceId },
          data: { status: newCurrentStatus },
        });
      } else if (remaining.gt(0)) {
        changeGiven = Number(remaining);
      }

      for (const s of settled) {
        await tx.invoiceDueCollection.create({
          data: {
            collectingInvoiceId: currentInvoiceId,
            sourceInvoiceId: s.id,
            sourceInvoiceNumber: s.invoiceNumber,
            amount: new Prisma.Decimal(s.amountApplied),
            method,
          },
        });
      }

      return tx.invoice.findUniqueOrThrow({
        where: { id: currentInvoiceId },
        include: invoiceInclude,
      });
    }, TX_OPTS);

    return {
      success: true,
      invoice: serializeData(currentInvoice),
      change: changeGiven,
      settledDueInvoices: settled,
    };
  } catch (err) {
    console.error(err);
    const message =
      err instanceof Error ? err.message : "Failed to record payment.";
    return { success: false, message };
  }
}

export async function getInvoiceById(id: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: invoiceInclude,
    });

    if (!invoice) {
      return { success: false, message: "Invoice not found." };
    }

    return { success: true, invoice: serializeData(invoice) };
  } catch (err) {
    console.error("[getInvoiceById]", err);
    return { success: false, message: "Failed to load invoice." };
  }
}
