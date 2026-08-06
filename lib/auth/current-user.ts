import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "./session";

export const getCurrentUser = cache(getSessionUser);

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/api/session/clear");
  }
  return user;
}
