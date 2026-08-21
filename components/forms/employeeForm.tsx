"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { AlertCircle } from "lucide-react";

import InputField from "@/components/InputField";
import ServiceMultiSelect from "@/components/ServiceMultiSelect";

import {
  EmployeeFormInput,
  employeeSchema,
  EmployeeSchema,
} from "@/lib/formValidationsSchemas";
import { createEmployee, updateEmployee } from "@/lib/employees/actions";

type RelatedData = {
  services: {
    id: string;
    name: string;
    isActive: boolean;
  }[];
};

type EmployeeFormData = EmployeeSchema & {
  qualifiedServices?: {
    serviceId: string;
  }[];
};

type Props = {
  type: "create" | "update";
  data?: EmployeeFormData;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  relatedData?: RelatedData;
};

// Keep in sync with employeeSchema's regex rules — UX-level filtering only.
const stripNonDigits = (value: string) => value.replace(/\D/g, "");

const stripInvalidNameChars = (value: string) =>
  value.replace(/[^a-zA-Z\s'-]/g, "");

const toTitleCase = (str: string) =>
  str
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s'-])([a-z])/g, (_, sep, char) => sep + char.toUpperCase());

const EmployeeForm = ({ type, data, setOpen, relatedData }: Props) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EmployeeFormInput, any, EmployeeSchema>({
    resolver: zodResolver(employeeSchema),

    defaultValues: data
      ? {
          id: data.id,
          name: data.name,
          phone: data.phone,
          email: data.email ?? "",
          address: data.address ?? "",
          isActive: data.isActive,

          // Existing employee's assigned services
          serviceIds:
            data.qualifiedServices?.map((qs: any) => qs.serviceId) ?? [],
        }
      : {
          name: "",
          phone: "",
          email: "",
          address: "",
          isActive: true,

          // New employee starts with no services
          serviceIds: [],
        },
  });

  const services = relatedData?.services ?? [];

  const [state, formAction, pending] = useActionState(
    type === "create" ? createEmployee : updateEmployee,
    {
      success: false,
      error: false,
      message: "",
    },
  );

  const router = useRouter();

  // Close on Escape, but not while submitting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pending, setOpen]);

  // Handle server action response
  useEffect(() => {
    if (state.success) {
      toast.success(
        state.message ||
          `Employee ${type === "create" ? "created" : "updated"}.`,
      );

      reset();
      setOpen(false);
      router.refresh();
    }

    if (state.error) {
      toast.error(state.message || "Something went wrong. Please try again.");
    }
  }, [state, router, setOpen, reset, type]);

  // If editing an employee and data changes,
  // update the form values.
  useEffect(() => {
    if (data) {
      reset({
        id: data.id,
        name: data.name,
        phone: data.phone ?? "",
        email: data.email ?? "",
        address: data.address ?? "",
        isActive: data.isActive,

        serviceIds:
          data.qualifiedServices?.map((qs: any) => qs.serviceId) ?? [],
      });
    }
  }, [data, reset]);

  const onSubmit = handleSubmit((formData) => {
    startTransition(() => {
      formAction(formData);
    });
  });

  const handleCancel = () => {
    if (isDirty) {
      const confirmClose = window.confirm(
        "You have unsaved changes. Discard them?",
      );

      if (!confirmClose) return;
    }

    setOpen(false);
  };

  // Move between inputs when pressing Enter
  const handleEnterKey = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return;

    const target = e.target as HTMLElement;

    // Don't interfere with textarea
    if (target.tagName === "TEXTAREA") return;

    // Only handle normal inputs
    if (target.tagName !== "INPUT") return;

    e.preventDefault();

    const form = e.currentTarget;

    const inputs = Array.from(
      form.querySelectorAll(
        "input:not([type='hidden']):not([type='checkbox']):not(:disabled)",
      ),
    ) as HTMLInputElement[];

    const currentIndex = inputs.indexOf(target as HTMLInputElement);

    if (currentIndex >= 0 && currentIndex < inputs.length - 1) {
      inputs[currentIndex + 1].focus();
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-5"
      aria-busy={pending}
      onKeyDown={handleEnterKey}
    >
      <h2 className="text-lg font-semibold text-gray-800">
        {type === "create" ? "Create Employee" : "Update Employee"}
      </h2>

      {data?.id && <input type="hidden" {...register("id")} value={data.id} />}

      <fieldset disabled={pending} className="flex flex-col gap-5">
        {/* Employee Name */}
        <InputField
          label="Employee Name"
          name="name"
          register={register}
          error={errors.name}
          width="md:w-full"
          inputProps={{
            placeholder: "Ex: John Doe",
            maxLength: 50,
            autoComplete: "name",

            onInput: (e: React.FormEvent<HTMLInputElement>) => {
              e.currentTarget.value = stripInvalidNameChars(
                e.currentTarget.value,
              );
            },

            onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
              e.currentTarget.value = toTitleCase(e.currentTarget.value);
            },
          }}
        />

        {/* Phone */}
        <InputField
          label="Phone Number"
          name="phone"
          register={register}
          error={errors.phone}
          width="md:w-full"
          inputProps={{
            type: "tel",
            inputMode: "numeric",
            placeholder: "Ex: 05XXXXXXXX",
            maxLength: 10,
            autoComplete: "tel",

            onInput: (e: React.FormEvent<HTMLInputElement>) => {
              e.currentTarget.value = stripNonDigits(e.currentTarget.value);
            },
          }}
        />

        {/* Email */}
        <InputField
          label="Email"
          name="email"
          register={register}
          error={errors.email}
          width="md:w-full"
          inputProps={{
            placeholder: "Ex: john.doe@example.com",
            maxLength: 50,
            autoComplete: "email",
            autoCapitalize: "none",

            onInput: (e: React.FormEvent<HTMLInputElement>) => {
              const el = e.currentTarget;
              const cursor = el.selectionStart;

              el.value = el.value.toLowerCase();

              if (cursor !== null) {
                el.setSelectionRange(cursor, cursor);
              }
            },
          }}
        />

        {/* Address */}
        <InputField
          label="Address"
          name="address"
          register={register}
          error={errors.address}
          width="md:w-full"
          inputProps={{
            placeholder: "Ex: 123 Main St, City, Country",
            maxLength: 100,
            autoComplete: "street-address",
          }}
        />

        {/* Services */}
        <Controller
          name="serviceIds"
          control={control}
          render={({ field }) => (
            <ServiceMultiSelect
              label="Services this employee can perform"
              services={services}
              value={field.value ?? []}
              onChange={field.onChange}
              error={errors.serviceIds?.message as string | undefined}
            />
          )}
        />

        {/* Active / Inactive */}
        {type === "update" && (
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" {...register("isActive")} />
            Active (visible when creating new invoices)
          </label>
        )}
      </fieldset>

      {/* Server error */}
      {state.error && (
        <div className="flex items-center gap-2 mb-4 rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 animate-[shake_0.4s]">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />

          <p className="text-xs font-medium text-red-600">{state.message}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={pending}
          className="flex-1 py-2.5 rounded-lg ring-[1.5px] ring-gray-200 text-sm font-medium text-gray-600 hover:ring-gray-300 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={pending}
          className="flex-1 py-2.5 rounded-lg bg-[#C3EBFA] hover:brightness-95 disabled:opacity-50 text-sm font-medium text-gray-800 transition cursor-pointer"
        >
          {pending
            ? "Saving..."
            : type === "create"
              ? "Create Employee"
              : "Update Employee"}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;
