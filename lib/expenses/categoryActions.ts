"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { expenseCategorySchema } from "@/lib/formValidationsSchemas";
import { requirePermission } from "../auth/guards";

type CurrentState = { success: boolean; error: boolean; message?: string };

export async function createExpenseCategory(
  prevState: CurrentState,
  data: unknown,
): Promise<CurrentState> {
  try {
    await requirePermission("expense:manage-categories");
  } catch {
    return {
      success: false,
      error: true,
      message: "You don't have permission to manage expense categories.",
    };
  }

  const parsed = expenseCategorySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: true,
      message: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  try {
    await prisma.expenseCategory.create({
      data: { name: parsed.data.name },
    });
    return { success: true, error: false, message: "Category added." };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        success: false,
        error: true,
        message: "A category with that name already exists.",
      };
    }
    console.error("[createExpenseCategory]", err);
    return { success: false, error: true, message: "Failed to add category." };
  }
}

export async function updateExpenseCategory(
  prevState: CurrentState,
  data: unknown,
): Promise<CurrentState> {
  try {
    await requirePermission("expense:manage-categories");
  } catch {
    return {
      success: false,
      error: true,
      message: "You don't have permission to manage expense categories.",
    };
  }

  const parsed = expenseCategorySchema.safeParse(data);
  if (!parsed.success || !parsed.data.id) {
    return { success: false, error: true, message: "Invalid data." };
  }

  try {
    const existing = await prisma.expenseCategory.findUniqueOrThrow({
      where: { id: parsed.data.id },
    });

    if (existing.isProtected) {
      return {
        success: false,
        error: true,
        message: "This is a default category and can't be renamed.",
      };
    }

    await prisma.expenseCategory.update({
      where: { id: parsed.data.id },
      data: { name: parsed.data.name },
    });
    return { success: true, error: false, message: "Category updated." };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        success: false,
        error: true,
        message: "A category with that name already exists.",
      };
    }
    console.error("[updateExpenseCategory]", err);
    return {
      success: false,
      error: true,
      message: "Failed to update category.",
    };
  }
}

export async function deactivateExpenseCategory(
  prevState: CurrentState,
  formData: FormData,
): Promise<CurrentState> {
  try {
    await requirePermission("expense:manage-categories");
  } catch {
    return {
      success: false,
      error: true,
      message: "You don't have permission to manage expense categories.",
    };
  }

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: true, message: "Missing id." };

  try {
    const existing = await prisma.expenseCategory.findUniqueOrThrow({
      where: { id },
    });
    if (existing.isProtected) {
      return {
        success: false,
        error: true,
        message: "This is a default category and can't be removed.",
      };
    }

    await prisma.expenseCategory.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true, error: false, message: "Category removed." };
  } catch (err) {
    console.error("[deactivateExpenseCategory]", err);
    return {
      success: false,
      error: true,
      message: "Failed to remove category. It may still have expenses.",
    };
  }
}
