import Link from "next/link";
import { InvoiceStatus } from "@prisma/client";
import StatusBadge from "@/components/StatusBadge";

type RecentInvoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  total: number;
  status: InvoiceStatus;
  createdAt: Date;
};

const RecentInvoicesTable = ({ invoices }: { invoices: RecentInvoice[] }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Recent Invoices
        </h2>
        <Link
          href="/invoice"
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          View all
        </Link>
      </div>

      {invoices.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">
          No invoices yet.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="pb-2 font-medium">Invoice</th>
              <th className="pb-2 font-medium">Customer</th>
              <th className="pb-2 font-medium">Total</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
              >
                <td className="py-3 font-medium text-slate-700">
                  {invoice.invoiceNumber}
                </td>
                <td className="py-3 text-slate-600">{invoice.customerName}</td>
                <td className="py-3 text-slate-600">
                  AED {invoice.total.toFixed(2)}
                </td>
                <td className="py-3">
                  <StatusBadge status={invoice.status} />
                </td>
                <td className="py-3 text-slate-400">
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RecentInvoicesTable;
