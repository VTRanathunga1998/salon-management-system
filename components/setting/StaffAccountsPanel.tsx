"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import type { Role } from "@/lib/auth/permissions";
import { assignableRoles } from "@/lib/auth/permissions";
import UserFormDialog from "./UserFormDialog";
import DeactivateUserDialog from "./DeactivateUserDialog";

export type StaffUser = {
  id: string;
  username: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
};

const ROLE_BADGE: Record<Role, string> = {
  ADMIN: "bg-rose-50 text-rose-700",
  OWNER: "bg-emerald-50 text-emerald-700",
  MANAGER: "bg-blue-50 text-blue-700",
  RECEPTIONIST: "bg-violet-50 text-violet-700",
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  OWNER: "Owner",
  MANAGER: "Manager",
  RECEPTIONIST: "Receptionist",
};

function initials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Props = {
  currentUser: { id: string; role: Role };
  initialUsers: StaffUser[];
};

const StaffAccountsPanel = ({ currentUser, initialUsers }: Props) => {
  const [users, setUsers] = useState(initialUsers);
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState<StaffUser | null>(
    null,
  );

  const assignable = assignableRoles(currentUser.role);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

      const matchesQuery = u.username
        .toLowerCase()
        .includes(query.trim().toLowerCase());

      return matchesRole && matchesQuery;
    });
  }, [users, roleFilter, query]);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* ─────────────────────────────────────────────
          Header
      ───────────────────────────────────────────── */}
      <div
        className="
          flex flex-col gap-4
          border-b border-slate-100
          px-4 py-4
          sm:px-6 sm:py-5
          md:flex-row md:items-center md:justify-between
        "
      >
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Staff Accounts
          </h2>

          <p className="mt-0.5 text-xs leading-5 text-slate-500 sm:text-sm">
            Create and manage managers and receptionists
          </p>
        </div>

        {assignable.length > 0 && (
          <button
            type="button"
            onClick={() => setCreatingUser(true)}
            className="
              flex w-full
              items-center justify-center gap-1.5
              rounded-xl
              bg-blue-600
              px-4 py-2.5
              text-sm font-semibold
              text-white
              transition-colors
              hover:bg-blue-700
              focus:outline-none
              focus:ring-2
              focus:ring-blue-200
              sm:w-auto
            "
          >
            <Plus className="h-4 w-4 shrink-0" />
            Add New User
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────
          Filters
      ───────────────────────────────────────────── */}
      <div
        className="
          flex flex-col gap-3
          border-b border-slate-100
          px-4 py-4
          sm:px-6
          md:flex-row md:items-center
        "
      >
        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as Role | "ALL")}
          className="
            w-full
            rounded-xl
            border border-slate-200
            bg-white
            px-3 py-2.5
            text-sm
            text-slate-600
            outline-none
            transition
            focus:border-blue-400
            focus:ring-2
            focus:ring-blue-100
            md:w-auto
          "
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="OWNER">Owner</option>
          <option value="MANAGER">Manager</option>
          <option value="RECEPTIONIST">Receptionist</option>
        </select>

        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search
            className="
              absolute left-3 top-1/2
              h-4 w-4
              -translate-y-1/2
              text-slate-400
            "
          />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username..."
            className="
              w-full
              rounded-xl
              border border-slate-200
              py-2.5
              pl-9 pr-3
              text-sm
              outline-none
              transition
              placeholder:text-slate-400
              focus:border-blue-400
              focus:ring-2
              focus:ring-blue-100
            "
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          Desktop Table
      ───────────────────────────────────────────── */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-6 py-3 font-semibold">Name</th>

              <th className="px-6 py-3 font-semibold">Role</th>

              <th className="px-6 py-3 font-semibold">Joined</th>

              <th className="px-6 py-3 font-semibold">Status</th>

              <th className="px-6 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((u) => {
              const canEdit = assignable.includes(u.role);

              const canDeactivate =
                assignable.includes(u.role) && u.id !== currentUser.id;

              return (
                <tr
                  key={u.id}
                  className="
                    border-t border-slate-50
                    transition-colors
                    hover:bg-slate-50/50
                  "
                >
                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          flex h-9 w-9 shrink-0
                          items-center justify-center
                          rounded-full
                          bg-blue-100
                          text-xs font-bold
                          text-blue-700
                        "
                      >
                        {initials(u.username)}
                      </div>

                      <span className="font-medium text-slate-800">
                        {u.username}
                      </span>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <span
                      className={`
                        inline-flex
                        rounded-lg
                        px-2.5 py-1
                        text-xs font-semibold
                        ${ROLE_BADGE[u.role]}
                      `}
                    >
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>

                  {/* Joined */}
                  <td className="px-6 py-4 text-slate-500">
                    {formatDate(u.createdAt)}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge isActive={u.isActive} />
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <ActionButtons
                      canEdit={canEdit}
                      canDeactivate={canDeactivate}
                      onEdit={() => canEdit && setEditingUser(u)}
                      onDeactivate={() =>
                        canDeactivate && setDeactivatingUser(u)
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─────────────────────────────────────────────
          Mobile Cards
      ───────────────────────────────────────────── */}
      <div className="block md:hidden">
        {filtered.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((u) => {
              const canEdit = assignable.includes(u.role);

              const canDeactivate =
                assignable.includes(u.role) && u.id !== currentUser.id;

              return (
                <div key={u.id} className="p-4">
                  {/* User Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="
                          flex h-10 w-10 shrink-0
                          items-center justify-center
                          rounded-full
                          bg-blue-100
                          text-xs font-bold
                          text-blue-700
                        "
                      >
                        {initials(u.username)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {u.username}
                        </p>

                        <span
                          className={`
                            mt-1
                            inline-flex
                            rounded-lg
                            px-2 py-0.5
                            text-[11px] font-semibold
                            ${ROLE_BADGE[u.role]}
                          `}
                        >
                          {ROLE_LABEL[u.role]}
                        </span>
                      </div>
                    </div>

                    <StatusBadge isActive={u.isActive} />
                  </div>

                  {/* User Details */}
                  <div
                    className="
                      mt-4
                      grid grid-cols-2
                      gap-3
                      rounded-xl
                      bg-slate-50
                      p-3
                    "
                  >
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Joined
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-600">
                        {formatDate(u.createdAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Status
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-600">
                        {u.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => canEdit && setEditingUser(u)}
                      disabled={!canEdit}
                      className="
                        flex flex-1
                        items-center justify-center gap-2
                        rounded-xl
                        bg-blue-50
                        px-3 py-2.5
                        text-xs font-semibold
                        text-blue-600
                        transition
                        hover:bg-blue-100
                        disabled:cursor-not-allowed
                        disabled:opacity-30
                      "
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => canDeactivate && setDeactivatingUser(u)}
                      disabled={!canDeactivate}
                      className="
                        flex flex-1
                        items-center justify-center gap-2
                        rounded-xl
                        bg-red-50
                        px-3 py-2.5
                        text-xs font-semibold
                        text-red-500
                        transition
                        hover:bg-red-100
                        disabled:cursor-not-allowed
                        disabled:opacity-30
                      "
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Deactivate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* ─────────────────────────────────────────────
          Desktop Empty State
      ───────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="hidden md:block">
          <EmptyState />
        </div>
      )}

      {/* ─────────────────────────────────────────────
          Footer
      ───────────────────────────────────────────── */}
      <div
        className="
          border-t border-slate-100
          px-4 py-3
          text-xs text-slate-400
          sm:px-6 sm:py-4
        "
      >
        Showing{" "}
        <span className="font-semibold text-slate-500">{filtered.length}</span>{" "}
        of <span className="font-semibold text-slate-500">{users.length}</span>{" "}
        users
      </div>

      {/* ─────────────────────────────────────────────
          Dialogs
      ───────────────────────────────────────────── */}
      {creatingUser && (
        <UserFormDialog
          mode="create"
          assignableRoles={assignable}
          onClose={() => setCreatingUser(false)}
          onSuccess={(newUser) => {
            setUsers((prev) => [...prev, newUser]);
            setCreatingUser(false);
          }}
        />
      )}

      {editingUser && (
        <UserFormDialog
          mode="edit"
          user={editingUser}
          assignableRoles={assignable}
          onClose={() => setEditingUser(null)}
          onSuccess={(updated) => {
            setUsers((prev) =>
              prev.map((u) => (u.id === updated.id ? updated : u)),
            );

            setEditingUser(null);
          }}
        />
      )}

      {deactivatingUser && (
        <DeactivateUserDialog
          user={deactivatingUser}
          onClose={() => setDeactivatingUser(null)}
          onSuccess={(id) => {
            setUsers((prev) =>
              prev.map((u) => (u.id === id ? { ...u, isActive: false } : u)),
            );

            setDeactivatingUser(null);
          }}
        />
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Status Badge
───────────────────────────────────────────── */

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`
        inline-flex shrink-0
        items-center gap-1.5
        rounded-lg
        px-2.5 py-1
        text-xs font-semibold
        ${
          isActive
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-slate-500"
        }
      `}
    >
      <span
        className={`
          h-1.5 w-1.5
          rounded-full
          ${isActive ? "bg-emerald-500" : "bg-slate-400"}
        `}
      />

      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Action Buttons
───────────────────────────────────────────── */

function ActionButtons({
  canEdit,
  canDeactivate,
  onEdit,
  onDeactivate,
}: {
  canEdit: boolean;
  canDeactivate: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onEdit}
        disabled={!canEdit}
        className="
          rounded-lg
          bg-blue-50
          p-2
          text-blue-600
          transition
          hover:bg-blue-100
          disabled:cursor-not-allowed
          disabled:opacity-30
        "
        title={canEdit ? "Edit user" : "You can't edit this account"}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={onDeactivate}
        disabled={!canDeactivate}
        className="
          rounded-lg
          bg-red-50
          p-2
          text-red-500
          transition
          hover:bg-red-100
          disabled:cursor-not-allowed
          disabled:opacity-30
        "
        title={
          canDeactivate
            ? "Deactivate user"
            : "You can't deactivate this account"
        }
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Empty State
───────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="px-4 py-10 text-center sm:px-6">
      <p className="text-sm text-slate-400">
        No staff accounts match your search.
      </p>
    </div>
  );
}

export default StaffAccountsPanel;
