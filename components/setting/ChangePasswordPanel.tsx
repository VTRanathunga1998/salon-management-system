"use client";

import { changeOwnPassword } from "@/lib/user/actions";
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "@/lib/formValidationsSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

const ChangePasswordPanel = () => {
  const [state, formAction, pending] = useActionState(changeOwnPassword, {
    success: false,
    error: false,
    message: "",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Independent visibility toggle per field
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (state.success) {
      toast.success("Password changed.");
      reset();
    } else if (state.error && state.message) {
      toast.error(state.message);
    }
  }, [state, reset]);

  const onValid = (values: ChangePasswordFormValues) => {
    startTransition(() => {
      formAction(values);
    });
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 max-w-md">
      <h2 className="text-base font-bold text-slate-900">Change Password</h2>
      <p className="text-sm text-slate-500 mt-0.5">
        Update the password for your own account
      </p>

      <form
        onSubmit={handleSubmit(onValid)}
        className="flex flex-col gap-4 mt-4"
        noValidate
      >
        <div>
          <label className="text-xs font-semibold text-slate-600">
            Current Password
          </label>
          <div className="relative mt-1">
            <input
              type={showCurrent ? "text" : "password"}
              {...register("currentPassword")}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 pr-10 outline-none focus:border-blue-400"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              tabIndex={-1}
              aria-label={showCurrent ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-xs text-red-500 mt-1">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">
            New Password
          </label>
          <div className="relative mt-1">
            <input
              type={showNew ? "text" : "password"}
              {...register("newPassword")}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 pr-10 outline-none focus:border-blue-400"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              tabIndex={-1}
              aria-label={showNew ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-red-500 mt-1">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">
            Confirm New Password
          </label>
          <div className="relative mt-1">
            <input
              type={showConfirm ? "text" : "password"}
              {...register("confirmPassword")}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 pr-10 outline-none focus:border-blue-400"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              tabIndex={-1}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl py-2.5"
        >
          {pending ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordPanel;
