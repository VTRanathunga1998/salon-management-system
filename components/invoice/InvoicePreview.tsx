import { BUSINESS_INFO } from "@/lib/constants/business";

export interface InvoicePreviewItem {
  serviceName: string;
  employeeName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface InvoicePreviewProps {
  invoiceNumber?: string; // undefined while still a draft, before creation
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

const money = (n: number) => `Rs. ${n.toFixed(2)}`;

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  ISSUED: "bg-yellow-100 text-yellow-700",
  PARTIALLY_PAID: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
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
  const balanceDue = total - amountPaid;

  return (
    <div
      id="invoice-print-area"
      className="bg-white rounded-lg ring-[1.5px] ring-gray-100 p-6 md:p-8 max-w-3xl mx-auto"
    >
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print-area, #invoice-print-area * { visibility: visible; }
          #invoice-print-area {
            position: absolute; left: 0; top: 0; width: 100%;
            box-shadow: none; border: none; padding: 0;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {BUSINESS_INFO.name}
          </h1>
          <p className="text-xs text-gray-500 mt-1">{BUSINESS_INFO.address}</p>
          <p className="text-xs text-gray-500">
            {BUSINESS_INFO.phone} · {BUSINESS_INFO.email}
          </p>
        </div>
        <div className="text-left md:text-right">
          <h2 className="text-2xl font-black tracking-tight text-gray-800">
            INVOICE
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {invoiceNumber ?? (
              <span className="italic text-gray-400">
                Draft — not yet saved
              </span>
            )}
          </p>
          <p className="text-xs text-gray-400">{date.toLocaleDateString()}</p>
          <span
            className={`inline-block mt-2 text-[11px] font-medium px-2 py-0.5 rounded-full ${statusStyles[status] ?? statusStyles.DRAFT}`}
          >
            {status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Bill to */}
      <div className="py-5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
          Bill To
        </p>
        <p className="text-sm font-semibold text-gray-800">{customer.name}</p>
        <p className="text-xs text-gray-500">{customer.phone}</p>
        {customer.email && (
          <p className="text-xs text-gray-500">{customer.email}</p>
        )}
        {customer.address && (
          <p className="text-xs text-gray-500">{customer.address}</p>
        )}
      </div>

      {/* Items table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wide">
            <th className="text-left font-medium py-2">Service</th>
            <th className="text-left font-medium py-2">Staff</th>
            <th className="text-center font-medium py-2">Qty</th>
            <th className="text-right font-medium py-2">Unit Price</th>
            <th className="text-right font-medium py-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-gray-50">
              <td className="py-2.5 text-gray-800">{item.serviceName}</td>
              <td className="py-2.5 text-gray-500">{item.employeeName}</td>
              <td className="py-2.5 text-center text-gray-500">
                {item.quantity}
              </td>
              <td className="py-2.5 text-right text-gray-500">
                {money(item.unitPrice)}
              </td>
              <td className="py-2.5 text-right text-gray-800 font-medium">
                {money(item.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end pt-4">
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
          <div className="flex justify-between font-semibold text-gray-800 pt-1.5 border-t border-gray-200">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>
          {amountPaid > 0 && (
            <>
              <div className="flex justify-between text-green-600">
                <span>Paid</span>
                <span>{money(amountPaid)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-800">
                <span>Balance Due</span>
                <span>{money(Math.max(balanceDue, 0))}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {notes && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
            Notes
          </p>
          <p className="text-sm text-gray-600">{notes}</p>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-8">
        Thank you for visiting {BUSINESS_INFO.name}!
      </p>
    </div>
  );
};

export default InvoicePreview;
