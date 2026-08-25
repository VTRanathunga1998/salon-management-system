"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { comparePasswords } from "./passwordHasher";
import { createSession, destroySession } from "./session";

const signInSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

type SignInState = { success: boolean; error: boolean; message: string };

export async function signIn(
  prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: true,
      message: "Username and password are required.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });

  if (!user || !user.isActive) {
    return {
      success: false,
      error: true,
      message: "Invalid username or password.", 
    };
  }

  const isCorrect = await comparePasswords(parsed.data.password, user.password);

  if (!isCorrect) {
    return {
      success: false,
      error: true,
      message: "Invalid username or password.",
    };
  }

  await createSession(user.id);
  redirect("/invoice");
}

export async function logOut() {
  await destroySession();
  redirect("/sign-in");
}
