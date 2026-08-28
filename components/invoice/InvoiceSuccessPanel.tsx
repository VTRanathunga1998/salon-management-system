"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  CreditCard,
  Landmark,
  Clock,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import {
  recordInvoicePayment,
  refundInvoice,
  getCustomerOutstandingInvoices,
  recordInvoicePaymentWithDue,
} from "@/lib/invoices/actions";
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

type DueInvoice = {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  balanceDue: number;
};

type DuePreview = {
  id: string;
  invoiceNumber: string;
  applied: number;
  resultingStatus: "PAID" | "PARTIALLY_PAID" | "NO_CHANGE";
};


function simulateSettlement(
  tendered: number,
  acceptedDue: DueInvoice[],
  currentBalanceDue: number,
) {
  let remaining = tendered;
  const due: DuePreview[] = [];

  for (const d of acceptedDue) {
    if (remaining <= 0) {
      due.push({
        id: d.id,
        invoiceNumber: d.invoiceNumber,
        applied: 0,
        resultingStatus: "NO_CHANGE",
      });
      continue;
    }
    const applied = Math.min(remaining, d.balanceDue);
    due.push({
      id: d.id,
      invoiceNumber: d.invoiceNumber,
      applied,
      resultingStatus: applied >= d.balanceDue ? "PAID" : "PARTIALLY_PAID",
    });
    remaining -= applied;
  }

  const currentApplied = Math.min(Math.max(remaining, 0), currentBalanceDue);
  const currentResultingStatus: "PAID" | "PARTIALLY_PAID" | "NO_CHANGE" =
    currentBalanceDue > 0 && currentApplied >= currentBalanceDue
      ? "PAID"
      : currentApplied > 0
        ? "PARTIALLY_PAID"
        : "NO_CHANGE";
  const change = Math.max(remaining - currentApplied, 0);

  return { due, currentApplied, currentResultingStatus, change };
}

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
  const [paymentAmount, setPaymentAmount] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [finishing, setFinishing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [lastChange, setLastChange] = useState<number | null>(null);

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

  // --- Outstanding-balance collection (from OTHER invoices of this customer) ---
  const [dueInvoices, setDueInvoices] = useState<DueInvoice[]>([]);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!allowPayment || paymentCompleted) return;
    const customerId = current.customer?.id;
    if (!customerId) return;

    let cancelled = false;
    (async () => {
      const outstanding = await getCustomerOutstandingInvoices(
        customerId,
        current.id,
      );
      if (!cancelled) setDueInvoices(outstanding);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.id, allowPayment]);

  // Credit means nothing is actually collected, so it can't settle old
  // balances either — drop any acceptances if the method switches to it.
  useEffect(() => {
    if (isCredit) setAcceptedIds(new Set());
  }, [isCredit]);

  const visibleDueInvoices = dueInvoices.filter((d) => !rejectedIds.has(d.id));
  // Preserves oldest-first order since `dueInvoices` came pre-sorted.
  const acceptedDueInvoices = visibleDueInvoices.filter((d) =>
    acceptedIds.has(d.id),
  );
  const acceptedDueTotal = acceptedDueInvoices.reduce(
    (sum, d) => sum + d.balanceDue,
    0,
  );
  const combinedTotal = balanceDue + (isCredit ? 0 : acceptedDueTotal);

  const sim = isCredit
    ? null
    : simulateSettlement(enteredAmount, acceptedDueInvoices, balanceDue);

  const changeAmount = isCredit ? 0 : sim!.change;
  const remainingAfterPayment = isCredit
    ? combinedTotal
    : Math.max(combinedTotal - Math.min(enteredAmount, combinedTotal), 0);

  const balanceValue = isCredit
    ? balanceDue
    : changeAmount > 0
      ? changeAmount
      : remainingAfterPayment;
  const balanceLabel = isCredit
    ? "Balance Due"
    : changeAmount > 0
      ? "Change"
      : remainingAfterPayment > 0
        ? "Remaining Balance"
        : "Balance";

  const isAmountInvalid = !isCredit && enteredAmount <= 0;

  let resultingStatusLabel: string;
  let resultingStatusClasses: string;

  if (isCredit) {
    resultingStatusLabel = "Issued (Credit)";
    resultingStatusClasses = "bg-amber-50 text-amber-700";
  } else if (sim!.currentResultingStatus === "PAID") {
    resultingStatusLabel = "Paid";
    resultingStatusClasses = "bg-emerald-50 text-emerald-700";
  } else if (sim!.currentResultingStatus === "PARTIALLY_PAID") {
    resultingStatusLabel = "Partially Paid";
    resultingStatusClasses = "bg-blue-50 text-blue-700";
  } else {
    resultingStatusLabel =
      current.status === "PARTIALLY_PAID" ? "Partially Paid" : "Issued";
    resultingStatusClasses = "bg-gray-100 text-gray-600";
  }

  const projectedTotalPaid = amountPaid + (sim ? sim.currentApplied : 0);
  const previewStatus =
    !paymentCompleted && allowPayment && balanceDue > 0
      ? sim?.currentResultingStatus === "PAID"
        ? "PAID"
        : sim?.currentResultingStatus === "PARTIALLY_PAID"
          ? "PARTIALLY_PAID"
          : current.status
      : current.status;
  const previewAmountPaid =
    !paymentCompleted && allowPayment && balanceDue > 0
      ? projectedTotalPaid
      : amountPaid;

  const handleAcceptDue = (id: string) => {
    setAcceptedIds((s) => new Set(s).add(id));
  };

  const handleUndoAccept = (id: string) => {
    setAcceptedIds((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  };

  const handleRejectDue = (id: string) => {
    setRejectedIds((s) => new Set(s).add(id));
    setAcceptedIds((s) => {
      if (!s.has(id)) return s;
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  };

  const handleConfirmPayment = async () => {
    if (isCredit) {
      setPaymentCompleted(true);
      return;
    }

    if (isAmountInvalid) {
      setPaymentError("Enter an amount greater than zero.");
      return;
    }

    setFinishing(true);
    setPaymentError("");
    setLastChange(null);

    const res = await recordInvoicePaymentWithDue(
      current.id,
      acceptedDueInvoices.map((d) => d.id),
      enteredAmount,
      paymentMethod as "CASH" | "CARD" | "BANK_TRANSFER",
    );
    setFinishing(false);

    if (!res.success || !res.invoice) {
      const message = res.message || "Failed to record payment.";
      console.warn("[recordInvoicePaymentWithDue]", message);
      setPaymentError(message);
      toast.error(message);
      return;
    }

    setCurrent(res.invoice);

    // Drop fully-settled due invoices from the list; shrink the balance
    // shown for any that only got partially settled.
    const settledMap = new Map(
      (res.settledDueInvoices ?? []).map((s) => [s.id, s]),
    );
    setDueInvoices((list) =>
      list
        .map((d) => {
          const s = settledMap.get(d.id);
          if (!s) return d;
          if (s.status === "PAID") return null;
          return {
            ...d,
            balanceDue: Math.max(d.balanceDue - s.amountApplied, 0),
          };
        })
        .filter((d): d is DueInvoice => d !== null),
    );
    setAcceptedIds(new Set());

    const settledCount = (res.settledDueInvoices ?? []).filter(
      (s) => s.status === "PAID",
    ).length;

    if (res.change && res.change > 0) {
      setLastChange(res.change);
      toast.success(
        `Payment recorded. Change due: AED ${res.change.toFixed(2)}`,
      );
    } else if (settledCount > 0) {
      toast.success(
        `Payment recorded. ${settledCount} previous invoice${
          settledCount > 1 ? "s" : ""
        } settled in full.`,
      );
    } else if (res.invoice.status === "PARTIALLY_PAID") {
      toast.success("Partial payment recorded.");
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
      setEmailResult({ success: false, message: "Enter an email address." });
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

      {(current.dueCollections ?? []).length > 0 && (
        <div className="rounded-lg bg-gray-50 text-gray-600 text-xs p-3 flex flex-col gap-1">
          <span className="font-semibold text-gray-700">
            Previous balances settled with this payment
          </span>
          {current.dueCollections.map((c: any) => (
            <span key={c.id}>
              AED {Number(c.amount).toFixed(2)} — {c.sourceInvoiceNumber}
            </span>
          ))}
        </div>
      )}

      {!paymentCompleted ? (
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
              min={isCredit ? undefined : 0}
              value={paymentAmount}
              disabled={isCredit}
              onChange={(e) => setPaymentAmount(e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              className={`w-40 text-right rounded-lg px-3 py-2 text-sm focus:outline-none ${
                isCredit
                  ? "ring-[1.5px] ring-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                  : "ring-[1.5px] ring-gray-200"
              }`}
              placeholder="0"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-sm text-gray-600">
              AED {(isCredit ? balanceDue : combinedTotal).toFixed(2)}
            </span>
          </div>

          {!isCredit && acceptedDueInvoices.length > 0 && (
            <p className="text-xs text-gray-400 -mt-2">
              Includes AED {acceptedDueTotal.toFixed(2)} from{" "}
              {acceptedDueInvoices.length === 1
                ? "1 previous invoice"
                : `${acceptedDueInvoices.length} previous invoices`}
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{balanceLabel}</span>
            <span
              className={`text-base font-semibold ${
                isCredit
                  ? "text-amber-600"
                  : balanceValue > 0
                    ? changeAmount > 0
                      ? "text-blue-600"
                      : "text-orange-600"
                    : "text-emerald-600"
              }`}
            >
              AED {balanceValue.toFixed(2)}
            </span>
          </div>

          {isCredit &&
            dueInvoices.filter((d) => !rejectedIds.has(d.id)).length > 0 && (
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2.5">
                This customer has a previous unpaid balance — switch to Cash,
                Card, or Bank Transfer to collect it now.
              </p>
            )}

          {!isCredit &&
            visibleDueInvoices.map((due) => {
              const isAccepted = acceptedIds.has(due.id);
              const preview = sim?.due.find((d) => d.id === due.id);

              return (
                <div
                  key={due.id}
                  className="rounded-lg ring-[1.5px] ring-orange-200 bg-orange-50 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-700">
                        Customer has an outstanding due amount
                      </p>
                      <p className="text-xs text-orange-600">
                        The customer has a previous unpaid balance. Would you
                        like to collect it now?
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-orange-100" />

                  <div className="flex flex-wrap items-end gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Invoice Number</p>
                      <p className="font-medium text-gray-800">
                        {due.invoiceNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Invoice Date</p>
                      <p className="font-medium text-gray-800">
                        {new Date(due.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Due Amount</p>
                      <p className="font-semibold text-orange-600">
                        AED {due.balanceDue.toFixed(2)}
                      </p>
                    </div>

                    {isAccepted &&
                      preview &&
                      preview.resultingStatus !== "NO_CHANGE" && (
                        <div className="ml-auto">
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              preview.resultingStatus === "PAID"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            Will be{" "}
                            {preview.resultingStatus === "PAID"
                              ? "Paid"
                              : "Partially Paid"}{" "}
                            (AED {preview.applied.toFixed(2)})
                          </span>
                        </div>
                      )}
                  </div>

                  <div className="flex justify-end gap-2">
                    {isAccepted ? (
                      <button
                        type="button"
                        onClick={() => handleUndoAccept(due.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg ring-[1.5px] ring-gray-200 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" /> Remove
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRejectDue(due.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg ring-[1.5px] ring-gray-200 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAcceptDue(due.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" /> Accept & Add
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

          {!isCredit && enteredAmount > 0 && enteredAmount < combinedTotal && (
            <p className="text-xs text-orange-600 bg-orange-50 rounded-lg p-2.5">
              This won't fully cover everything — AED{" "}
              {remainingAfterPayment.toFixed(2)} will remain due after this
              payment.
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
            <span>Today's invoice will be marked as</span>
            <span>{resultingStatusLabel}</span>
          </div>

          {paymentError && (
            <p className="text-xs text-red-500">{paymentError}</p>
          )}

          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={finishing || (!isCredit && isAmountInvalid)}
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

          {allowPayment &&
            (current.status === "ISSUED" ||
              current.status === "PARTIALLY_PAID") &&
            balanceDue > 0 && (
              <div className="rounded-lg bg-amber-50 text-amber-700 text-sm p-3.5 font-medium">
                {current.status === "PARTIALLY_PAID"
                  ? `Partially paid — balance of AED ${balanceDue.toFixed(2)} still owed.`
                  : `Issued on credit — balance of AED ${balanceDue.toFixed(2)} still owed.`}
              </div>
            )}

          {lastChange !== null && lastChange > 0 && (
            <div className="rounded-lg bg-amber-50 text-amber-700 text-sm p-3 font-medium">
              Change due to customer: AED {lastChange.toFixed(2)}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  const printWindow = window.open(
                    `/api/invoices/${current.id}/pdf`,
                    "_blank",
                  );
                  if (printWindow) printWindow.focus();
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

          {allowPayment && current.status === "PARTIALLY_PAID" && (
            <button
              type="button"
              onClick={() => setPaymentCompleted(false)}
              className="w-full py-2.5 rounded-lg ring-[1.5px] ring-blue-200 text-blue-700 text-sm font-medium hover:bg-blue-50 transition cursor-pointer"
            >
              Collect Another Payment
            </button>
          )}

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
