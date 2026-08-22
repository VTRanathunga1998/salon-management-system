"use server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/formValidationsSchemas";

import {
  startOfDayInSalonTz,
} from "@/lib/utils/timezone";

type CurrentState = {
  success: boolean;
  error: boolean;
  message?: string;
};

/**
 * Convert YYYY-MM-DD to YYYY-MM.
 *
 * The date comes from the salon's local date input,
 * so we intentionally use the selected date directly.
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
  const parsed = expenseSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: true,
      message:
        parsed.error.issues[0]?.message ??
        "Invalid data.",
    };
  }

  const values = parsed.data;

  try {
    /**
     * =====================================================
     * SALARY BATCH
     * =====================================================
     */
    if (
      values.category === "SALARIES"
    ) {
      const salaryEntries =
        values.salaryEntries ?? [];

      if (salaryEntries.length === 0) {
        return {
          success: false,
          error: true,
          message:
            "Add at least one employee salary.",
        };
      }

      const salaryMonth =
        getSalaryMonth(values.date);

      /**
       * Extra server-side duplicate protection.
       *
       * Zod already prevents duplicates inside
       * the submitted batch, but we also check DB.
       */
      const employeeIds =
        salaryEntries.map(
          (entry) => entry.employeeId,
        );

      const existingSalaries =
        await prisma.expense.findMany({
          where: {
            category: "SALARIES",
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
        const existingIds =
          new Set(
            existingSalaries.map(
              (salary) =>
                salary.employeeId,
            ),
          );

        const employees =
          await prisma.employee.findMany({
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

        const duplicateNames =
          employees
            .filter((employee) =>
              existingIds.has(
                employee.id,
              ),
            )
            .map(
              (employee) =>
                employee.name,
            );

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

      /**
       * Verify that all employees actually exist
       * and are active.
       */
      const employees =
        await prisma.employee.findMany({
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

      if (
        employees.length !==
        employeeIds.length
      ) {
        return {
          success: false,
          error: true,
          message:
            "One or more selected employees are invalid or inactive.",
        };
      }

      /**
       * Calculate total salary.
       */
      const totalSalary =
        salaryEntries.reduce(
          (sum, entry) =>
            sum + entry.amount,
          0,
        );

      /**
       * Create ALL salary records atomically.
       *
       * If one fails, the entire transaction
       * is rolled back.
       */
      await prisma.$transaction(
        async (tx) => {
          for (const entry of salaryEntries) {
            const employee =
              employees.find(
                (e) =>
                  e.id ===
                  entry.employeeId,
              );

            await tx.expense.create({
              data: {
                title:
                  values.title,

                category:
                  "SALARIES",

                amount:
                  entry.amount,

                method:
                  values.method,

                date:
                  startOfDayInSalonTz(
                    values.date,
                  ),

                notes:
                  values.notes ||
                  null,

                employeeId:
                  entry.employeeId,

                salaryMonth,
              },
            });
          }
        },
      );

      return {
        success: true,
        error: false,
        message: `${salaryEntries.length} salary payment${
          salaryEntries.length === 1
            ? ""
            : "s"
        } recorded. Total: Rs. ${totalSalary.toFixed(
          2,
        )}`,
      };
    }

    /**
     * =====================================================
     * NORMAL EXPENSE
     * =====================================================
     */

    await prisma.expense.create({
      data: {
        title: values.title,

        category:
          values.category,

        amount:
          values.amount ?? 0,

        method:
          values.method,

        date:
          startOfDayInSalonTz(
            values.date,
          ),

        notes:
          values.notes || null,
      },
    });

    return {
      success: true,
      error: false,
      message: "Expense recorded.",
    };
  } catch (err) {
    console.error(
      "[createExpense]",
      err,
    );

    /**
     * Prisma unique constraint.
     *
     * This is the final database-level protection
     * against paying the same employee twice
     * in the same month.
     */
    if (
      err instanceof
        Prisma.PrismaClientKnownRequestError &&
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
      message:
        "Failed to record expense.",
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
  const parsed =
    expenseSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: true,
      message:
        parsed.error.issues[0]?.message ??
        "Invalid data.",
    };
  }

  if (!parsed.data.id) {
    return {
      success: false,
      error: true,
      message:
        "Missing expense id.",
    };
  }

  try {
    const existing =
      await prisma.expense.findUnique({
        where: {
          id: parsed.data.id,
        },
      });

    if (!existing) {
      return {
        success: false,
        error: true,
        message:
          "Expense not found.",
      };
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
    if (
      existing.category ===
        "SALARIES" ||
      parsed.data.category ===
        "SALARIES"
    ) {
      if (
        existing.category !==
        "SALARIES"
      ) {
        return {
          success: false,
          error: true,
          message:
            "Salary expenses cannot be created by converting an existing expense. Create a new salary record instead.",
        };
      }

      if (
        !existing.employeeId
      ) {
        return {
          success: false,
          error: true,
          message:
            "Salary expense has no employee assigned.",
        };
      }

      /**
       * Salary month is determined by
       * the selected local date.
       */
      const salaryMonth =
        getSalaryMonth(
          parsed.data.date,
        );

      /**
       * If the date is changed to another month,
       * check whether that employee already
       * has salary in the new month.
       */
      const duplicate =
        await prisma.expense.findFirst(
          {
            where: {
              category:
                "SALARIES",

              employeeId:
                existing.employeeId,

              salaryMonth,

              NOT: {
                id: existing.id,
              },
            },
          },
        );

      if (duplicate) {
        return {
          success: false,
          error: true,
          message:
            `Salary already exists for this employee for ${salaryMonth}.`,
        };
      }

      await prisma.expense.update({
        where: {
          id: existing.id,
        },

        data: {
          title:
            parsed.data.title,

          amount:
            parsed.data.amount ?? 0,

          method:
            parsed.data.method,

          date:
            startOfDayInSalonTz(
              parsed.data.date,
            ),

          notes:
            parsed.data.notes ||
            null,

          category:
            "SALARIES",

          salaryMonth,
        },
      });

      return {
        success: true,
        error: false,
        message:
          "Salary expense updated.",
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
        title:
          parsed.data.title,

        category:
          parsed.data.category,

        amount:
          parsed.data.amount ?? 0,

        method:
          parsed.data.method,

        date:
          startOfDayInSalonTz(
            parsed.data.date,
          ),

        notes:
          parsed.data.notes ||
          null,

        /**
         * Normal expenses must never
         * accidentally retain salary data.
         */
        employeeId: null,
        salaryMonth: null,
      },
    });

    return {
      success: true,
      error: false,
      message:
        "Expense updated.",
    };
  } catch (err) {
    console.error(
      "[updateExpense]",
      err,
    );

    if (
      err instanceof
        Prisma.PrismaClientKnownRequestError &&
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
      message:
        "Failed to update expense.",
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
  const id =
    formData.get("id") as string;

  if (!id) {
    return {
      success: false,
      error: true,
      message:
        "Missing expense id.",
    };
  }

  try {
    await prisma.expense.delete({
      where: { id },
    });

    return {
      success: true,
      error: false,
      message:
        "Expense deleted.",
    };
  } catch (err) {
    console.error(
      "[deleteExpense]",
      err,
    );

    return {
      success: false,
      error: true,
      message:
        "Failed to delete expense.",
    };
  }
}