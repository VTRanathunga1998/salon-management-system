"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import {
  Dispatch,
  SetStateAction,
  startTransition,
  useActionState,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Plus, Trash2, Users, AlertCircle } from "lucide-react";

import { createExpense, updateExpense } from "@/lib/expenses/actions";

import InputField from "@/components/InputField";
import CustomSelect from "@/components/CustomSelect";

import { toDateInputInSalonTz, todayInSalonTz } from "@/lib/utils/timezone";
import {
  expenseSchema,
  ExpenseFormInput,
  ExpenseSchema,
} from "@/lib/formValidationsSchemas";

const methodOptions = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CREDIT", label: "Credit" },
];

type EmployeeOption = {
  id: string;
  name: string;
  isActive: boolean;
};

type CategoryOption = {
  id: string;
  name: string;
  isSalary: boolean;
  isActive: boolean;
};

type SubCategoryOption = {
  id: string;
  categoryId: string;
  name: string;
  isActive: boolean;
};

type RelatedData = {
  employees: EmployeeOption[];
  categories: CategoryOption[];
  subCategories: SubCategoryOption[];
};

type Props = {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: RelatedData;
};

const ExpenseForm = ({ type, data, setOpen, relatedData }: Props) => {
  const employees = relatedData?.employees ?? [];
  const categories = relatedData?.categories ?? [];
  const subCategories = relatedData?.subCategories ?? [];

  // Looked up once for defaultValues — figures out whether the expense
  // being edited (if any) belongs to the salary category, since `data`
  // itself no longer carries that as a literal string.
  const initialCategory = data?.categoryId
    ? categories.find((c) => c.id === data.categoryId)
    : undefined;

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormInput, any, ExpenseSchema>({
    resolver: zodResolver(expenseSchema),

    defaultValues: data
      ? {
          id: data.id,
          title: data.title,
          categoryId: data.categoryId,
          subCategoryId: data.subCategoryId ?? undefined,
          isSalary: initialCategory?.isSalary ?? false,
          amount:
            data.amount !== null && data.amount !== undefined
              ? Number(data.amount)
              : undefined,
          method: data.method,
          date: toDateInputInSalonTz(data.date),
          notes: data.notes ?? "",

          salaryEntries:
            initialCategory?.isSalary && data.employeeId
              ? [
                  {
                    employeeId: data.employeeId,
                    amount: Number(data.amount),
                  },
                ]
              : [],
        }
      : {
          title: "",
          categoryId: undefined,
          subCategoryId: undefined,
          isSalary: false,
          amount: undefined,
          method: "CASH",
          date: todayInSalonTz(),
          notes: "",
          salaryEntries: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "salaryEntries",
  });

  const categoryId = watch("categoryId");
  const date = watch("date");
  const isSalary = watch("isSalary");

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const subCategoryOptionsForCategory = subCategories
    .filter((sc) => sc.categoryId === categoryId)
    .map((sc) => ({ value: sc.id, label: sc.name }));

  const [state, formAction, pending] = useActionState(
    type === "create" ? createExpense : updateExpense,
    {
      success: false,
      error: false,
      message: "",
    },
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

  /**
   * Add another employee salary row.
   */
  const handleAddEmployee = () => {
    const selectedIds = fields.map((_, index) =>
      watch(`salaryEntries.${index}.employeeId`),
    );

    const availableEmployee = employees.find(
      (employee) => !selectedIds.includes(employee.id),
    );

    if (!availableEmployee) {
      toast.info("All available employees have already been added.");
      return;
    }

    append({
      employeeId: availableEmployee.id,
      amount: 0,
    });
  };

  /**
   * Employee options for each row.
   *
   * Prevent selecting the same employee twice.
   */
  const getEmployeeOptions = (currentIndex: number) => {
    const selectedIds = fields.map((_, index) =>
      watch(`salaryEntries.${index}.employeeId`),
    );

    return employees
      .filter(
        (employee) =>
          employee.id === selectedIds[currentIndex] ||
          !selectedIds.includes(employee.id),
      )
      .map((employee) => ({
        value: employee.id,
        label: employee.name,
      }));
  };

  /**
   * Calculate salary batch total.
   */
  const salaryTotal = fields.reduce((total, _, index) => {
    const amount = Number(watch(`salaryEntries.${index}.amount`) || 0);
    return total + amount;
  }, 0);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-gray-800">
        {type === "create" ? "Add Expense" : "Edit Expense"}
      </h2>

      {data?.id && <input type="hidden" {...register("id")} value={data.id} />}

      {/* Title */}
      <InputField
        label="Title"
        name="title"
        register={register}
        error={errors.title}
        inputProps={{
          placeholder: isSalary
            ? "Ex: August Salaries"
            : "Ex: Electricity Bill",
        }}
      />

      {/* Category + Method */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="Category"
                options={categoryOptions}
                value={field.value ?? ""}
                onChange={(val) => {
                  field.onChange(val);

                  // Category changed — a previously-picked subcategory may
                  // no longer apply, so clear it.
                  setValue("subCategoryId", undefined);

                  const picked = categories.find((c) => c.id === val);
                  setValue("isSalary", picked?.isSalary ?? false);
                }}
              />
            )}
          />
          {errors.categoryId && (
            <p className="mt-1 text-xs text-red-500">
              {errors.categoryId.message}
            </p>
          )}
        </div>

        <div className="flex-1">
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
      </div>

      {/* Subcategory — every category except Salaries */}
      {!isSalary && categoryId && (
        <div className="flex flex-col gap-1.5">
          <Controller
            name="subCategoryId"
            control={control}
            render={({ field }) =>
              subCategoryOptionsForCategory.length > 0 ? (
                <CustomSelect
                  label="Subcategory (optional)"
                  options={subCategoryOptionsForCategory}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              ) : (
                <p className="text-xs text-gray-400">
                  No subcategories set up for this category yet.
                </p>
              )
            }
          />
        </div>
      )}

      {/* ================================================= */}
      {/* SALARY SECTION */}
      {/* ================================================= */}

      {isSalary && type === "create" ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Users className="h-4 w-4" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Employee Salaries
                </h3>

                <p className="text-xs text-gray-500">
                  Salary month:{" "}
                  <span className="font-medium">{date?.slice(0, 7)}</span>
                </p>
              </div>
            </div>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-600 ring-1 ring-blue-100">
              {fields.length} {fields.length === 1 ? "Employee" : "Employees"}
            </span>
          </div>

          {/* Salary rows */}
          <div className="space-y-3">
            {fields.map((field, index) => {
              const employeeOptions = getEmployeeOptions(index);

              return (
                <div
                  key={field.id}
                  className="rounded-xl bg-white p-3 ring-1 ring-gray-200"
                >
                  <div className="flex flex-col md:flex-row gap-3">
                    {/* Employee */}
                    <div className="flex-1">
                      <Controller
                        name={`salaryEntries.${index}.employeeId`}
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            label="Employee"
                            options={employeeOptions}
                            value={field.value ?? ""}
                            onChange={field.onChange}
                          />
                        )}
                      />

                      {errors.salaryEntries?.[index]?.employeeId && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.salaryEntries[index]?.employeeId?.message}
                        </p>
                      )}
                    </div>

                    {/* Salary */}
                    <div className="flex-1">
                      <InputField
                        label="Salary (AED)"
                        name={`salaryEntries.${index}.amount`}
                        register={register}
                        error={errors.salaryEntries?.[index]?.amount}
                        inputProps={{
                          type: "number",
                          min: 0.01,
                          step: "0.01",
                          placeholder: "75000.00",
                        }}
                      />
                    </div>

                    {/* Remove */}
                    <div className="flex items-end pb-1">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={pending}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                        title="Remove employee"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* No employees */}
          {fields.length === 0 && (
            <div className="rounded-xl border border-dashed border-blue-200 bg-white p-6 text-center">
              <Users className="mx-auto h-7 w-7 text-blue-300" />

              <p className="mt-2 text-sm font-medium text-gray-600">
                No employees added
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Add employees and enter their salary amounts.
              </p>
            </div>
          )}

          {/* Add employee */}
          <button
            type="button"
            onClick={handleAddEmployee}
            disabled={pending || fields.length >= employees.length}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-white py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </button>

          {/* Salary total */}
          {fields.length > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-blue-100">
              <span className="text-sm font-medium text-gray-600">
                Total Salaries
              </span>

              <span className="text-lg font-bold text-gray-800">
                AED {salaryTotal.toFixed(2)}
              </span>
            </div>
          )}

          {errors.salaryEntries?.message && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />

              {errors.salaryEntries.message}
            </div>
          )}
        </div>
      ) : (
        /* ================================================= */
        /* NORMAL EXPENSE AMOUNT */
        /* ================================================= */

        <div className="flex flex-col md:flex-row gap-4">
          <InputField
            label="Amount (AED)"
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
            inputProps={{
              max: todayInSalonTz(),
            }}
          />
        </div>
      )}

      {/* Date for salary */}
      {isSalary && type === "create" && (
        <InputField
          label="Salary Date"
          type="date"
          name="date"
          register={register}
          error={errors.date}
          inputProps={{
            max: todayInSalonTz(),
          }}
        />
      )}

      {/* Notes */}
      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">Notes (optional)</label>

        <textarea
          {...register("notes")}
          rows={2}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full resize-none"
          placeholder={
            isSalary ? "Optional salary payment notes..." : "Optional notes..."
          }
        />

        {errors.notes && (
          <p className="text-xs text-red-500">{errors.notes.message}</p>
        )}
      </div>

      {/* Server error */}
      {state.error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />

          <p className="text-xs font-medium text-red-600">{state.message}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="flex-1 py-2.5 rounded-lg ring-[1.5px] ring-gray-200 text-sm font-medium text-gray-600 hover:ring-gray-300 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
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
              ? isSalary
                ? "Record Salaries"
                : "Add Expense"
              : "Save Changes"}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
