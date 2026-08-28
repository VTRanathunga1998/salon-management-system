"use server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/formValidationsSchemas";

import { startOfDayInSalonTz } from "@/lib/utils/timezone";
import { requirePermission } from "../auth/guards";

type CurrentState = {
  success: boolean;
  error: boolean;
  message?: string;
};

/**
 * Convert YYYY-MM-DD to YYYY-MM.
 */
function getSalaryMonth(date: string) {
  return date.slice(0, 7);
}

/**
 * CREATE EXPENSE
 */
export async function createExpense(
  prevState: CurrentState,
  data: unknown,
): Promise<CurrentState> {
  try {
    await requirePermission("expense:create");
  } catch {
    return {
      success: false,
      error: true,
      message: "You don't have permission to record expenses.",
    };
  }

  const parsed = expenseSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: true,
      message: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  const values = parsed.data;

  const category = await prisma.expenseCategory.findUnique({
    where: { id: values.categoryId },
    select: { id: true, isActive: true, isSalary: true },
  });

  if (!category) {
    return {
      success: false,
      error: true,
      message: "Selected category is invalid.",
    };
  }

  if (!category.isActive) {
    return {
      success: false,
      error: true,
      message: "This category has been removed. Please pick another.",
    };
  }

  if (values.subCategoryId) {
    const subCategory = await prisma.expenseSubCategory.findUnique({
      where: { id: values.subCategoryId },
      select: { id: true, categoryId: true, isActive: true },
    });

    if (
      !subCategory ||
      !subCategory.isActive ||
      subCategory.categoryId !== category.id
    ) {
      return {
        success: false,
        error: true,
        message: "Selected subcategory doesn't match the chosen category.",
      };
    }
  }

  try {
    if (category.isSalary) {
      const salaryEntries = values.salaryEntries ?? [];

      if (salaryEntries.length === 0) {
        return {
          success: false,
          error: true,
          message: "Add at least one employee salary.",
        };
      }

      const salaryMonth = getSalaryMonth(values.date);

      const employeeIds = salaryEntries.map((entry) => entry.employeeId);

      const existingSalaries = await prisma.expense.findMany({
        where: {
          categoryId: category.id,
          salaryMonth,
          employeeId: {
            in: employeeIds,
          },
        },
        select: {
          employeeId: true,
        },
      });

      if (existingSalaries.length > 0) {
        const existingIds = new Set(
          existingSalaries.map((salary) => salary.employeeId),
        );

        const employees = await prisma.employee.findMany({
          where: {
            id: {
              in: employeeIds,
            },
          },
          select: {
            id: true,
            name: true,
          },
        });

        const duplicateNames = employees
          .filter((employee) => existingIds.has(employee.id))
          .map((employee) => employee.name);

        return {
          success: false,
          error: true,
          message:
            duplicateNames.length > 0
              ? `Salary already recorded for ${duplicateNames.join(
                  ", ",
                )} for ${salaryMonth}.`
              : `Salary already recorded for one or more employees for ${salaryMonth}.`,
        };
      }

      const employees = await prisma.employee.findMany({
        where: {
          id: {
            in: employeeIds,
          },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (employees.length !== employeeIds.length) {
        return {
          success: false,
          error: true,
          message: "One or more selected employees are invalid or inactive.",
        };
      }

      const totalSalary = salaryEntries.reduce(
        (sum, entry) => sum + entry.amount,
        0,
      );

      await prisma.$transaction(async (tx) => {
        for (const entry of salaryEntries) {
          const employee = employees.find((e) => e.id === entry.employeeId);

          await tx.expense.create({
            data: {
              title: values.title,

              categoryId: category.id,

              amount: entry.amount,

              method: values.method,

              date: startOfDayInSalonTz(values.date),

              notes: values.notes || null,

              employeeId: entry.employeeId,

              salaryMonth,

              // Salaries never carry a subcategory.
              subCategoryId: null,
            },
          });
        }
      });

      return {
        success: true,
        error: false,
        message: `${salaryEntries.length} salary payment${
          salaryEntries.length === 1 ? "" : "s"
        } recorded. Total: AED ${totalSalary.toFixed(2)}`,
      };
    }

    await prisma.expense.create({
      data: {
        title: values.title,

        categoryId: category.id,

        amount: values.amount ?? 0,

        method: values.method,

        date: startOfDayInSalonTz(values.date),

        notes: values.notes || null,

        subCategoryId: values.subCategoryId || null,
      },
    });

    return {
      success: true,
      error: false,
      message: "Expense recorded.",
    };
  } catch (err) {
    console.error("[createExpense]", err);

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        success: false,
        error: true,
        message:
          "Salary has already been recorded for one of the selected employees for this month.",
      };
    }

    return {
      success: false,
      error: true,
      message: "Failed to record expense.",
    };
  }
}

/**
 * =========================================================
 * UPDATE EXPENSE
 * =========================================================
 */
export async function updateExpense(
  prevState: CurrentState,
  data: unknown,
): Promise<CurrentState> {
  try {
    await requirePermission("expense:update");
  } catch {
    return {
      success: false,
      error: true,
      message: "You don't have permission to edit expenses.",
    };
  }

  const parsed = expenseSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: true,
      message: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  if (!parsed.data.id) {
    return {
      success: false,
      error: true,
      message: "Missing expense id.",
    };
  }

  try {
    const existing = await prisma.expense.findUnique({
      where: {
        id: parsed.data.id,
      },
      include: {
        category: { select: { id: true, isSalary: true } },
      },
    });

    if (!existing) {
      return {
        success: false,
        error: true,
        message: "Expense not found.",
      };
    }

    // Authoritative check for the NEWLY submitted category — never trust
    // a client-sent isSalary flag for branching logic, only for the
    // friendlier Zod message. Always re-derive from the database.
    const newCategory = await prisma.expenseCategory.findUnique({
      where: { id: parsed.data.categoryId },
      select: { id: true, isActive: true, isSalary: true },
    });

    if (!newCategory) {
      return {
        success: false,
        error: true,
        message: "Selected category is invalid.",
      };
    }

    if (!newCategory.isActive) {
      return {
        success: false,
        error: true,
        message: "This category has been removed. Please pick another.",
      };
    }

    const wasSalary = existing.category.isSalary;
    const isNowSalary = newCategory.isSalary;

    // If a subcategory was selected, make sure it actually belongs to
    // the chosen category.
    if (parsed.data.subCategoryId) {
      const subCategory = await prisma.expenseSubCategory.findUnique({
        where: { id: parsed.data.subCategoryId },
        select: { id: true, categoryId: true, isActive: true },
      });

      if (
        !subCategory ||
        !subCategory.isActive ||
        subCategory.categoryId !== newCategory.id
      ) {
        return {
          success: false,
          error: true,
          message: "Selected subcategory doesn't match the chosen category.",
        };
      }
    }

    /**
     * Salary records are individual employee
     * records.
     *
     * We allow updating:
     * - amount
     * - method
     * - date
     * - title
     * - notes
     *
     * But we do NOT allow changing the employee
     * through this normal expense update.
     */
    if (wasSalary || isNowSalary) {
      if (!wasSalary) {
        return {
          success: false,
          error: true,
          message:
            "Salary expenses cannot be created by converting an existing expense. Create a new salary record instead.",
        };
      }

      if (!isNowSalary) {
        return {
          success: false,
          error: true,
          message:
            "A salary expense can't be switched to a different category. Delete it and record a new expense instead.",
        };
      }

      if (!existing.employeeId) {
        return {
          success: false,
          error: true,
          message: "Salary expense has no employee assigned.",
        };
      }

      /**
       * Salary month is determined by
       * the selected local date.
       */
      const salaryMonth = getSalaryMonth(parsed.data.date);

      /**
       * If the date is changed to another month,
       * check whether that employee already
       * has salary in the new month.
       */
      const duplicate = await prisma.expense.findFirst({
        where: {
          categoryId: existing.category.id,

          employeeId: existing.employeeId,

          salaryMonth,

          NOT: {
            id: existing.id,
          },
        },
      });

      if (duplicate) {
        return {
          success: false,
          error: true,
          message: `Salary already exists for this employee for ${salaryMonth}.`,
        };
      }

      await prisma.expense.update({
        where: {
          id: existing.id,
        },

        data: {
          title: parsed.data.title,

          amount: parsed.data.amount ?? 0,

          method: parsed.data.method,

          date: startOfDayInSalonTz(parsed.data.date),

          notes: parsed.data.notes || null,

          categoryId: existing.category.id,

          salaryMonth,

          // Salaries never carry a subcategory.
          subCategoryId: null,
        },
      });

      return {
        success: true,
        error: false,
        message: "Salary expense updated.",
      };
    }

    /**
     * =====================================================
     * NORMAL EXPENSE UPDATE
     * =====================================================
     */

    await prisma.expense.update({
      where: {
        id: parsed.data.id,
      },

      data: {
        title: parsed.data.title,

        categoryId: newCategory.id,

        amount: parsed.data.amount ?? 0,

        method: parsed.data.method,

        date: startOfDayInSalonTz(parsed.data.date),

        notes: parsed.data.notes || null,

        employeeId: null,
        salaryMonth: null,
        subCategoryId: parsed.data.subCategoryId || null,
      },
    });

    return {
      success: true,
      error: false,
      message: "Expense updated.",
    };
  } catch (err) {
    console.error("[updateExpense]", err);

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        success: false,
        error: true,
        message:
          "Salary already exists for this employee in the selected month.",
      };
    }

    return {
      success: false,
      error: true,
      message: "Failed to update expense.",
    };
  }
}

/**
 * =========================================================
 * DELETE EXPENSE
 * =========================================================
 */
export async function deleteExpense(
  prevState: CurrentState,
  formData: FormData,
): Promise<CurrentState> {
  try {
    await requirePermission("expense:delete"); // NEW
  } catch {
    return {
      success: false,
      error: true,
      message: "You don't have permission to delete expenses.",
    };
  }

  const id = formData.get("id") as string;

  if (!id) {
    return {
      success: false,
      error: true,
      message: "Missing expense id.",
    };
  }

  try {
    await prisma.expense.delete({
      where: { id },
    });

    return {
      success: true,
      error: false,
      message: "Expense deleted.",
    };
  } catch (err) {
    console.error("[deleteExpense]", err);

    return {
      success: false,
      error: true,
      message: "Failed to delete expense.",
    };
  }
}
