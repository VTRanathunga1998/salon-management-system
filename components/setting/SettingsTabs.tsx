"use client";

import { useState } from "react";
import { Users, Lock, Tag } from "lucide-react";
import type { Role } from "@/lib/auth/permissions";
import StaffAccountsPanel, { StaffUser } from "./StaffAccountsPanel";
import ChangePasswordPanel from "./ChangePasswordPanel";
import ExpenseCategoriesPanel, {
  Category,
  SubCategory,
} from "./ExpenseCategoriesPanel";

type Props = {
  currentUser: { id: string; role: Role };
  canManageUsers: boolean;
  initialUsers: StaffUser[];
  canManageExpenseCategories: boolean;
  initialCategories: Category[];
  initialSubCategories: SubCategory[];
};

const SettingsTabs = ({
  currentUser,
  canManageUsers,
  initialUsers,
  canManageExpenseCategories,
  initialCategories,
  initialSubCategories,
}: Props) => {
  const [tab, setTab] = useState<"users" | "password" | "expenseCategories">(
    canManageUsers ? "users" : "password",
  );

  return (
    <div className="mt-4 w-full sm:mt-6">
      {/* Tab Bar */}
      <div
        className="
          w-full
          overflow-x-auto
          rounded-2xl
          border border-slate-100
          bg-white
          p-1
          shadow-sm
          sm:w-fit
          sm:p-1.5
        "
      >
        <div className="flex min-w-max items-center gap-1 sm:gap-2">
          {canManageUsers && (
            <button
              type="button"
              onClick={() => setTab("users")}
              className={`
                flex min-h-10 items-center justify-center gap-2 whitespace-nowrap
                rounded-xl px-3 py-2 text-xs font-semibold transition-colors
                sm:px-4 sm:py-2.5 sm:text-sm
                ${
                  tab === "users"
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }
              `}
            >
              <Users className="h-4 w-4 shrink-0" />
              <span>Users & Roles</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setTab("password")}
            className={`
              flex min-h-10 items-center justify-center gap-2 whitespace-nowrap
              rounded-xl px-3 py-2 text-xs font-semibold transition-colors
              sm:px-4 sm:py-2.5 sm:text-sm
              ${
                tab === "password"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }
            `}
          >
            <Lock className="h-4 w-4 shrink-0" />
            <span>Change Password</span>
          </button>

          {/* Expense Categories — owner/admin only */}
          {canManageExpenseCategories && (
            <button
              type="button"
              onClick={() => setTab("expenseCategories")}
              className={`
                flex min-h-10 items-center justify-center gap-2 whitespace-nowrap
                rounded-xl px-3 py-2 text-xs font-semibold transition-colors
                sm:px-4 sm:py-2.5 sm:text-sm
                ${
                  tab === "expenseCategories"
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }
              `}
            >
              <Tag className="h-4 w-4 shrink-0" />
              <span>Expense Categories</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4 w-full sm:mt-6">
        {tab === "users" && canManageUsers && (
          <StaffAccountsPanel
            currentUser={currentUser}
            initialUsers={initialUsers}
          />
        )}

        {tab === "password" && <ChangePasswordPanel />}

        {tab === "expenseCategories" && canManageExpenseCategories && (
          <ExpenseCategoriesPanel
            initialCategories={initialCategories}
            initialSubCategories={initialSubCategories}
          />
        )}
      </div>
    </div>
  );
};

export default SettingsTabs;
