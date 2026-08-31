import { InvoiceStatus } from "@prisma/client";

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  DRAFT: "bg-gray-50 text-gray-600",
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

const InvoiceStatusBadge = ({ status }: { status: InvoiceStatus }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
  >
    {STATUS_LABELS[status]}
  </span>
);

export default InvoiceStatusBadge;
