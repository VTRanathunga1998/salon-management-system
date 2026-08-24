"use client";

import { useState } from "react";
import { Banknote, CreditCard, Landmark, Clock } from "lucide-react";
import { toast } from "react-toastify";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import { recordInvoicePayment, refundInvoice } from "@/lib/invoices/actions";
import { sendInvoiceEmail } from "@/lib/email/sendInvoiceEmail";

type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER" | "CREDIT";

const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethod;
  label: string;
  icon: typeof Banknote;
  selectedClasses: string;
}[] = [
  {
    value: "CASH",
    label: "Cash",
    icon: Banknote,
    selectedClasses: "border-emerald-300 bg-emerald-50 text-emerald-700",
  },
  {
    value: "CARD",
    label: "Card",
    icon: CreditCard,
    selectedClasses: "border-violet-300 bg-violet-50 text-violet-700",
  },
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
    icon: Landmark,
    selectedClasses: "border-blue-300 bg-blue-50 text-blue-700",
  },
  {
    value: "CREDIT",
    label: "Credit",
    icon: Clock,
    selectedClasses: "border-amber-300 bg-amber-50 text-amber-700",
  },
];

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
  // const [paymentAmount, setPaymentAmount] = useState<string>(
  //   Math.max(Number(invoice.total) - paidSoFar(invoice), 0).toFixed(2),
  // );
  const [paymentAmount, setPaymentAmount] = useState<string>("0.00");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [finishing, setFinishing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [lastChange, setLastChange] = useState<number | null>(null);

  // Two-step flow: while there's an outstanding balance and payment
  // collection is offered, Print/Download/Email stay hidden behind a
  // payment step. Read-only views (already PAID / CANCELLED, or nothing
  // owed at all) skip straight to the actions step — nothing to collect.
  const initialBalanceDue = Math.max(
    Number(invoice.total) - paidSoFar(invoice),
    0,
  );
  const [paymentCompleted, setPaymentCompleted] = useState<boolean>(
    !allowPayment || initialBalanceDue <= 0,
  );

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
  const balanceDue = Math.max(Number(current.total) - amountPaid, 0);

  const isCredit = paymentMethod === "CREDIT";
  const enteredAmount = Number(paymentAmount) || 0;

  // Cash / Card / Bank Transfer always settle the invoice in full — the
  // cashier can't record less than what's owed for these methods. Credit
  // never applies any payment at all; the input is locked and nothing is
  // received.
  const appliedAmount = isCredit ? 0 : balanceDue;
  const projectedTotalPaid = amountPaid + appliedAmount;

  // A single "Balance" figure whose meaning flips with the method:
  // - Cash/Card/Bank Transfer: money to hand BACK to the customer
  //   (only non-zero if they gave more than the total owed).
  // - Credit: money still owed (nothing was collected).
  const balanceValue = isCredit
    ? balanceDue
    : Math.max(enteredAmount - balanceDue, 0);
  const balanceLabel = isCredit ? "Balance Due" : "Balance";

  // For Cash/Card/Bank Transfer, the entered amount must cover the full
  // balance due — anything less isn't a valid state for these methods.
  const isAmountTooLow = !isCredit && enteredAmount < balanceDue;

  let resultingStatusLabel: string;
  let resultingStatusClasses: string;
  let liveStatus: string;

  if (isCredit) {
    resultingStatusLabel = "Issued (Credit)";
    resultingStatusClasses = "bg-amber-50 text-amber-700";
    liveStatus = "ISSUED";
  } else {
    // Cash/Card/Bank Transfer always fully settle the invoice once a
    // valid (>= balance due) amount is entered.
    resultingStatusLabel = "Paid";
    resultingStatusClasses = "bg-emerald-50 text-emerald-700";
    liveStatus = "PAID";
  }

  // Only project a live status during the payment step — once the
  // transaction is finalized (or for read-only views), show the real
  // status from the server.
  const previewStatus =
    !paymentCompleted && allowPayment && balanceDue > 0
      ? liveStatus
      : current.status;
  const previewAmountPaid =
    !paymentCompleted && allowPayment && balanceDue > 0
      ? projectedTotalPaid
      : amountPaid;

  // Step 1 -> Step 2: record the payment (unless CREDIT), then reveal the
  // print/download/email actions. Does NOT close the panel.
  const handleConfirmPayment = async () => {
    if (isCredit) {
      // No payment recorded — the invoice stays exactly as it is. Just
      // move on to the actions step.
      setPaymentCompleted(true);
      return;
    }

    if (isAmountTooLow) {
      setPaymentError(
        `Amount received cannot be less than the balance due (AED ${balanceDue.toFixed(2)}).`,
      );
      return;
    }

    setFinishing(true);
    setPaymentError("");
    setLastChange(null);

    const res = await recordInvoicePayment(
      current.id,
      enteredAmount,
      paymentMethod,
    );
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

    setPaymentCompleted(true);
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

  const [refunding, setRefunding] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundOpen, setRefundOpen] = useState(false);

  const handleRefund = async () => {
    setRefunding(true);
    const res = await refundInvoice(current.id, refundReason);
    setRefunding(false);

    if (!res.success || !res.invoice) {
      toast.error(res.message || "Failed to refund invoice.");
      return;
    }

    setCurrent(res.invoice);
    setRefundOpen(false);
    toast.success(res.message || "Invoice refunded.");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">{heading}</h2>
      </div>

      <InvoicePreview
        invoiceNumber={current.invoiceNumber}
        status={previewStatus}
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
        amountPaid={previewAmountPaid}
        notes={current.notes}
      />

      {!paymentCompleted ? (
        /* =========================================================
           STEP 1 — Payment collection. Print/Download/Email are not
           reachable from here; they only appear after this step is
           confirmed (see STEP 2 below).
        ========================================================== */
        <div className="rounded-lg ring-[1.5px] ring-gray-100 p-4 flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">
              Payment Method
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PAYMENT_METHOD_OPTIONS.map((opt) => {
                const isSelected = paymentMethod === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPaymentMethod(opt.value)}
                    className={`flex items-center justify-center gap-2 rounded-xl border-[1.5px] px-3 py-2.5 text-sm font-medium transition cursor-pointer ${
                      isSelected
                        ? opt.selectedClasses
                        : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="flex items-center justify-between gap-4">
            <label
              className={`text-sm ${isCredit ? "text-gray-400" : "text-gray-500"}`}
            >
              Amount Received
            </label>
            <input
              type="number"
              step="1"
              min={isCredit ? undefined : balanceDue}
              value={paymentAmount}
              disabled={isCredit}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className={`w-40 text-right rounded-lg px-3 py-2 text-sm focus:outline-none ${
                isCredit
                  ? "ring-[1.5px] ring-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                  : "ring-[1.5px] ring-gray-200"
              }`}
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{balanceLabel}</span>
            <span
              className={`text-base font-semibold ${
                isCredit
                  ? "text-amber-600"
                  : balanceValue > 0
                    ? "text-blue-600"
                    : "text-emerald-600"
              }`}
            >
              AED {balanceValue.toFixed(2)}
            </span>
          </div>

          {isAmountTooLow && (
            <p className="text-xs text-red-500">
              Amount received cannot be less than the balance due (AED{" "}
              {balanceDue.toFixed(2)}).
            </p>
          )}

          {isCredit && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2.5">
              No payment will be recorded — this invoice stays open with a
              balance of AED {balanceDue.toFixed(2)}.
            </p>
          )}

          <div
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${resultingStatusClasses}`}
          >
            <span>This invoice will be marked as</span>
            <span>{resultingStatusLabel}</span>
          </div>

          {paymentError && (
            <p className="text-xs text-red-500">{paymentError}</p>
          )}

          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={finishing || (!isCredit && isAmountTooLow)}
            className="w-full py-2.5 rounded-lg bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white text-sm font-medium transition cursor-pointer"
          >
            {finishing
              ? "Recording…"
              : isCredit
                ? "Issue as Credit"
                : "Record Payment"}
          </button>
        </div>
      ) : (
        /* =========================================================
           STEP 2 — Payment is settled (or this is a read-only view).
           Print/Download/Email are only reachable from here.
        ========================================================== */
        <>
          {!allowPayment && current.status === "PAID" && (
            <>
              <div className="rounded-lg bg-green-50 text-green-700 text-sm p-3.5 font-medium">
                ✓ Fully paid — no further changes can be made to this invoice.
              </div>

              {!refundOpen ? (
                <button
                  type="button"
                  onClick={() => setRefundOpen(true)}
                  className="w-full py-2.5 rounded-lg ring-[1.5px] ring-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition cursor-pointer"
                >
                  Refund Invoice
                </button>
              ) : (
                <div className="rounded-lg ring-[1.5px] ring-red-100 p-3.5 flex flex-col gap-2.5">
                  <p className="text-xs text-red-600">
                    This refunds the full amount (AED{" "}
                    {Number(current.total).toFixed(2)}) and cannot be undone.
                  </p>
                  <input
                    type="text"
                    placeholder="Reason for refund"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="ring-[1.5px] ring-gray-200 rounded-lg p-2 text-sm focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRefundOpen(false)}
                      className="flex-1 py-2 rounded-lg ring-[1.5px] ring-gray-200 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleRefund}
                      disabled={refunding}
                      className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium cursor-pointer"
                    >
                      {refunding ? "Refunding…" : "Confirm Refund"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {!allowPayment && current.status === "CANCELLED" && (
            <div className="rounded-lg bg-red-50 text-red-700 text-sm p-3.5 font-medium">
              This invoice was cancelled
              {current.cancelReason ? `: ${current.cancelReason}` : "."}
            </div>
          )}

          {!allowPayment && current.status === "REFUNDED" && (
            <div className="rounded-lg bg-gray-100 text-gray-600 text-sm p-3.5 font-medium">
              This invoice has been refunded.
            </div>
          )}

          {allowPayment && balanceDue <= 0 && (
            <div className="rounded-lg bg-green-50 text-green-700 text-sm p-3.5 font-medium">
              ✓ Fully paid
            </div>
          )}

          {allowPayment && current.status === "ISSUED" && balanceDue > 0 && (
            <div className="rounded-lg bg-amber-50 text-amber-700 text-sm p-3.5 font-medium">
              Issued on credit — balance of AED {balanceDue.toFixed(2)} still
              owed.
            </div>
          )}

          {lastChange !== null && lastChange > 0 && (
            <div className="rounded-lg bg-amber-50 text-amber-700 text-sm p-3 font-medium">
              Change due to customer: AED {lastChange.toFixed(2)}
            </div>
          )}

          {/* Print / Download / Email — only reachable once payment is settled */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  const printWindow = window.open(
                    `/api/invoices/${current.id}/pdf`,
                    "_blank",
                  );

                  if (printWindow) {
                    printWindow.focus();
                  }
                }}
                className="hidden sm:block min-w-[140px] flex-1 rounded-lg py-2.5 text-sm font-medium text-gray-600 ring-[1.5px] ring-gray-200 transition hover:bg-gray-50 hover:ring-gray-300 cursor-pointer"
              >
                Print Invoice
              </button>
              <a
                href={`/api/invoices/${current.id}/pdf?download=true`}
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
                  disabled={
                    sendingEmail || !emailAddress.trim() || emailIsInvalid
                  }
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
            onClick={onDone}
            className="w-full py-2.5 rounded-lg bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium transition cursor-pointer"
          >
            Done
          </button>
        </>
      )}
    </div>
  );
};

function paidSoFar(invoice: any): number {
  return (invoice.payments ?? [])
    .filter((p: any) => p.status === "COMPLETED")
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
}

export default InvoiceSuccessPanel;
