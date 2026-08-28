import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import {
  assignableRoles,
  canManageExpenseCategories,
} from "@/lib/auth/permissions";
import SettingsTabs from "@/components/setting/SettingsTabs";

export default async function SettingsPage() {
  const currentUser = await requireUser();

  const canManageUsers = assignableRoles(currentUser.role).length > 0;
  const canManageExpenses = canManageExpenseCategories(currentUser.role);

  const [users, categories, subCategories] = await Promise.all([
    canManageUsers
      ? prisma.user.findMany({
          select: {
            id: true,
            username: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
    canManageExpenses
      ? prisma.expenseCategory.findMany({
          select: {
            id: true,
            name: true,
            isSalary: true,
            isProtected: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    canManageExpenses
      ? prisma.expenseSubCategory.findMany({
          select: {
            id: true,
            categoryId: true,
            name: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: [{ categoryId: "asc" }, { name: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <p className="text-sm text-slate-500 mt-1">
        Manage users, security and other salon preferences
      </p>

      <SettingsTabs
        currentUser={{ id: currentUser.id, role: currentUser.role }}
        canManageUsers={canManageUsers}
        initialUsers={users}
        canManageExpenseCategories={canManageExpenses}
        initialCategories={categories}
        initialSubCategories={subCategories}
      />
    </div>
  );
}
