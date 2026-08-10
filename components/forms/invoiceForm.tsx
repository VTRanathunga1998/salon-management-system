"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  Dispatch,
  SetStateAction,
  startTransition,
  useActionState,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  invoiceSchema,
  InvoiceFormInput,
  InvoiceSchema,
} from "@/lib/formValidationsSchemas";
import { createInvoice, updateInvoice } from "@/lib/invoices/actions";
import InputField from "@/components/InputField";
import CustomSelect from "@/components/CustomSelect";
import CustomerCombobox from "@/components/Customercombobox";
import EmployeeMultiSelect from "@/components/invoice/Employeemultiselect ";
import { toast } from "react-toastify";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import InvoiceSuccessPanel from "@/components/invoice/InvoiceSuccessPanel";
import { AlertCircle } from "lucide-react";

type RelatedData = {
  customers: { id: string; name: string; phone: string }[];
  services: { id: string; name: string; price: number; isActive: boolean }[];
  employees: { id: string; name: string; isActive: boolean }[];
};

const discountTypeOptions = [
  { value: "FIXED", label: "Rs. (fixed)" },
  { value: "PERCENTAGE", label: "% (percentage)" },
];

const InvoiceForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: RelatedData;
}) => {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<InvoiceFormInput, any, InvoiceSchema>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: data
      ? {
          id: data.id,
          customerId: data.customerId,
          items: data.items?.map((i: any) => ({
            id: i.id,
            serviceId: i.serviceId,
            employeeIds: i.employees?.map((e: any) => e.employeeId) ?? [],
            quantity: i.quantity,
          })) ?? [{ serviceId: "", employeeIds: [], quantity: 1 }],
          discountType: data.discountType ?? "FIXED",
          discountValue: Number(data.discountValue ?? 0),
          taxRate: Number(data.taxRate ?? 0),
          notes: data.notes ?? "",
          status: "ISSUED",
          cancelReason: "",
        }
      : {
          items: [{ serviceId: "", employeeIds: [], quantity: 1 }],
          discountType: "FIXED",
          discountValue: 0,
          taxRate: 0,
          notes: "",
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const [step, setStep] = useState<"form" | "preview">("form");
  const [previewData, setPreviewData] = useState<InvoiceSchema | null>(null);

  const [state, formAction, pending] = useActionState(
    type === "create" ? createInvoice : updateInvoice,
    { success: false, error: false, message: "" },
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      // Any invoice that isn't cancelled hands off to the payment/print/email
      // panel instead of just closing — applies to both create and edit.
      if (state.invoice && state.invoice.status !== "CANCELLED") {
        toast.success(
          type === "create"
            ? `Invoice ${state.invoice.invoiceNumber} created.`
            : `Invoice ${state.invoice.invoiceNumber} updated.`,
        );
        return;
      }
      toast.success(state.message || "Saved.");
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      console.warn("[InvoiceForm]", state.message);
      toast.error(state.message || "Something went wrong. Please try again.");
    }
  }, [state, router, setOpen, type]);

  // For create: validate, then show the print-style preview before anything is saved.
  // For update: submit directly — editing an already-issued/partially-paid invoice
  const onSubmit = handleSubmit((formData) => {
    const subtotal = watchedItems.reduce((sum, item) => {
      const service = serviceMap.get(item.serviceId);

      if (!service) return sum;

      const qty = Number(item.quantity) || 0;

      return sum + service.price * qty;
    }, 0);

    const discountValue = Number(formData.discountValue) || 0;

    // Fixed discount cannot be greater than subtotal
    if (formData.discountType === "FIXED" && discountValue > subtotal) {
      setError("discountValue", {
        type: "validate",
        message: `Discount cannot be greater than subtotal (Rs. ${subtotal.toFixed(
          2,
        )}).`,
      });

      return;
    }

    // Percentage discount cannot exceed 100%
    if (formData.discountType === "PERCENTAGE" && discountValue > 100) {
      setError("discountValue", {
        type: "validate",
        message: "Percentage discount cannot be greater than 100%.",
      });

      return;
    }

    if (type === "create") {
      setPreviewData(formData);
      setStep("preview");
    } else {
      startTransition(() => {
        formAction(formData);
      });
    }
  });

  const onConfirmCreate = () => {
    if (previewData) {
      startTransition(() => {
        formAction(previewData);
      });
    }
  };

  const customers = relatedData?.customers ?? [];
  const services = relatedData?.services ?? [];
  const employees = relatedData?.employees ?? [];

  const serviceOptions = services.map((s) => ({
    value: s.id,
    label: `${s.name}${!s.isActive ? " (inactive)" : ""}`,
  }));
  const employeeOptions = employees.map((e) => ({
    value: e.id,
    label: `${e.name}${!e.isActive ? " (inactive)" : ""}`,
  }));

  // --- Live totals preview (display only — server recomputes authoritatively) ---
  const watchedItems = watch("items");
  const discountType = watch("discountType");
  const discountValue = Number(watch("discountValue")) || 0;
  const taxRate = Number(watch("taxRate")) || 0;
  const watchedStatus = watch("status");

  const serviceMap = new Map(services.map((s) => [s.id, s]));
  const subtotal = watchedItems.reduce((sum, item) => {
    const service = serviceMap.get(item.serviceId);
    if (!service) return sum;
    const qty = Number(item.quantity) || 0;
    return sum + service.price * qty;
  }, 0);
  const discountTotal =
    discountType === "PERCENTAGE"
      ? (subtotal * discountValue) / 100
      : discountValue;
  const isDiscountInvalid =
    discountType === "FIXED" ? discountValue > subtotal : discountValue > 100;
  const taxable = Math.max(subtotal - discountTotal, 0);
  const taxTotal = (taxable * taxRate) / 100;
  const total = taxable + taxTotal;

  const isEditingCancelled = type === "update" && watchedStatus === "CANCELLED";

  // --- Gate: fully paid invoices are read-only ---
  if (type === "update" && data?.status === "PAID") {
    return (
      <InvoiceSuccessPanel
        invoice={data}
        heading={`Invoice ${data.invoiceNumber}`}
        allowPayment={false}
        onDone={() => setOpen(false)}
      />
    );
  }

  // --- Gate: cancelled invoices are also read-only ---
  if (type === "update" && data?.status === "CANCELLED") {
    return (
      <InvoiceSuccessPanel
        invoice={data}
        heading={`Invoice ${data.invoiceNumber}`}
        allowPayment={false}
        onDone={() => setOpen(false)}
      />
    );
  }

  // --- Step: after a successful create OR edit (ISSUED/PARTIALLY_PAID), hand
  //     off to the payment/print/download/email panel ---
  if (state.success && state.invoice && state.invoice.status !== "CANCELLED") {
    return (
      <InvoiceSuccessPanel
        invoice={state.invoice}
        heading={type === "create" ? "Invoice Created" : "Invoice Updated"}
        onDone={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    );
  }

  // --- Step: print-style preview before a NEW invoice is actually saved ---
  if (step === "preview" && previewData) {
    const previewCustomer = customers.find(
      (c) => c.id === previewData.customerId,
    );
    const previewItems = previewData.items.map((item) => {
      const service = serviceMap.get(item.serviceId);
      // CHANGED: was a single employee lookup — now joins every assigned name.
      const staffNames = item.employeeIds
        .map((id) => employees.find((e) => e.id === id)?.name)
        .filter(Boolean)
        .join(", ");
      const qty = Number(item.quantity) || 0;
      const unitPrice = service?.price ?? 0;
      return {
        serviceName: service?.name ?? "Unknown service",
        employeeName: staffNames || "Unassigned",
        quantity: qty,
        unitPrice,
        subtotal: unitPrice * qty,
      };
    });

    return (
      <div className="flex flex-col gap-5">
        <h2 className="text-lg font-semibold text-gray-800">Review Invoice</h2>

        <InvoicePreview
          status="DRAFT"
          date={new Date()}
          customer={{
            name: previewCustomer?.name ?? "Unknown customer",
            phone: previewCustomer?.phone ?? "",
          }}
          items={previewItems}
          subtotal={subtotal}
          discountTotal={discountTotal}
          taxTotal={taxTotal}
          total={total}
          notes={previewData.notes}
        />

        {state.error && (
          <div className="flex items-center gap-2 mb-4 rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 animate-[shake_0.4s]">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-xs font-medium text-red-600">{state.message}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep("form")}
            className="flex-1 py-2.5 rounded-lg ring-[1.5px] ring-gray-200 text-sm font-medium text-gray-600 hover:ring-gray-300 hover:bg-gray-50 transition cursor-pointer"
          >
            Back to edit
          </button>
          <button
            type="button"
            onClick={onConfirmCreate}
            disabled={pending}
            className="flex-1 py-2.5 rounded-lg bg-[#C3EBFA] hover:brightness-95 disabled:opacity-50 text-sm font-medium text-gray-800 transition cursor-pointer"
          >
            {pending ? "Creating…" : "Confirm & Create Invoice"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
        }
      }}
      className="flex flex-col gap-5"
    >
      <h2 className="text-lg font-semibold text-gray-800">
        {type === "create"
          ? "Create Invoice"
          : `Edit Invoice ${data?.invoiceNumber ?? ""}${
              data?.status === "PARTIALLY_PAID" ? " (Partially Paid)" : ""
            }`}
      </h2>

      {data?.status === "PARTIALLY_PAID" && (
        <p className="text-xs text-blue-600 bg-blue-50 rounded-lg p-2.5">
          This invoice already has a partial payment. You can add more services
          below — the remaining balance will be recalculated after saving.
        </p>
      )}

      {data?.id && <input type="hidden" {...register("id")} value={data.id} />}

      {/* Customer — type to search, or create a new one inline */}
      {type === "create" ? (
        <Controller
          name="customerId"
          control={control}
          render={({ field }) => (
            <CustomerCombobox
              customers={customers}
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.customerId?.message}
            />
          )}
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">Customer</label>
          <div className="rounded-lg ring-[1.5px] ring-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
            {data?.customer?.name}
            {data?.customer?.phone ? ` — ${data.customer.phone}` : ""}
            <span className="text-xs text-gray-400 ml-2">
              (can&apos;t be changed after the invoice is created)
            </span>
          </div>
          {/* Keeps customerId in the submitted form data even though the
              field itself isn't editable in this view. */}
          <input type="hidden" {...register("customerId")} />
        </div>
      )}

      {/* Line items */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-500">Services</label>
          <button
            type="button"
            onClick={() =>
              append({ serviceId: "", employeeIds: [], quantity: 1 })
            }
            className="text-xs font-medium text-[#7c6f2a] bg-[#FAE27C] hover:brightness-95 rounded-md px-2.5 py-1.5 cursor-pointer"
          >
            + Add service
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {fields.map((field, index) => {
            const selectedServiceId = watchedItems[index]?.serviceId;
            const lineService = serviceMap.get(selectedServiceId);
            const lineTotal = lineService
              ? lineService.price * (Number(watchedItems[index]?.quantity) || 0)
              : 0;

            return (
              <div
                key={field.id}
                className="flex flex-col md:flex-row md:items-start gap-3 rounded-lg ring-[1.5px] ring-gray-100 p-3"
              >
                <div className="flex-1 min-w-0">
                  <Controller
                    name={`items.${index}.serviceId` as const}
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        label="Service"
                        placeholder="Select a service…"
                        options={serviceOptions}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        error={errors.items?.[index]?.serviceId?.message}
                      />
                    )}
                  />
                </div>

                {/* CHANGED: multi-select instead of a single-value CustomSelect */}
                <div className="flex-1 min-w-0">
                  <Controller
                    name={`items.${index}.employeeIds` as const}
                    control={control}
                    render={({ field }) => (
                      <EmployeeMultiSelect
                        label="Staff"
                        placeholder="Select staff…"
                        options={employeeOptions}
                        value={field.value ?? []}
                        onChange={field.onChange}
                        error={
                          errors.items?.[index]?.employeeIds?.message as
                            | string
                            | undefined
                        }
                      />
                    )}
                  />
                </div>

                <InputField
                  label="Qty"
                  type="number"
                  name={`items.${index}.quantity`}
                  register={register}
                  error={errors.items?.[index]?.quantity}
                  inputProps={{ min: 1 }}
                />

                <div className="flex flex-col gap-1.5 md:pt-6 shrink-0">
                  <span className="text-xs text-gray-500 whitespace-nowrap md:pt-[1px]">
                    Rs. {lineTotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex md:pt-6 shrink-0">
                  <button
                    type="button"
                    onClick={() => fields.length > 1 && remove(index)}
                    disabled={fields.length === 1}
                    className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Remove"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M3 6h18" strokeLinecap="round" />
                      <path d="M8 6V4h8v2" strokeLinecap="round" />
                      <path
                        d="M19 6l-1 14H6L5 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {errors.items?.message && (
          <p className="text-xs text-red-400">
            {errors.items.message as string}
          </p>
        )}
      </div>

      {/* Discount / Tax */}
      <div className="flex flex-col md:flex-row gap-4">
        <Controller
          name="discountType"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Discount type"
              options={discountTypeOptions}
              value={field.value ?? "FIXED"}
              onChange={field.onChange}
            />
          )}
        />

        <InputField
          label="Discount value"
          type="number"
          name="discountValue"
          register={register}
          error={errors.discountValue}
          inputProps={{ min: 0, step: "0.01" }}
        />

        <InputField
          label="Tax rate (%)"
          type="number"
          name="taxRate"
          register={register}
          error={errors.taxRate}
          inputProps={{ min: 0, max: 100, step: "0.01" }}
        />
      </div>

      {isDiscountInvalid && (
        <div className="flex items-center gap-2 mb-4 rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 animate-[shake_0.4s]">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-500">
            {discountType === "FIXED"
              ? `Discount cannot exceed Rs. ${subtotal.toFixed(2)}.`
              : "Discount cannot exceed 100%."}
          </p>
        </div>
      )}

      {/* Notes — InputField doesn't support textarea, so styled to match manually */}
      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">Notes (optional)</label>
        <textarea
          {...register("notes")}
          rows={2}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full resize-none"
        />
      </div>

      {/* Cancel invoice — only offered while nothing has been paid yet */}
      {type === "update" && data?.status === "ISSUED" && (
        <div className="flex flex-col gap-1.5 rounded-lg bg-red-50 p-3">
          <label className="flex items-center gap-2 text-xs font-medium text-red-700 cursor-pointer">
            <input
              type="checkbox"
              checked={watchedStatus === "CANCELLED"}
              onChange={(e) => {
                setValue("status", e.target.checked ? "CANCELLED" : "ISSUED", {
                  shouldValidate: true,
                });
              }}
            />
            <input type="hidden" {...register("status")} />
            Cancel this invoice instead of editing it
          </label>
          <input type="hidden" id="status-hidden" {...register("status")} />
          {isEditingCancelled && (
            <input
              type="text"
              placeholder="Reason for cancellation"
              {...register("cancelReason")}
              className="ring-[1.5px] ring-red-200 rounded-lg p-2 text-sm focus:outline-none mt-1"
            />
          )}
          {errors.cancelReason && (
            <p className="text-xs text-red-400">
              {errors.cancelReason.message}
            </p>
          )}
        </div>
      )}

      {/* Totals summary */}
      <div className="rounded-lg bg-gray-50 p-3.5 flex flex-col gap-1 text-sm">
        <div className="flex justify-between text-gray-500">
          <span>Subtotal</span>
          <span>Rs. {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Discount</span>
          <span>- Rs. {discountTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Tax</span>
          <span>+ Rs. {taxTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-gray-800 pt-1.5 border-t border-gray-200 mt-1">
          <span>Total</span>
          <span>Rs. {total.toFixed(2)}</span>
        </div>
        {data?.status === "PARTIALLY_PAID" && (
          <p className="text-xs text-gray-400 pt-1">
            Balance will be recalculated against what's already been paid after
            you save.
          </p>
        )}
      </div>

      {state.error && (
        <div className="flex items-center gap-2 mb-4 rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 animate-[shake_0.4s]">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-xs font-medium text-red-600">{state.message}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 py-2.5 rounded-lg ring-[1.5px] ring-gray-200 text-sm font-medium text-gray-600 hover:ring-gray-300 hover:bg-gray-50 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending || isDiscountInvalid}
          className="flex-1 py-2.5 rounded-lg bg-[#C3EBFA] hover:brightness-95 disabled:opacity-50 text-sm font-medium text-gray-800 transition cursor-pointer"
        >
          {pending
            ? "Saving…"
            : type === "create"
              ? "Preview Invoice"
              : "Save Changes"}
        </button>
      </div>
    </form>
  );
};

export default InvoiceForm;
