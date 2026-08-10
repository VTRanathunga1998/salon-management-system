"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
  serviceSchema,
  ServiceFormInput,
  ServiceSchema,
} from "@/lib/formValidationsSchemas";
import { createService, updateService } from "@/lib/services/actions";
import InputField from "@/components/InputField";
import { AlertCircle } from "lucide-react";

const ServiceForm = ({
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
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceFormInput, any, ServiceSchema>({
    resolver: zodResolver(serviceSchema),
    defaultValues: data
      ? {
          id: data.id,
          name: data.name,
          description: data.description ?? "",
          duration: data.duration,
          price: Number(data.price),
          isActive: data.isActive,
        }
      : {
          name: "",
          description: "",
          duration: 30,
          price: 0,
          isActive: true,
        },
  });

  const [state, formAction, pending] = useActionState(
    type === "create" ? createService : updateService,
    { success: false, error: false, message: "" },
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(
        state.message ||
          `Service ${type === "create" ? "created" : "updated"}.`,
      );
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      console.warn("[ServiceForm]", state.message);
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
        {type === "create" ? "Create Service" : "Edit Service"}
      </h2>

      {data?.id && <input type="hidden" {...register("id")} value={data.id} />}

      <InputField
        label="Service name"
        name="name"
        register={register}
        error={errors.name}
      />

      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">Description (optional)</label>
        <textarea
          {...register("description")}
          rows={2}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full resize-none"
        />
        {errors.description && (
          <p className="text-xs text-red-400">{errors.description.message}</p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <InputField
          label="Duration (minutes)"
          type="number"
          name="duration"
          register={register}
          error={errors.duration}
          inputProps={{ min: 5, step: 5 }}
        />
        <InputField
          label="Price (Rs.)"
          type="number"
          name="price"
          register={register}
          error={errors.price}
          inputProps={{ min: 0, step: "0.01" }}
        />
      </div>

      {type === "update" && (
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" {...register("isActive")} />
          Active (visible when creating new invoices)
        </label>
      )}

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
          disabled={pending}
          className="flex-1 py-2.5 rounded-lg bg-[#C3EBFA] hover:brightness-95 disabled:opacity-50 text-sm font-medium text-gray-800 transition cursor-pointer"
        >
          {pending
            ? "Saving…"
            : type === "create"
              ? "Create Service"
              : "Save Changes"}
        </button>
      </div>
    </form>
  );
};

export default ServiceForm;
