// app/actions/users.ts
"use server";

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { comparePasswords, hashPassword } from "@/lib/auth/passwordHasher"; // CHANGED — use your existing helper, not bcrypt directly
import { requireCanAssignRole, requireUser } from "@/lib/auth/guards";
import { assignableRoles, type Role } from "@/lib/auth/permissions";

type CurrentState = {
  success: boolean;
  error: boolean;
  message?: string;
  user?: {
    id: string;
    username: string;
    role: Role;
    isActive: boolean;
    createdAt: Date;
  };
};

const roleEnum = z.enum(["ADMIN", "OWNER", "MANAGER", "RECEPTIONIST"]);

const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: roleEnum,
});

const updateUserSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(3, "Username must be at least 3 characters."),
  role: roleEnum,
  password: z.string().min(8).optional().or(z.literal("")),
});

/**
 * =========================================================
 * CREATE USER
 * =========================================================
 */
export async function createUser(
  prevState: CurrentState,
  data: unknown,
): Promise<CurrentState> {
  const parsed = createUserSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: true,
      message: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  const values = parsed.data;

  try {
    await requireCanAssignRole(values.role);
  } catch {
    return {
      success: false,
      error: true,
      message: "You don't have permission to create this account type.",
    };
  }

  try {
    const passwordHash = await hashPassword(values.password); // CHANGED

    // inside createUser, replace the success return:
    const created = await prisma.user.create({
      data: {
        username: values.username,
        password: passwordHash,
        role: values.role,
      },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      }, // NEW
    });

    return {
      success: true,
      error: false,
      message: "User created.",
      user: created, // NEW
    };
  } catch (err) {
    console.error("[createUser]", err);

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        success: false,
        error: true,
        message: "That username is already taken.",
      };
    }

    return { success: false, error: true, message: "Failed to create user." };
  }
}

/**
 * =========================================================
 * UPDATE USER
 * =========================================================
 */
export async function updateUser(
  prevState: CurrentState,
  data: unknown,
): Promise<CurrentState> {
  const parsed = updateUserSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: true,
      message: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  const values = parsed.data;
  const actor = await requireUser();

  try {
    const existing = await prisma.user.findUnique({ where: { id: values.id } });

    if (!existing) {
      return { success: false, error: true, message: "User not found." };
    }

    if (existing.role !== values.role) {
      if (!assignableRoles(actor.role).includes(values.role)) {
        return {
          success: false,
          error: true,
          message: "You don't have permission to assign this role.",
        };
      }
    }

    if (
      !assignableRoles(actor.role).includes(existing.role) &&
      actor.role !== "ADMIN"
    ) {
      return {
        success: false,
        error: true,
        message: "You don't have permission to edit this account.",
      };
    }

    const dataToUpdate: Prisma.UserUpdateInput = {
      username: values.username,
      role: values.role,
    };

    if (values.password) {
      dataToUpdate.password = await hashPassword(values.password); // CHANGED
    }

    // inside updateUser, replace the success return:
    const updated = await prisma.user.update({
      where: { id: values.id },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      }, // NEW
    });

    return {
      success: true,
      error: false,
      message: "User updated.",
      user: updated, // NEW
    };
  } catch (err) {
    console.error("[updateUser]", err);

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        success: false,
        error: true,
        message: "That username is already taken.",
      };
    }

    return { success: false, error: true, message: "Failed to update user." };
  }
}

/**
 * =========================================================
 * DEACTIVATE USER (soft delete)
 * =========================================================
 */
export async function deactivateUser(
  prevState: CurrentState,
  formData: FormData,
): Promise<CurrentState> {
  const id = formData.get("id") as string;

  if (!id) {
    return { success: false, error: true, message: "Missing user id." };
  }

  const actor = await requireUser();

  if (actor.id === id) {
    return {
      success: false,
      error: true,
      message: "You cannot deactivate your own account.",
    };
  }

  try {
    const target = await prisma.user.findUnique({ where: { id } });

    if (!target) {
      return { success: false, error: true, message: "User not found." };
    }

    if (!assignableRoles(actor.role).includes(target.role)) {
      return {
        success: false,
        error: true,
        message: "You don't have permission to deactivate this account.",
      };
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true, error: false, message: "User deactivated." };
  } catch (err) {
    console.error("[deactivateUser]", err);
    return {
      success: false,
      error: true,
      message: "Failed to deactivate user.",
    };
  }
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match.",
    path: ["confirmPassword"],
  });

export async function changeOwnPassword(
  prevState: CurrentState,
  data: unknown,
): Promise<CurrentState> {
  const parsed = changePasswordSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: true,
      message: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  const actor = await requireUser();

  try {
    const current = await prisma.user.findUnique({ where: { id: actor.id } });
    if (!current) {
      return { success: false, error: true, message: "User not found." };
    }

    const isCorrect = await comparePasswords(
      parsed.data.currentPassword,
      current.password,
    );
    if (!isCorrect) {
      return {
        success: false,
        error: true,
        message: "Current password is incorrect.",
      };
    }

    const newHash = await hashPassword(parsed.data.newPassword);

    await prisma.user.update({
      where: { id: actor.id },
      data: { password: newHash },
    });

    return { success: true, error: false, message: "Password changed." };
  } catch (err) {
    console.error("[changeOwnPassword]", err);
    return {
      success: false,
      error: true,
      message: "Failed to change password.",
    };
  }
}
