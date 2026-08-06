"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

import InputField from "@/components/InputField";

import {
  EmployeeFormInput,
  employeeSchema,
  EmployeeSchema,
} from "@/lib/formValidationsSchemas";
import { createEmployee, updateEmployee } from "@/lib/employees/actions";

type Props = {
  type: "create" | "update";
  data?: EmployeeSchema;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const EmployeeForm = ({ type, data, setOpen }: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EmployeeFormInput, any, EmployeeSchema>({
    resolver: zodResolver(employeeSchema),
    defaultValues: data ?? {
      name: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  const [state, formAction, pending] = useActionState(
    type === "create" ? createEmployee : updateEmployee,
    { success: false, error: false, message: "" },
  );

  const router = useRouter();

  // Close on Escape, but not while a submission is in flight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pending, setOpen]);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      reset();
      setOpen(false);
      router.refresh();
    }

    if (state.error) {
      toast.error(state.message);
    }
  }, [state, router, setOpen, reset]);

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

  const handleEnterKey = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return;

    const target = e.target as HTMLElement;

    if (target.tagName !== "INPUT") return;

    e.preventDefault();

    const form = e.currentTarget;
    const inputs = Array.from(
      form.querySelectorAll("input:not([type='hidden'])"),
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
      <h2 className="text-lg font-semibold">
        {type === "create" ? "Create Employee" : "Update Employee"}
      </h2>

      {data?.id && <input type="hidden" {...register("id")} />}

      <fieldset disabled={pending} className="flex flex-col gap-5">
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
          }}
        />

        <InputField
          label="Phone Number"
          name="phone"
          register={register}
          error={errors.phone}
          width="md:w-full"
          inputProps={{
            placeholder: "Ex: 071XXXXXXX",
            maxLength: 50,
            autoComplete: "tel",
          }}
        />

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
          }}
        />

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
      </fieldset>

      {state.error && state.message && (
        <p role="alert" className="text-sm text-red-500">
          {state.message}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCancel}
          className="flex-1 py-2.5 rounded-lg ring-[1.5px] ring-gray-200 text-sm font-medium text-gray-600 hover:ring-gray-300 hover:bg-gray-50 transition cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={pending}
          className="flex-1 py-2.5 rounded-lg bg-[#C3EBFA] hover:brightness-95 disabled:opacity-50 text-sm font-medium text-gray-800 transition cursor-pointer"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
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
