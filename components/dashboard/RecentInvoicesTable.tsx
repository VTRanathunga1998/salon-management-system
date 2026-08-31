import Link from "next/link";
import { InvoiceStatus } from "@prisma/client";
import { Download, Eye } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { formatDateInSalonTz } from "@/lib/utils/timezone";
import ViewInvoiceButton from "./ViewInvoiceButton";

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
          Recent Paid Invoices
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
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="pb-2 pr-4 font-medium whitespace-nowrap">
                  Invoice
                </th>
                <th className="pb-2 pr-4 font-medium whitespace-nowrap">
                  Customer
                </th>
                <th className="pb-2 pr-4 font-medium whitespace-nowrap">
                  Total
                </th>
                <th className="pb-2 pr-4 font-medium whitespace-nowrap">
                  Status
                </th>
                <th className="pb-2 pr-4 font-medium whitespace-nowrap">
                  Date
                </th>
                <th className="pb-2 pr-4 font-medium whitespace-nowrap text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                >
                  <td className="py-3 pr-4 font-medium text-slate-700 whitespace-nowrap">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="py-3 pr-4 text-slate-600 whitespace-nowrap">
                    {invoice.customerName}
                  </td>
                  <td className="py-3 pr-4 text-slate-600 whitespace-nowrap">
                    AED {invoice.total.toFixed(2)}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">
                    {formatDateInSalonTz(invoice.createdAt)}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <ViewInvoiceButton invoiceId={invoice.id} />

                      <a
                        href={`/api/invoices/${invoice.id}/pdf?download=true`}
                        title="Download PDF"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentInvoicesTable;
