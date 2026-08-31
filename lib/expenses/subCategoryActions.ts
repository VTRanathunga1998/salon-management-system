"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { expenseSubCategorySchema } from "@/lib/formValidationsSchemas";
import { requirePermission } from "../auth/guards";

type CurrentState = {
  success: boolean;
  error: boolean;
  message?: string;
  subCategory?: {
    id: string;
    categoryId: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
  };
};

export async function createExpenseSubCategory(
  prevState: CurrentState,
  data: unknown,
): Promise<CurrentState> {
  try {
    await requirePermission("expense:manage-categories"); // owner-only
  } catch {
    return {
      success: false,
      error: true,
      message: "You don't have permission to manage expense categories.",
    };
  }

  const parsed = expenseSubCategorySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: true,
      message: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  try {
    const category = await prisma.expenseCategory.findUnique({
      where: { id: parsed.data.categoryId },
      select: { id: true, name: true, isActive: true, isSalary: true },
    });

    if (!category || !category.isActive) {
      return {
        success: false,
        error: true,
        message: "Selected category is invalid or has been removed.",
      };
    }

    if (category.isSalary) {
      return {
        success: false,
        error: true,
        message: "Salaries can't have subcategories.",
      };
    }

    if (category.name.trim().toLowerCase() === "other") {
      return {
        success: false,
        error: true,
        message: "Other can't have subcategories.",
      };
    }

    const subCategory = await prisma.expenseSubCategory.create({
      data: { categoryId: parsed.data.categoryId, name: parsed.data.name },
    });

    return {
      success: true,
      error: false,
      message: "Subcategory added.",
      subCategory,
    };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        success: false,
        error: true,
        message: "That subcategory already exists for this category.",
      };
    }
    console.error("[createExpenseSubCategory]", err);
    return {
      success: false,
      error: true,
      message: "Failed to add subcategory.",
    };
  }
}

export async function updateExpenseSubCategory(
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

  const parsed = expenseSubCategorySchema.safeParse(data);
  if (!parsed.success || !parsed.data.id) {
    return { success: false, error: true, message: "Invalid data." };
  }

  try {
    const subCategory = await prisma.expenseSubCategory.update({
      where: { id: parsed.data.id },
      data: { categoryId: parsed.data.categoryId, name: parsed.data.name },
    });

    return {
      success: true,
      error: false,
      message: "Subcategory updated.",
      subCategory,
    };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        success: false,
        error: true,
        message: "That subcategory already exists for this category.",
      };
    }
    console.error("[updateExpenseSubCategory]", err);
    return {
      success: false,
      error: true,
      message: "Failed to update subcategory.",
    };
  }
}

// Soft-delete only — same reasoning as Employee/Service isActive toggle.
export async function deactivateExpenseSubCategory(
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
    await prisma.expenseSubCategory.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true, error: false, message: "Subcategory removed." };
  } catch (err) {
    console.error("[deactivateExpenseSubCategory]", err);
    return {
      success: false,
      error: true,
      message: "Failed to remove subcategory.",
    };
  }
}
