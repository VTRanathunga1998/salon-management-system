"use client";

import { useState } from "react";
import { Eye, X, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { getInvoiceById } from "@/lib/invoices/actions";
import InvoiceSuccessPanel from "@/components/invoice/InvoiceSuccessPanel";

const ViewInvoiceButton = ({ invoiceId }: { invoiceId: string }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);

    const res = await getInvoiceById(invoiceId);

    setLoading(false);

    if (!res.success || !res.invoice) {
      toast.error(res.message || "Failed to load invoice.");
      setOpen(false);
      return;
    }

    setInvoice(res.invoice);
  };

  const handleClose = () => {
    setOpen(false);
    setInvoice(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="View invoice"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
      >
        <Eye className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60">
          <div className="relative bg-white p-4 rounded-md w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[50%] max-h-[90vh] overflow-y-auto scrollbar-hidden">
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {loading || !invoice ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <InvoiceSuccessPanel
                invoice={invoice}
                heading={`Invoice ${invoice.invoiceNumber}`}
                allowPayment={false}
                onDone={handleClose}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ViewInvoiceButton;