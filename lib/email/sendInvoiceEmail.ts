"use server";

import React from "react";
import nodemailer from "nodemailer";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import InvoicePdfDocument from "@/lib/pdf/InvoicePdfDocument";
import { BUSINESS_INFO } from "@/lib/constants/business";

type Result = { success: boolean; message?: string };

// Requires these env vars to be set (SMTP example — swap for Resend/SendGrid if you prefer):
// SMTP_HOST, SMTP_PORT, SMTP_SECURE ("true"/"false"), SMTP_USER, SMTP_PASS, SMTP_FROM
export async function sendInvoiceEmail(
  invoiceId: string,
  toEmail: string,
): Promise<Result> {
  const email = toEmail?.trim();
  if (!email) return { success: false, message: "Email address is required." };

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      items: { include: { employee: true } },
      payments: { where: { status: "COMPLETED" } },
    },
  });
  if (!invoice) return { success: false, message: "Invoice not found." };

  try {
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
          payments: invoice.payments.map((p) => ({ amount: Number(p.amount) })),
        },
      }) as React.ReactElement<DocumentProps>,
    );

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: email,
      subject: `Invoice ${invoice.invoiceNumber} from ${BUSINESS_INFO.name}`,
      text: `Hi ${invoice.customer.name},\n\nPlease find attached your invoice ${invoice.invoiceNumber} for Rs. ${Number(invoice.total).toFixed(2)}.\n\nThank you for visiting us!\n\n${BUSINESS_INFO.name}`,
      attachments: [
        { filename: `${invoice.invoiceNumber}.pdf`, content: pdfBuffer },
      ],
    });

    return { success: true, message: "Invoice emailed successfully." };
  } catch (err) {
    console.warn(err);
    return { success: false, message: "Failed to send email." };
  }
}
