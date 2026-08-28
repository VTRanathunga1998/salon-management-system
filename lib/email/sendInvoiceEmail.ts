"use server";

import React from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import InvoicePdfDocument from "@/lib/invoices/InvoicePdfDocument";
import { invoiceEmailTemplate } from "@/lib/email/templates/invoice-email";
import { BUSINESS_INFO } from "@/lib/settings";
import { mailer } from "./mailer";

type Result = {
  success: boolean;
  message?: string;
};

export async function sendInvoiceEmail(
  invoiceId: string,
  toEmail: string,
): Promise<Result> {
  const email = toEmail?.trim();

  if (!email) {
    return {
      success: false,
      message: "Email address is required.",
    };
  }
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,

        items: {
          include: {
            employees: {
              include: {
                employee: true,
              },
            },
          },
        },

        payments: {
          where: {
            status: "COMPLETED",
          },
        },
      },
    });

    if (!invoice) {
      return {
        success: false,
        message: "Invoice not found.",
      };
    }

    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoicePdfDocument, {
        invoice: {
          ...invoice,

          subtotal: Number(invoice.subtotal),
          discountTotal: Number(invoice.discountTotal),
          taxTotal: Number(invoice.taxTotal),
          total: Number(invoice.total),

          items: invoice.items.map((item) => ({
            ...item,
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.subtotal),
          })),

          payments: invoice.payments.map((payment) => ({
            amount: Number(payment.amount),
          })),
        },
      }) as React.ReactElement<DocumentProps>,
    );

    const html = invoiceEmailTemplate({
      customerName: invoice.customer.name,
      invoiceNumber: invoice.invoiceNumber,
      total: Number(invoice.total),
    });

    await mailer.sendMail({
      from: {
        name: BUSINESS_INFO.name,
        address: process.env.SMTP_USER!,
      },

      to: email,

      subject: `Invoice ${invoice.invoiceNumber} — ${BUSINESS_INFO.name}`,

      html,

      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return {
      success: true,
      message: "Invoice emailed successfully.",
    };
  } catch (error) {
    console.error("[sendInvoiceEmail]", error);
    return { success: false, message: "Failed to send invoice email." };
  }
}
