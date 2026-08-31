import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import {
  assignableRoles,
  hasPermission,
  type Permission,
  type Role,
} from "@/lib/auth/permissions";
import { routeAccessMap } from "@/lib/auth/route-access-map"; 

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/api/auth/clear-session");
  }
  return user;
}

export async function requireRole(allowed: Role[]) {
  const user = await requireUser();
  if (!allowed.includes(user.role)) redirect("/unauthorized");
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) {
    throw new Error(`Forbidden: ${user.role} lacks permission "${permission}"`);
  }
  return user;
}

export async function requireRouteAccess() {
  const user = await requireUser();
  const pathname = (await headers()).get("x-pathname") ?? "/";

  const match = Object.entries(routeAccessMap).find(([pattern]) =>
    new RegExp(`^${pattern}$`).test(pathname),
  );

  if (match) {
    const [, allowedRoles] = match;
    if (!allowedRoles.includes(user.role)) {
      redirect("/unauthorized");
    }
  }

  return user;
}

export async function requireCanAssignRole(targetRole: Role) {
  const user = await requireUser();
  if (!assignableRoles(user.role).includes(targetRole)) {
    throw new Error(
      `Forbidden: ${user.role} cannot create a ${targetRole} account`,
    );
  }
  return user;
}
