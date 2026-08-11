"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import {
  Dispatch,
  SetStateAction,
  startTransition,
  useActionState,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  expenseSchema,
  ExpenseFormInput,
  ExpenseSchema,
} from "@/lib/formValidationsSchemas";
import { createExpense, updateExpense } from "@/lib/expenses/actions";
import InputField from "@/components/InputField";
import CustomSelect from "@/components/CustomSelect";
import { toDateInputInSalonTz, todayInSalonTz } from "@/lib/timezone";

const categoryOptions = [
  { value: "RENT", label: "Rent" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "SUPPLIES", label: "Supplies" },
  { value: "SALARIES", label: "Salaries" },
  { value: "MARKETING", label: "Marketing" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "OTHER", label: "Other" },
];

const methodOptions = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
];

const ExpenseForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormInput, any, ExpenseSchema>({
    resolver: zodResolver(expenseSchema),
    defaultValues: data
      ? {
          id: data.id,
          title: data.title,
          category: data.category,
          amount: Number(data.amount),
          method: data.method,
          date: toDateInputInSalonTz(data.date),
          notes: data.notes ?? "",
        }
      : {
          title: "",
          category: "OTHER",
          amount: 0,
          method: "CASH",
          date: todayInSalonTz(),
          notes: "",
        },
  });

  const [state, formAction, pending] = useActionState(
    type === "create" ? createExpense : updateExpense,
    { success: false, error: false, message: "" },
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(
        state.message ||
          `Expense ${type === "create" ? "recorded" : "updated"}.`,
      );
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      console.warn("[ExpenseForm]", state.message);
      toast.error(state.message || "Something went wrong. Please try again.");
    }
  }, [state, router, setOpen, type]);

  const onSubmit = handleSubmit((formData) => {
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-gray-800">
        {type === "create" ? "Add Expense" : "Edit Expense"}
      </h2>

      {data?.id && <input type="hidden" {...register("id")} value={data.id} />}

      <InputField
        label="Title"
        name="title"
        register={register}
        error={errors.title}
      />

      <div className="flex flex-col md:flex-row gap-4">
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Category"
              options={categoryOptions}
              value={field.value ?? "OTHER"}
              onChange={field.onChange}
            />
          )}
        />

        <Controller
          name="method"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Paid via"
              options={methodOptions}
              value={field.value ?? "CASH"}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <InputField
          label="Amount (Rs.)"
          type="number"
          name="amount"
          register={register}
          error={errors.amount}
          inputProps={{
            min: 0.01,
            step: "0.01",
          }}
        />

        <InputField
          label="Date"
          type="date"
          name="date"
          register={register}
          error={errors.date}
          inputProps={{ max: todayInSalonTz() }}
        />
      </div>

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
              ? "Add Expense"
              : "Save Changes"}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
