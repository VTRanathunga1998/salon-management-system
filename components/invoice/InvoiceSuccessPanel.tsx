"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import { recordInvoicePayment } from "@/lib/invoices/actions";
import { sendInvoiceEmail } from "@/lib/email/sendInvoiceEmail";

const InvoiceSuccessPanel = ({
  invoice,
  onDone,
  heading = "Invoice Created",
  allowPayment = true,
}: {
  invoice: any;
  onDone: () => void;
  heading?: string;
  allowPayment?: boolean;
}) => {
  const [current, setCurrent] = useState(invoice);
  const [paymentAmount, setPaymentAmount] = useState<string>(
    Math.max(Number(invoice.total) - paidSoFar(invoice), 0).toFixed(2),
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "CARD" | "BANK_TRANSFER" | "CREDIT"
  >("CASH");
  const [finishing, setFinishing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [lastChange, setLastChange] = useState<number | null>(null);

  const [emailOpen, setEmailOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState(
    invoice.customer?.email ?? "",
  );
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{
    success: boolean;
    message?: string;
  } | null>(null);

  const amountPaid = paidSoFar(current);
  const balanceDue = Number(current.total) - amountPaid;

  // Replaces the old standalone "Record Payment" button — Done now does
  // both jobs: record the payment (unless CREDIT), then close.
  const handleDone = async () => {
    // Nothing to record: already settled, or this is a read-only view
    // (PAID / CANCELLED) where payment collection isn't offered at all.
    if (!allowPayment || balanceDue <= 0) {
      onDone();
      return;
    }

    // Credit: the customer hasn't actually paid. Leave the invoice exactly
    // as it is — no Payment row, no status change — and just close.
    if (paymentMethod === "CREDIT") {
      onDone();
      return;
    }

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      setPaymentError("Enter a valid amount.");
      return;
    }

    setFinishing(true);
    setPaymentError("");
    setLastChange(null);

    const res = await recordInvoicePayment(current.id, amount, paymentMethod);
    setFinishing(false);

    if (!res.success || !res.invoice) {
      const message = res.message || "Failed to record payment.";
      console.warn("[recordInvoicePayment]", message);
      setPaymentError(message);
      toast.error(message);
      return;
    }

    setCurrent(res.invoice);

    if (res.change && res.change > 0) {
      setLastChange(res.change);
      toast.success(
        `Payment recorded. Change due: AED ${res.change.toFixed(2)}`,
      );
    } else {
      toast.success("Payment recorded.");
    }

    onDone();
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const emailIsInvalid =
    emailAddress.trim() !== "" && !isValidEmail(emailAddress);

  const handleSendEmail = async () => {
    const email = emailAddress.trim();

    if (!email) {
      setEmailResult({
        success: false,
        message: "Enter an email address.",
      });
      return;
    }

    if (!isValidEmail(email)) {
      setEmailResult({
        success: false,
        message: "Please enter a valid email address.",
      });
      return;
    }

    setSendingEmail(true);
    setEmailResult(null);

    const res = await sendInvoiceEmail(current.id, email);

    setSendingEmail(false);
    setEmailResult(res);

    if (res.success) {
      toast.success(res.message || "Invoice emailed.");
    } else {
      console.warn("[sendInvoiceEmail]", res.message);
      toast.error(res.message || "Failed to send email.");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">{heading}</h2>
      </div>

      <InvoicePreview
        invoiceNumber={current.invoiceNumber}
        status={current.status}
        date={new Date(current.createdAt)}
        customer={current.customer}
        items={current.items.map((item: any) => ({
          serviceName: item.serviceNameSnapshot,
          employeeName:
            item.employees?.map((e: any) => e.employee.name).join(", ") || "—",
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
        }))}
        subtotal={Number(current.subtotal)}
        discountTotal={Number(current.discountTotal)}
        taxTotal={Number(current.taxTotal)}
        total={Number(current.total)}
        amountPaid={amountPaid}
        notes={current.notes}
      />

      {/* Payment — hidden entirely for read-only views (already paid / cancelled) */}
      {allowPayment ? (
        balanceDue > 0 ? (
          <div className="rounded-lg ring-[1.5px] ring-gray-100 p-4 flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-700">
              Balance due: AED {balanceDue.toFixed(2)}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {paymentMethod !== "CREDIT" && (
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="ring-[1.5px] ring-gray-200 rounded-lg p-2.5 text-sm focus:outline-none flex-1"
                  placeholder="Amount"
                />
              )}
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as typeof paymentMethod)
                }
                className={`ring-[1.5px] ring-gray-200 rounded-lg p-2.5 text-sm focus:outline-none bg-white ${
                  paymentMethod === "CREDIT" ? "flex-1" : "sm:w-40"
                }`}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT">Credit (pay later)</option>
              </select>
            </div>

            {paymentMethod === "CREDIT" ? (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2.5">
                No payment will be recorded — this invoice stays open with a
                balance of AED {balanceDue.toFixed(2)}.
              </p>
            ) : (
              Number(paymentAmount) > balanceDue && (
                <p className="text-xs text-blue-600">
                  Only AED {balanceDue.toFixed(2)} will be recorded as payment —
                  the rest (AED{" "}
                  {(Number(paymentAmount) - balanceDue).toFixed(2)}) is change
                  to hand back, not revenue.
                </p>
              )
            )}

            {paymentError && (
              <p className="text-xs text-red-500">{paymentError}</p>
            )}
            {lastChange !== null && lastChange > 0 && (
              <div className="rounded-lg bg-amber-50 text-amber-700 text-sm p-3 font-medium">
                Change due to customer: AED {lastChange.toFixed(2)}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg bg-green-50 text-green-700 text-sm p-3.5 font-medium">
            ✓ Fully paid
          </div>
        )
      ) : current.status === "CANCELLED" ? (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm p-3.5 font-medium">
          This invoice was cancelled
          {current.cancelReason ? `: ${current.cancelReason}` : "."}
        </div>
      ) : (
        <div className="rounded-lg bg-green-50 text-green-700 text-sm p-3.5 font-medium">
          ✓ Fully paid — no further changes can be made to this invoice.
        </div>
      )}

      {/* Print / Download / Email — always available regardless of status */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              window.open(`/api/invoices/${current.id}/pdf`, "_blank")
            }
            className="hidden sm:block flex-1 min-w-[140px] py-2.5 rounded-lg ring-[1.5px] ring-gray-200 text-sm font-medium text-gray-600 hover:ring-gray-300 hover:bg-gray-50 transition cursor-pointer"
          >
            Print / Save as PDF
          </button>
          <a
            href={`/api/invoices/${current.id}/pdf`}
            className="hidden sm:block flex-1 min-w-[140px] py-2.5 rounded-lg ring-[1.5px] ring-gray-200 text-sm font-medium text-gray-600 hover:ring-gray-300 hover:bg-gray-50 transition text-center cursor-pointer"
          >
            Download PDF
          </a>
          <button
            type="button"
            onClick={() => setEmailOpen((v) => !v)}
            className="flex-1 min-w-[140px] py-2.5 rounded-lg ring-[1.5px] ring-gray-200 text-sm font-medium text-gray-600 hover:ring-gray-300 hover:bg-gray-50 transition cursor-pointer"
          >
            Email Invoice
          </button>
        </div>

        {emailOpen && (
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => {
                setEmailAddress(e.target.value);
                setEmailResult(null);
              }}
              placeholder="customer@example.com"
              className={`ring-[1.5px] rounded-lg p-2.5 text-sm focus:outline-none flex-1 ${
                emailIsInvalid ? "ring-red-300" : "ring-gray-200"
              }`}
            />
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={sendingEmail || !emailAddress.trim() || emailIsInvalid}
              className="rounded-lg bg-[#CFCEFF] hover:brightness-95 disabled:opacity-50 text-sm font-medium text-gray-800 px-4 py-2.5 cursor-pointer"
            >
              {sendingEmail ? "Sending…" : "Send"}
            </button>
          </div>
        )}
        {emailResult && (
          <p
            className={`text-xs ${emailResult.success ? "text-green-600" : "text-red-500"}`}
          >
            {emailResult.message}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleDone}
        disabled={finishing}
        className="w-full py-2.5 rounded-lg bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white text-sm font-medium transition cursor-pointer"
      >
        {finishing ? "Recording…" : "Done"}
      </button>
    </div>
  );
};

function paidSoFar(invoice: any): number {
  return (invoice.payments ?? []).reduce(
    (sum: number, p: any) => sum + Number(p.amount),
    0,
  );
}

export default InvoiceSuccessPanel;
