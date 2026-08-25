"use client";

import { useActionState, useEffect } from "react";
import type { StaffUser } from "./StaffAccountsPanel";
import { deactivateUser } from "@/lib/user/actions";

type Props = {
  user: StaffUser;
  onClose: () => void;
  onSuccess: (id: string) => void;
};

const DeactivateUserDialog = ({ user, onClose, onSuccess }: Props) => {
  const [state, formAction, pending] = useActionState(deactivateUser, {
    success: false,
    error: false,
    message: "",
  });

  useEffect(() => {
    if (state.success) onSuccess(user.id);
  }, [state, user.id, onSuccess]);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6">
        <h3 className="text-base font-bold text-slate-900">
          Deactivate {user.username}?
        </h3>
        <p className="text-sm text-slate-500 mt-2">
          They'll lose access immediately. You can't undo this from here —
          reactivation isn't wired up yet unless you add it.
        </p>

        {state.error && (
          <div className="bg-red-50 text-red-600 text-xs rounded-lg px-3 py-2 mt-4">
            {state.message}
          </div>
        )}

        <form action={formAction} className="flex gap-3 mt-5">
          <input type="hidden" name="id" value={user.id} />
          <button
            type="button"
            onClick={onClose}
            className="flex-1 text-sm font-semibold rounded-xl py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl py-2.5"
          >
            {pending ? "Deactivating..." : "Deactivate"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DeactivateUserDialog;
