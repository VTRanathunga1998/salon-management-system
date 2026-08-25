import { BUSINESS_INFO } from "@/lib/settings";
import { formatDateInSalonTz } from "@/lib/utils/timezone";

export interface InvoicePreviewItem {
  serviceName: string;
  employeeName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface InvoicePreviewProps {
  invoiceNumber?: string; 
  status?: string;
  date?: Date;
  customer: {
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
  };
  items: InvoicePreviewItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  amountPaid?: number;
  notes?: string | null;
}

const money = (n: number) => `AED ${n.toFixed(2)}`;

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600 ring-gray-200",
  ISSUED: "bg-yellow-100 text-yellow-700 ring-yellow-200",
  PARTIALLY_PAID: "bg-blue-100 text-blue-700 ring-blue-200",
  PAID: "bg-green-100 text-green-700 ring-green-200",
  CANCELLED: "bg-red-100 text-red-700 ring-red-200",
};

const InvoicePreview = ({
  invoiceNumber,
  status = "DRAFT",
  date = new Date(),
  customer,
  items,
  subtotal,
  discountTotal,
  taxTotal,
  total,
  amountPaid = 0,
  notes,
}: InvoicePreviewProps) => {
  const balanceDue = Math.max(total - amountPaid, 0);
  const isSettled = balanceDue === 0 && amountPaid > 0;

  return (
    <div
      id="invoice-print-area"
      className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden max-w-3xl mx-auto"
    >
      <style>{`
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: 100% !important;
            background: white !important;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide the rest of the application */
          body * {
            visibility: hidden !important;
          }

          /* Show invoice */
          #invoice-print-area,
          #invoice-print-area * {
            visibility: visible !important;
          }

          #invoice-print-area {
            position: relative !important;

            width: 100% !important;
            max-width: none !important;

            margin: 0 !important;

            /* Small actual invoice padding */
            padding: 8mm !important;

            box-sizing: border-box !important;

            background: white !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;

            overflow: visible !important;
          }

          /* Remove screen padding */
          #invoice-print-area .invoice-content {
            padding: 0 !important;
            margin: 0 !important;

            width: 100% !important;
            max-width: none !important;
          }

          /* Remove scrolling from table */
          #invoice-print-area .invoice-scroll-area {
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* Remove sticky table header */
          #invoice-print-area .invoice-table-head {
            position: static !important;
          }

          #invoice-print-area table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          #invoice-print-area thead {
            display: table-header-group !important;
          }

          #invoice-print-area tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          #invoice-print-area .invoice-section {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Accent header band */}
      <div className="h-1.5 bg-gradient-to-r from-[#93c5fd] via-[#C3EBFA] to-[#CFCEFF]" />

      <div className="invoice-content p-6 md:p-8">
        {/* Header */}
        <div className="invoice-section flex flex-col md:flex-row md:justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {BUSINESS_INFO.name}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {BUSINESS_INFO.address}
            </p>
            <p className="text-xs text-gray-500">
              {BUSINESS_INFO.phone} · {BUSINESS_INFO.email}
            </p>
          </div>
          <div className="text-left md:text-right">
            <h2 className="text-2xl font-black tracking-tight text-gray-800">
              INVOICE
            </h2>
            <p className="text-sm font-medium text-gray-600 mt-1">
              {invoiceNumber ?? (
                <span className="italic font-normal text-gray-400">
                  Draft — not yet saved
                </span>
              )}
            </p>
            <p className="text-xs text-gray-400">{formatDateInSalonTz(date)}</p>
            <span
              className={`inline-block mt-2 text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 ${statusStyles[status] ?? statusStyles.DRAFT}`}
            >
              {status.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Bill to + quick balance snapshot */}
        <div className="invoice-section flex flex-col sm:flex-row sm:justify-between gap-4 py-5">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Bill To
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {customer.name}
            </p>
            <p className="text-xs text-gray-500">{customer.phone}</p>
            {customer.email && (
              <p className="text-xs text-gray-500">{customer.email}</p>
            )}
            {customer.address && (
              <p className="text-xs text-gray-500">{customer.address}</p>
            )}
          </div>

          {/* {amountPaid > 0 && (
            <div
              className={`self-start sm:self-auto rounded-xl px-4 py-3 text-right ${
                isSettled ? "bg-green-50" : "bg-blue-50"
              }`}
            >
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                {isSettled ? "Status" : "Balance Due"}
              </p>
              <p
                className={`text-lg font-bold ${isSettled ? "text-green-700" : "text-blue-700"}`}
              >
                {isSettled ? "Settled" : money(balanceDue)}
              </p>
            </div>
          )} */}
        </div>

        {/* Items table — scrolls on screen for long invoices, prints in full */}
        <div className="rounded-xl ring-1 ring-gray-100 overflow-hidden">
          <div className="invoice-scroll-area max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="invoice-table-head sticky top-0 bg-gray-50 z-10">
                <tr className="text-[11px] text-gray-500 uppercase tracking-wide">
                  <th className="text-left font-semibold py-2.5 px-3">
                    Service
                  </th>
                  <th className="text-left font-semibold py-2.5 px-3">Staff</th>
                  <th className="text-center font-semibold py-2.5 px-3">Qty</th>
                  <th className="text-right font-semibold py-2.5 px-3">
                    Unit Price
                  </th>
                  <th className="text-right font-semibold py-2.5 px-3">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr
                    key={i}
                    className={`border-t border-gray-50 ${i % 2 === 1 ? "bg-gray-50/50" : ""}`}
                  >
                    <td className="py-2.5 px-3 text-gray-800 font-medium">
                      {item.serviceName}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500">
                      {item.employeeName}
                    </td>
                    <td className="py-2.5 px-3 text-center text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-500">
                      {money(item.unitPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-800 font-semibold">
                      {money(item.subtotal)}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-gray-400 text-sm"
                    >
                      No services added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="invoice-section flex justify-end pt-5">
          <div className="w-full max-w-xs flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Discount</span>
              <span>- {money(discountTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Tax</span>
              <span>+ {money(taxTotal)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-800 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
            {amountPaid > 0 && (
              <>
                <div className="flex justify-between text-green-600">
                  <span>Paid</span>
                  <span>{money(amountPaid)}</span>
                </div>
                <div
                  className={`flex justify-between font-bold px-3 py-2 rounded-md mt-1 ${
                    isSettled
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  <span>{isSettled ? "Fully Settled" : "Balance Due"}</span>
                  <span>{isSettled ? "✓" : money(balanceDue)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {notes && (
          <div className="invoice-section mt-6 pt-4 border-t border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Notes
            </p>
            <p className="text-sm text-gray-600">{notes}</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Thank you for visiting {BUSINESS_INFO.name}!
        </p>
      </div>
    </div>
  );
};

export default InvoicePreview;
