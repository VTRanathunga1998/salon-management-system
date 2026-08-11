"use server";

import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/formValidationsSchemas";
import { startOfDayInSalonTz } from "../timezone";

type CurrentState = { success: boolean; error: boolean; message?: string };

export async function createExpense(
  prevState: CurrentState,
  data: unknown,
): Promise<CurrentState> {
  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: true,
      message: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  try {
    await prisma.expense.create({
      data: {
        title: parsed.data.title,
        category: parsed.data.category,
        amount: parsed.data.amount,
        method: parsed.data.method,
        date: startOfDayInSalonTz(parsed.data.date),
        notes: parsed.data.notes || null,
      },
    });

    return { success: true, error: false, message: "Expense recorded." };
  } catch (err) {
    console.error("[createExpense]", err);
    return {
      success: false,
      error: true,
      message: "Failed to record expense.",
    };
  }
}

export async function updateExpense(
  prevState: CurrentState,
  data: unknown,
): Promise<CurrentState> {
  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: true,
      message: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }
  if (!parsed.data.id) {
    return { success: false, error: true, message: "Missing expense id." };
  }

  try {
    await prisma.expense.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        category: parsed.data.category,
        amount: parsed.data.amount,
        method: parsed.data.method,
        date: startOfDayInSalonTz(parsed.data.date),
        notes: parsed.data.notes || null,
      },
    });

    return { success: true, error: false, message: "Expense updated." };
  } catch (err) {
    console.error("[updateExpense]", err);
    return {
      success: false,
      error: true,
      message: "Failed to update expense.",
    };
  }
}

export async function deleteExpense(
  prevState: CurrentState,
  formData: FormData,
): Promise<CurrentState> {
  const id = formData.get("id") as string;
  if (!id) {
    return { success: false, error: true, message: "Missing expense id." };
  }

  try {
    await prisma.expense.delete({ where: { id } });
    return { success: true, error: false, message: "Expense deleted." };
  } catch (err) {
    console.error("[deleteExpense]", err);
    return {
      success: false,
      error: true,
      message: "Failed to delete expense.",
    };
  }
}
