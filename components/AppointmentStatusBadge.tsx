import { AppointmentStatus } from "@prisma/client";

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  PENDING: "bg-amber-50 text-amber-600",
  CONFIRMED: "bg-blue-50 text-blue-600",
  CANCELLED: "bg-red-50 text-red-600",
  COMPLETED: "bg-green-50 text-green-700",
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

const AppointmentStatusBadge = ({ status }: { status: AppointmentStatus }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
  >
    {STATUS_LABELS[status]}
  </span>
);

export default AppointmentStatusBadge;