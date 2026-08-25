// lib/auth/route-access-map.ts
import type { Role } from "@/lib/auth/permissions";

export const routeAccessMap: Record<string, Role[]> = {
  "/invoice(.*)": ["ADMIN", "OWNER", "MANAGER", "RECEPTIONIST"],
  "/appointments(.*)": ["ADMIN", "OWNER", "MANAGER", "RECEPTIONIST"],
  "/customers(.*)": ["ADMIN", "OWNER", "MANAGER", "RECEPTIONIST"],
  "/services(.*)": ["ADMIN", "OWNER", "MANAGER"],
  "/employees(.*)": ["ADMIN", "OWNER", "MANAGER"],
  "/expenses(.*)": ["ADMIN", "OWNER", "MANAGER"],
  "/reports(.*)": ["ADMIN", "OWNER", "MANAGER"],
  "/settings/users(.*)": ["ADMIN", "OWNER"],
  "/report(.*)": ["ADMIN", "OWNER"],
  "/settings(.*)": ["ADMIN", "OWNER"],
};
