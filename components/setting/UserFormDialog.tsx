"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  startTransition,
} from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import type { Role } from "@/lib/auth/permissions";
import type { StaffUser } from "./StaffAccountsPanel";
import { createUser, updateUser } from "@/lib/user/actions";

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

  const [username, setUsername] = useState(user?.username ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(user?.role ?? assignableRoles[0]);

  const submittedRef = useRef(false);

  useEffect(() => {
    if (state.success && state.user) {
      toast.success(
        mode === "create"
          ? `${state.user.username} was added as ${state.user.role}.`
          : `${state.user.username}'s account was updated.`,
      );
      onSuccess(state.user);
      onClose();
    } else if (state.error && state.message) {
      toast.error(state.message);
      submittedRef.current = false;
    }
  }, [state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (submittedRef.current) return;
    submittedRef.current = true;

    const payload =
      mode === "edit" && user
        ? { id: user.id, username, role, password: password || undefined }
        : { username, role, password };

    startTransition(() => {
      formAction(payload);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">
            {mode === "create" ? "Add New User" : "Edit User"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">
              {mode === "create" ? "Password" : "New Password (optional)"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={mode === "create"}
              minLength={mode === "create" ? 8 : undefined}
              placeholder={
                mode === "edit" ? "Leave blank to keep current password" : ""
              }
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400"
            >
              {assignableRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl py-2.5"
          >
            {pending
              ? "Saving..."
              : mode === "create"
                ? "Create User"
                : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserFormDialog;
