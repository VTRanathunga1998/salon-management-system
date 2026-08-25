"use client";

import { changeOwnPassword } from "@/lib/user/actions";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  startTransition,
} from "react";
import { toast } from "react-toastify"; // CHANGED — matches your actual toast library

const ChangePasswordPanel = () => {
  const [state, formAction, pending] = useActionState(changeOwnPassword, {
    success: false,
    error: false,
    message: "",
  });

  // CHANGED — controlled fields instead of relying on native FormData
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const submittedRef = useRef(false);

  useEffect(() => {
    if (state.success) {
      toast.success("Password changed.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      submittedRef.current = false;
    } else if (state.error && state.message) {
      toast.error(state.message);
      submittedRef.current = false;
    }
  }, [state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (submittedRef.current) return; // NEW
    submittedRef.current = true;

    startTransition(() => {
      formAction({ currentPassword, newPassword, confirmPassword }); // CHANGED — plain object, not native FormData
    });
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 max-w-md">
      <h2 className="text-base font-bold text-slate-900">Change Password</h2>
      <p className="text-sm text-slate-500 mt-0.5">
        Update the password for your own account
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
        {" "}
        {/* CHANGED — onSubmit, not action */}
        <div>
          <label className="text-xs font-semibold text-slate-600">
            Current Password
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400"
          />
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
