"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  startTransition,
} from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Eye, EyeOff, ChevronDown, Check } from "lucide-react";
import { toast } from "react-toastify";
import { createUser, updateUser } from "@/lib/user/actions";
import {
  userFormSchema,
  type UserFormValues,
} from "@/lib/formValidationsSchemas";
import type { Role } from "@/lib/auth/permissions";
import type { StaffUser } from "./StaffAccountsPanel";

const ROLE_BADGE: Record<Role, string> = {
  ADMIN: "bg-rose-50 text-rose-700",
  OWNER: "bg-emerald-50 text-emerald-700",
  MANAGER: "bg-blue-50 text-blue-700",
  RECEPTIONIST: "bg-violet-50 text-violet-700",
};

const ROLE_DOT: Record<Role, string> = {
  ADMIN: "bg-rose-500",
  OWNER: "bg-emerald-500",
  MANAGER: "bg-blue-500",
  RECEPTIONIST: "bg-violet-500",
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  OWNER: "Owner",
  MANAGER: "Manager",
  RECEPTIONIST: "Receptionist",
};

type Props = {
  mode: "create" | "edit";
  user?: StaffUser;
  assignableRoles: Role[];
  onClose: () => void;
  onSuccess: (user: StaffUser) => void;
};

const UserFormDialog = ({
  mode,
  user,
  assignableRoles,
  onClose,
  onSuccess,
}: Props) => {
  const action = mode === "create" ? createUser : updateUser;

  const [state, formAction, pending] = useActionState(action, {
    success: false,
    error: false,
    message: "",
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema(mode)),
    defaultValues: {
      username: user?.username ?? "",
      role: user?.role ?? assignableRoles[0],
      password: "",
      confirmPassword: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (state.success && state.user) {
      toast.success(
        mode === "create"
          ? `${state.user.username} was added as ${state.user.role}.`
          : `${state.user.username}'s account was updated.`,
      );
      onSuccess(state.user as StaffUser);
      onClose();
    } else if (state.error && state.message) {
      toast.error(state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const onValid = (values: UserFormValues) => {
    const payload =
      mode === "create"
        ? {
            username: values.username,
            password: values.password,
            role: values.role,
          }
        : {
            id: user!.id,
            username: values.username,
            role: values.role,
            password: values.password || "",
          };

    startTransition(() => {
      formAction(payload);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            {mode === "create" ? "Add New User" : "Edit User"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onValid)}
          className="mt-5 flex flex-col gap-4"
          noValidate
        >
          {/* Username */}
          <div>
            <label className="text-xs font-semibold text-slate-600">
              Username
            </label>
            <input
              {...register("username")}
              onChange={(e) => {
                const cleaned = e.target.value
                  .toLowerCase()
                  .replace(/\s+/g, "");
                setValue("username", cleaned, { shouldValidate: true });
              }}
              placeholder="e.g. jsmith"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Lowercase only, no spaces.
            </p>
            {errors.username && (
              <p className="mt-1 text-xs text-red-500">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Role — custom dropdown */}
          <div>
            <label className="text-xs font-semibold text-slate-600">Role</label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <RoleSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={assignableRoles}
                />
              )}
            />
            {errors.role && (
              <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-slate-600">
              {mode === "create" ? "Password" : "New Password"}
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder={
                  mode === "edit"
                    ? "Leave blank to keep current password"
                    : undefined
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-semibold text-slate-600">
              Confirm Password
            </label>
            <div className="relative mt-1">
              <input
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                tabIndex={-1}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {pending
                ? "Saving..."
                : mode === "create"
                  ? "Create User"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Custom Role Select — replaces the native <select>
───────────────────────────────────────────── */

function RoleSelect({
  value,
  onChange,
  options,
}: {
  value: Role;
  onChange: (role: Role) => void;
  options: Role[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${ROLE_DOT[value]}`} />
          <span className="font-medium text-slate-700">
            {ROLE_LABEL[value]}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
          {options.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => {
                onChange(role);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${ROLE_DOT[role]}`} />
                <span
                  className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE[role]}`}
                >
                  {ROLE_LABEL[role]}
                </span>
              </span>
              {role === value && <Check className="h-4 w-4 text-blue-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserFormDialog;
