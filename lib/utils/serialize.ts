import { Prisma } from "@prisma/client";

export function serializeData<T>(value: T): T {
  if (value === null || value === undefined) return value;

  if (value instanceof Prisma.Decimal) {
    return Number(value) as unknown as T;
  }

  if (value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeData(item)) as unknown as T;
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = serializeData(val);
    }
    return result as T;
  }

  return value;
}
