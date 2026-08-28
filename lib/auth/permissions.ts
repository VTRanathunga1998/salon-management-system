export type Role = "ADMIN" | "OWNER" | "MANAGER" | "RECEPTIONIST";
export const ALL_PERMISSIONS = [
  "customer:view",
  "customer:create",
  "customer:update",
  "customer:delete",

  "service:view",
  "service:create",
  "service:update",
  "service:delete",

  "employee:view",
  "employee:manage",

  "appointment:view",
  "appointment:create",
  "appointment:update",
  "appointment:cancel",

  "invoice:view",
  "invoice:create",
  "invoice:cancel",
  "payment:create",
  "refund:create",

  "expense:view",
  "expense:create",
  "expense:update",
  "expense:delete",

  "user:manage",
  "user:create-admin",
  "expense:manage-categories",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

const ADMIN_ONLY: Permission[] = [
  "user:create-admin",
  "expense:create",
  "expense:update",
  "expense:delete",
  "service:delete",
  "customer:update",
  "customer:delete",
  "employee:manage",
  "user:manage",
  "expense:manage-categories",
];

// Permissions ADMIN + OWNER have, but MANAGER/RECEPTIONIST don't.
const OWNER_ONLY: Permission[] = [
  "expense:create",
  "expense:update",
  "expense:delete",
  "service:delete",
  "customer:update",
  "customer:delete",
  "employee:manage",
  "user:manage",
  "expense:manage-categories",
];

// Permissions MANAGER has but RECEPTIONIST doesn't.
const RECEPTIONIST_DENY: Permission[] = [
  "service:create",
  "service:update",
  "service:delete",
  "employee:manage",
  "expense:view",
  "expense:create",
  "expense:update",
  "expense:delete",
  "customer:delete",
  "customer:update",
  "user:manage",
  "user:create-admin",
  "expense:manage-categories",
];

function buildMatrix(): Record<Role, Set<Permission>> {
  const admin = new Set<Permission>(ALL_PERMISSIONS);

  const owner = new Set<Permission>(
    ALL_PERMISSIONS.filter((p) => !ADMIN_ONLY.includes(p)),
  );

  const manager = new Set<Permission>(
    ALL_PERMISSIONS.filter(
      (p) => !ADMIN_ONLY.includes(p) && !OWNER_ONLY.includes(p),
    ),
  );

  const receptionist = new Set<Permission>(
    ALL_PERMISSIONS.filter(
      (p) =>
        !ADMIN_ONLY.includes(p) &&
        !OWNER_ONLY.includes(p) &&
        !RECEPTIONIST_DENY.includes(p),
    ),
  );

  return {
    ADMIN: admin,
    OWNER: owner,
    MANAGER: manager,
    RECEPTIONIST: receptionist,
  };
}

const MATRIX = buildMatrix();

export function hasPermission(role: Role, permission: Permission): boolean {
  return MATRIX[role]?.has(permission) ?? false;
}

export function hasAnyPermission(
  role: Role,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Which roles `actorRole` is allowed to assign when creating/editing a user.
 * This is separate from hasPermission because "can manage users" and
 * "can assign this specific role" are different questions.
 */
export function assignableRoles(actorRole: Role): Role[] {
  switch (actorRole) {
    case "ADMIN":
      return ["ADMIN", "OWNER", "MANAGER", "RECEPTIONIST"]; // full range
    case "OWNER":
      return ["MANAGER", "RECEPTIONIST"]; // per your rule — no Owner or Admin creation
    default:
      return [];
  }
}

// Add alongside assignableRoles and whatever exports permissions.ts already has
export function canManageExpenseCategories(role: Role): boolean {
  return role === "OWNER" || role === "ADMIN";
}
