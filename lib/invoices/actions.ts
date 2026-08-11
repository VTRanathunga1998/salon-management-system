"use server";

import { Prisma, DiscountType, InvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { InvoiceSchema } from "@/lib/formValidationsSchemas";
import { serializeData } from "../utils/serialize";

type CurrentState = {
  success: boolean;
  error: boolean;
  message?: string;
  invoice?: any;
};

async function getNextInvoiceNumber(tx: Prisma.TransactionClient) {
  const seriesKey = new Date().getFullYear().toString();
  const counter = await tx.invoiceCounter.upsert({
    where: { seriesKey },
    create: { seriesKey, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return `INV-${seriesKey}-${counter.lastNumber.toString().padStart(6, "0")}`;
}

// Replace the existing resolveItemsAndTotals function in lib/invoices/actions.ts
// with this version. Everything else in that file (createInvoice, updateInvoice,
// recordInvoicePayment, deleteInvoice, invoiceInclude) stays exactly as-is.

async function resolveItemsAndTotals(
  tx: Prisma.TransactionClient,
  items: InvoiceSchema["items"],
  discountType: DiscountType,
  discountValue: number,
  taxRate: number,
) {
  const serviceIds = [...new Set(items.map((i) => i.serviceId))];
  const services = await tx.service.findMany({
    where: { id: { in: serviceIds } },
  });
  const serviceMap = new Map(services.map((s) => [s.id, s]));

  const itemsData = items.map((item) => {
    const service = serviceMap.get(item.serviceId);
    if (!service)
      throw new Error("One of the selected services no longer exists.");

    // A custom price overrides the catalog price for this line only —
    // the catalog itself is untouched. Falls back to the service's
    // current price when no override was provided.
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
  // CHANGED: was `items: { include: { employee: true } } }`
  items: { include: { employees: { include: { employee: true } } } },
  payments: { where: { status: "COMPLETED" as const } },
};

export async function createInvoice(
  currentState: CurrentState,
  data: InvoiceSchema,
): Promise<CurrentState> {
  try {
    const invoice = await prisma.$transaction(async (tx) => {
      const { itemsData, subtotal, discountTotal, taxTotal, total } =
        await resolveItemsAndTotals(
          tx,
          data.items,
          data.discountType,
          data.discountValue,
          data.taxRate,
        );

      const invoiceNumber = await getNextInvoiceNumber(tx);

      return tx.invoice.create({
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
    });

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

      // Cancellation is its own path — don't touch items/totals at all.
      if (data.status === "CANCELLED") {
        return tx.invoice.update({
          where: { id: data.id },
          data: {
            status: InvoiceStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelReason: data.cancelReason || null,
          },
          include: invoiceInclude,
        });
      }

      const { itemsData, subtotal, discountTotal, taxTotal, total } =
        await resolveItemsAndTotals(
          tx,
          data.items,
          data.discountType,
          data.discountValue,
          data.taxRate,
        );

      // Replace items wholesale, then recompute status against what's
      // already been paid — adding services to a partially-paid invoice
      // can push it back from PARTIALLY_PAID to ISSUED-equivalent balance,
      // or a reduction could tip it over into fully PAID.
      // NOTE: deleteMany on InvoiceItem cascades to InvoiceItemEmployee too
      // (onDelete: Cascade on that relation), so no separate cleanup needed.
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
          // customerId intentionally omitted — locked once an invoice
          // exists, regardless of what the client sends. Enforced here,
          // not just in the UI, since the UI alone can't be trusted.
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
    });

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

      // Never record more than what's actually owed — the rest is change
      // handed back to the customer, not revenue. This keeps every report
      // that sums Payment.amount automatically correct, with no separate
      // "subtract overpayment" logic needed anywhere else.
      const amountDecimal = new Prisma.Decimal(amount);
      const appliedAmount = amountDecimal.gt(balanceDue)
        ? balanceDue
        : amountDecimal;
      changeGiven = Number(amountDecimal.sub(appliedAmount));

      await tx.payment.create({
        data: {
          invoiceId,
          amount: appliedAmount,
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
    });

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

// "use server";

// import { Prisma, DiscountType, InvoiceStatus } from "@prisma/client";
// import { prisma } from "@/lib/prisma";
// import { InvoiceSchema } from "@/lib/formValidationsSchemas";
// import { serializeData } from "../utils/serialize";

// type CurrentState = {
//   success: boolean;
//   error: boolean;
//   message?: string;
//   invoice?: any;
// };

// async function getNextInvoiceNumber(tx: Prisma.TransactionClient) {
//   const seriesKey = new Date().getFullYear().toString();
//   const counter = await tx.invoiceCounter.upsert({
//     where: { seriesKey },
//     create: { seriesKey, lastNumber: 1 },
//     update: { lastNumber: { increment: 1 } },
//   });
//   return `INV-${seriesKey}-${counter.lastNumber.toString().padStart(6, "0")}`;
// }

// async function resolveItemsAndTotals(
//   tx: Prisma.TransactionClient,
//   items: InvoiceSchema["items"],
//   discountType: DiscountType,
//   discountValue: number,
//   taxRate: number,
// ) {
//   const serviceIds = [...new Set(items.map((i) => i.serviceId))];
//   const services = await tx.service.findMany({
//     where: { id: { in: serviceIds } },
//   });
//   const serviceMap = new Map(services.map((s) => [s.id, s]));

//   const itemsData = items.map((item) => {
//     const service = serviceMap.get(item.serviceId);
//     if (!service)
//       throw new Error("One of the selected services no longer exists.");

//     const unitPrice = service.price;
//     const subtotal = unitPrice.mul(item.quantity);

//     return {
//       serviceId: item.serviceId,
//       serviceNameSnapshot: service.name,
//       quantity: item.quantity,
//       unitPrice,
//       subtotal,
//       // CHANGED: was `employeeId: item.employeeId` — now creates one join
//       // row per assigned staff member, no split/percentage involved.
//       employees: {
//         create: item.employeeIds.map((employeeId) => ({ employeeId })),
//       },
//     };
//   });

//   const subtotal = itemsData.reduce(
//     (sum, i) => sum.add(i.subtotal),
//     new Prisma.Decimal(0),
//   );

//   const discountTotal =
//     discountType === "PERCENTAGE"
//       ? subtotal.mul(discountValue).div(100)
//       : new Prisma.Decimal(discountValue);

//   const taxableAmount = subtotal.sub(discountTotal);
//   const taxTotal = taxableAmount.mul(taxRate).div(100);
//   const total = taxableAmount.add(taxTotal);

//   return { itemsData, subtotal, discountTotal, taxTotal, total };
// }

// const invoiceInclude = {
//   customer: true,
//   // CHANGED: was `items: { include: { employee: true } } }`
//   items: { include: { employees: { include: { employee: true } } } },
//   payments: { where: { status: "COMPLETED" as const } },
// };

// export async function createInvoice(
//   currentState: CurrentState,
//   data: InvoiceSchema,
// ): Promise<CurrentState> {
//   try {
//     const invoice = await prisma.$transaction(async (tx) => {
//       const { itemsData, subtotal, discountTotal, taxTotal, total } =
//         await resolveItemsAndTotals(
//           tx,
//           data.items,
//           data.discountType,
//           data.discountValue,
//           data.taxRate,
//         );

//       const invoiceNumber = await getNextInvoiceNumber(tx);

//       return tx.invoice.create({
//         data: {
//           invoiceNumber,
//           customerId: data.customerId,
//           status: InvoiceStatus.ISSUED,
//           subtotal,
//           discountType: data.discountType,
//           discountValue: data.discountValue,
//           discountTotal,
//           taxRate: data.taxRate,
//           taxTotal,
//           total,
//           notes: data.notes || null,
//           items: { create: itemsData },
//         },
//         include: invoiceInclude,
//       });
//     });

//     // No revalidatePath — the modal stays open for the payment/print/email
//     // step, and the client calls router.refresh() itself when the user
//     // clicks "Done". Revalidating early races with the resolved state.
//     return {
//       success: true,
//       error: false,
//       message: "Invoice created.",
//       invoice: serializeData(invoice),
//     };
//   } catch (err) {
//     console.error(err);
//     const message =
//       err instanceof Error ? err.message : "Failed to create invoice.";
//     return { success: false, error: true, message };
//   }
// }

// export async function updateInvoice(
//   currentState: CurrentState,
//   data: InvoiceSchema,
// ): Promise<CurrentState> {
//   if (!data.id)
//     return { success: false, error: true, message: "Missing invoice id." };

//   try {
//     const invoice = await prisma.$transaction(async (tx) => {
//       const existing = await tx.invoice.findUniqueOrThrow({
//         where: { id: data.id },
//       });

//       if (existing.status === "PAID") {
//         throw new Error(
//           "This invoice is fully paid and can't be edited. You can still print, download, or email it.",
//         );
//       }
//       if (existing.status === "CANCELLED") {
//         throw new Error("This invoice has been cancelled and can't be edited.");
//       }

//       // Cancellation is its own path — don't touch items/totals at all.
//       if (data.status === "CANCELLED") {
//         return tx.invoice.update({
//           where: { id: data.id },
//           data: {
//             status: InvoiceStatus.CANCELLED,
//             cancelledAt: new Date(),
//             cancelReason: data.cancelReason || null,
//           },
//           include: invoiceInclude,
//         });
//       }

//       const { itemsData, subtotal, discountTotal, taxTotal, total } =
//         await resolveItemsAndTotals(
//           tx,
//           data.items,
//           data.discountType,
//           data.discountValue,
//           data.taxRate,
//         );

//       // Replace items wholesale, then recompute status against what's
//       // already been paid — adding services to a partially-paid invoice
//       // can push it back from PARTIALLY_PAID to ISSUED-equivalent balance,
//       // or a reduction could tip it over into fully PAID.
//       // NOTE: deleteMany on InvoiceItem cascades to InvoiceItemEmployee too
//       // (onDelete: Cascade on that relation), so no separate cleanup needed.
//       await tx.invoiceItem.deleteMany({ where: { invoiceId: data.id } });

//       const paidAgg = await tx.payment.aggregate({
//         where: { invoiceId: data.id, status: "COMPLETED" },
//         _sum: { amount: true },
//       });
//       const paidSoFar = paidAgg._sum.amount ?? new Prisma.Decimal(0);

//       const newStatus = paidSoFar.gte(total)
//         ? InvoiceStatus.PAID
//         : paidSoFar.gt(0)
//           ? InvoiceStatus.PARTIALLY_PAID
//           : InvoiceStatus.ISSUED;

//       return tx.invoice.update({
//         where: { id: data.id },
//         data: {
//           // customerId intentionally omitted — locked once an invoice
//           // exists, regardless of what the client sends. Enforced here,
//           // not just in the UI, since the UI alone can't be trusted.
//           subtotal,
//           discountType: data.discountType,
//           discountValue: data.discountValue,
//           discountTotal,
//           taxRate: data.taxRate,
//           taxTotal,
//           total,
//           notes: data.notes || null,
//           status: newStatus,
//           items: { create: itemsData },
//         },
//         include: invoiceInclude,
//       });
//     });

//     return {
//       success: true,
//       error: false,
//       message: "Invoice updated.",
//       invoice: serializeData(invoice),
//     };
//   } catch (err) {
//     console.error(err);
//     const message =
//       err instanceof Error ? err.message : "Failed to update invoice.";
//     return { success: false, error: true, message };
//   }
// }

// export async function recordInvoicePayment(
//   invoiceId: string,
//   amount: number,
//   method: "CASH" | "CARD" | "BANK_TRANSFER",
// ): Promise<{ success: boolean; message?: string; invoice?: any; change?: number }> {
//   try {
//     if (amount <= 0) {
//       return {
//         success: false,
//         message: "Payment amount must be greater than zero.",
//       };
//     }

//     let changeGiven = 0;

//     const invoice = await prisma.$transaction(async (tx) => {
//       const current = await tx.invoice.findUniqueOrThrow({
//         where: { id: invoiceId },
//         include: { payments: { where: { status: "COMPLETED" } } },
//       });

//       if (current.status === "CANCELLED") {
//         throw new Error("Cannot record a payment on a cancelled invoice.");
//       }

//       const alreadyPaid = current.payments.reduce(
//         (sum, p) => sum.add(p.amount),
//         new Prisma.Decimal(0),
//       );
//       const rawBalanceDue = current.total.sub(alreadyPaid);
//       const balanceDue = rawBalanceDue.isNegative()
//         ? new Prisma.Decimal(0)
//         : rawBalanceDue;

//       if (balanceDue.lte(0)) {
//         throw new Error("This invoice has no remaining balance.");
//       }

//       // Never record more than what's actually owed — the rest is change
//       // handed back to the customer, not revenue. This keeps every report
//       // that sums Payment.amount automatically correct, with no separate
//       // "subtract overpayment" logic needed anywhere else.
//       const amountDecimal = new Prisma.Decimal(amount);
//       const appliedAmount = amountDecimal.gt(balanceDue)
//         ? balanceDue
//         : amountDecimal;
//       changeGiven = Number(amountDecimal.sub(appliedAmount));

//       await tx.payment.create({
//         data: {
//           invoiceId,
//           amount: appliedAmount,
//           method,
//           status: "COMPLETED",
//         },
//       });

//       const totalPaid = alreadyPaid.add(appliedAmount);
//       const newStatus = totalPaid.gte(current.total)
//         ? InvoiceStatus.PAID
//         : InvoiceStatus.PARTIALLY_PAID;

//       return tx.invoice.update({
//         where: { id: invoiceId },
//         data: { status: newStatus },
//         include: invoiceInclude,
//       });
//     });

//     return {
//       success: true,
//       invoice: serializeData(invoice),
//       change: changeGiven,
//     };
//   } catch (err) {
//     console.error(err);
//     const message =
//       err instanceof Error ? err.message : "Failed to record payment.";
//     return { success: false, message };
//   }
// }

// export async function deleteInvoice(
//   currentState: CurrentState,
//   formData: FormData,
// ): Promise<CurrentState> {
//   const id = formData.get("id") as string;

//   try {
//     const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id } });

//     if (invoice.status === "PAID" || invoice.status === "PARTIALLY_PAID") {
//       return {
//         success: false,
//         error: true,
//         message:
//           "Paid invoices can't be deleted — cancel or refund them instead.",
//       };
//     }

//     await prisma.invoice.delete({ where: { id } });

//     return { success: true, error: false, message: "Invoice deleted." };
//   } catch (err) {
//     console.error(err);
//     return {
//       success: false,
//       error: true,
//       message: "Failed to delete invoice.",
//     };
//   }
// }
