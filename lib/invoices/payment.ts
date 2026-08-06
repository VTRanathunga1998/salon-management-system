export function getPaymentSummary(invoice: {
  total: number | string;
  payments: { amount: number | string; status: string }[];
}) {
  const total = Number(invoice.total);
  const amountPaid = invoice.payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const balanceDue = Math.max(total - amountPaid, 0);
  return { total, amountPaid, balanceDue };
}
