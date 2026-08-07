import { InvoiceStatus } from "@prisma/client";

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  ISSUED: "bg-blue-50 text-blue-600",
  PARTIALLY_PAID: "bg-amber-50 text-amber-600",
  PAID: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-600",
  REFUNDED: "bg-purple-50 text-purple-600",
};

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const StatusBadge = ({ status }: { status: InvoiceStatus }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
  >
    {STATUS_LABELS[status]}
  </span>
);

export default StatusBadge;
