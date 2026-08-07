"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Dispatch, SetStateAction, startTransition, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppointmentStatus } from "@prisma/client";

import {
  createAppointment,
  updateAppointment,
} from "@/lib/appoinments/actions";
import InputField from "@/components/InputField";
import CustomSelect from "@/components/CustomSelect";
import CustomerCombobox from "@/components/Customercombobox";
import { toast } from "react-toastify";
import {
  AppointmentFormInput,
  appointmentSchema,
  AppointmentSchema,
} from "@/lib/formValidationsSchemas";

type RelatedData = {
  customers: { id: string; name: string; phone: string }[];
  services: { id: string; name: string; isActive: boolean }[];
  employees: { id: string; name: string; isActive: boolean }[];
};

const statusOptions = [
  { value: AppointmentStatus.PENDING, label: "Pending" },
  { value: AppointmentStatus.CONFIRMED, label: "Confirmed" },
];

const toDateInput = (d: string | Date) =>
  new Date(d).toISOString().slice(0, 10);
const toTimeInput = (d: string | Date) =>
  new Date(d).toISOString().slice(11, 16);

const AppointmentForm = ({
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
    watch,
    formState: { errors },
  } = useForm<AppointmentFormInput, any, AppointmentSchema>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: data
      ? {
          id: data.id,
          customerId: data.customerId ?? data.customer?.id,
          date: toDateInput(data.date),
          startTime: toTimeInput(data.startTime),
          endTime: toTimeInput(data.endTime),
          status: data.status,
          services: data.services?.map((s: any) => ({
            serviceId: s.serviceId,
            employeeId: s.employeeId ?? "",
          })) ?? [{ serviceId: "", employeeId: "" }],
          notes: data.notes ?? "",
          cancelReason: data.cancelReason ?? "",
        }
      : {
          customerId: "",
          date: new Date().toISOString().slice(0, 10),
          startTime: "",
          endTime: "",
          status: AppointmentStatus.PENDING,
          services: [{ serviceId: "", employeeId: "" }],
          notes: "",
          cancelReason: "",
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "services",
  });

  const [state, formAction, pending] = useActionState(
    type === "create" ? createAppointment : updateAppointment,
    { success: false, error: false, message: "" },
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(state.message || "Saved.");
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      console.error("[AppointmentForm]", state.message);
      toast.error(state.message || "Something went wrong. Please try again.");
    }
  }, [state, router, setOpen]);

  const onSubmit = handleSubmit((formData) => {
    startTransition(() => {
      formAction(formData);
    });
  });

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

  const watchedStatus = watch("status");
  const isCancelling =
    type === "update" && watchedStatus === AppointmentStatus.CANCELLED;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-gray-800">
        {type === "create" ? "Book Appointment" : "Edit Appointment"}
      </h2>

      {data?.id && <input type="hidden" {...register("id")} value={data.id} />}

      {/* Customer — type to search, or create a new one inline */}
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

      <div className="flex flex-col md:flex-row gap-4">
        <InputField
          label="Date"
          type="date"
          name="date"
          register={register}
          error={errors.date}
        />
        <InputField
          label="Start time"
          type="time"
          name="startTime"
          register={register}
          error={errors.startTime}
        />
        <InputField
          label="End time"
          type="time"
          name="endTime"
          register={register}
          error={errors.endTime}
        />
      </div>

      {/* Services */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-500">Services</label>
          <button
            type="button"
            onClick={() => append({ serviceId: "", employeeId: "" })}
            className="text-xs font-medium text-[#7c6f2a] bg-[#FAE27C] hover:brightness-95 rounded-md px-2.5 py-1.5 cursor-pointer"
          >
            + Add service
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col md:flex-row md:items-start gap-3 rounded-lg ring-[1.5px] ring-gray-100 p-3"
            >
              <div className="flex-1 min-w-0">
                <Controller
                  name={`services.${index}.serviceId` as const}
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      label="Service"
                      placeholder="Select a service…"
                      options={serviceOptions}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.services?.[index]?.serviceId?.message}
                    />
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                <Controller
                  name={`services.${index}.employeeId` as const}
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      label="Staff (optional)"
                      placeholder="Assign later…"
                      options={employeeOptions}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
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
          ))}
        </div>
        {errors.services?.message && (
          <p className="text-xs text-red-400">
            {errors.services.message as string}
          </p>
        )}
      </div>

      {/* Status */}
      <Controller
        name="status"
        control={control}
        render={({ field }) =>
          type === "create" ? (
            <CustomSelect
              label="Status"
              options={statusOptions}
              value={field.value ?? AppointmentStatus.PENDING}
              onChange={field.onChange}
            />
          ) : (
            <div className="flex flex-col gap-1.5 rounded-lg bg-red-50 p-3">
              <label className="flex items-center gap-2 text-xs font-medium text-red-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.value === AppointmentStatus.CANCELLED}
                  onChange={(e) =>
                    field.onChange(
                      e.target.checked
                        ? AppointmentStatus.CANCELLED
                        : AppointmentStatus.PENDING,
                    )
                  }
                />
                Cancel this appointment
              </label>

              {!isCancelling && (
                <div className="mt-1">
                  <CustomSelect
                    label="Status"
                    options={statusOptions}
                    value={field.value ?? AppointmentStatus.PENDING}
                    onChange={field.onChange}
                  />
                </div>
              )}

              {isCancelling && (
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
          )
        }
      />

      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">Notes (optional)</label>
        <textarea
          {...register("notes")}
          rows={2}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full resize-none"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg p-2.5">
          {state.message}
        </p>
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
          disabled={pending}
          className="flex-1 py-2.5 rounded-lg bg-[#C3EBFA] hover:brightness-95 disabled:opacity-50 text-sm font-medium text-gray-800 transition cursor-pointer"
        >
          {pending
            ? "Saving…"
            : type === "create"
              ? "Book Appointment"
              : "Save Changes"}
        </button>
      </div>
    </form>
  );
};

export default AppointmentForm;
