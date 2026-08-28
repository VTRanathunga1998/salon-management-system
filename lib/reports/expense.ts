import { prisma } from "@/lib/prisma";
import { toDateInputInSalonTz, toMonthInSalonTz } from "@/lib/utils/timezone";

export interface ExpenseReportFilters {
  from: Date;
  to: Date;
  categoryId?: string; // Expense.categoryId is a String FK to ExpenseCategory.id
}

export async function getExpenseReportData({
  from,
  to,
  categoryId,
}: ExpenseReportFilters) {
  const expenses = await prisma.expense.findMany({
    where: {
      date: { gte: from, lte: to },
      ...(categoryId ? { categoryId } : {}),
    },
    include: {
      category: true,
    },
    orderBy: { date: "desc" },
  });
  const totalAmount = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );

  // ─────────────────────────────────────────────
  // Category breakdown
  // ─────────────────────────────────────────────

  const categoryMap = new Map<string, number>();

  for (const expense of expenses) {
    const categoryName = expense.category.name;

    categoryMap.set(
      categoryName,
      (categoryMap.get(categoryName) ?? 0) + Number(expense.amount),
    );
  }

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  // ─────────────────────────────────────────────
  // Payment method breakdown
  // ─────────────────────────────────────────────

  const methodMap = new Map<string, number>();

  for (const expense of expenses) {
    methodMap.set(
      expense.method,
      (methodMap.get(expense.method) ?? 0) + Number(expense.amount),
    );
  }

  const methodBreakdown = Array.from(methodMap.entries()).map(
    ([method, amount]) => ({
      method,
      amount,
    }),
  );

  // ─────────────────────────────────────────────
  // Chart granularity
  // ─────────────────────────────────────────────

  const rangeDays = Math.max(
    1,
    Math.ceil((to.getTime() - from.getTime()) / 86_400_000),
  );

  const granularity: "day" | "month" = rangeDays <= 31 ? "day" : "month";

  // ─────────────────────────────────────────────
  // Salon timezone buckets
  // ─────────────────────────────────────────────

  const bucketKey = (date: Date) =>
    granularity === "day" ? toDateInputInSalonTz(date) : toMonthInSalonTz(date);

  const seriesMap = new Map<string, number>();

  for (const expense of expenses) {
    const key = bucketKey(new Date(expense.date));

    seriesMap.set(key, (seriesMap.get(key) ?? 0) + Number(expense.amount));
  }

  const series = Array.from(seriesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({
      date,
      amount,
    }));

  // ─────────────────────────────────────────────
  // Return report
  // ─────────────────────────────────────────────

  return {
    range: {
      from,
      to,
      granularity,
    },

    summary: {
      totalAmount,
      count: expenses.length,
    },

    categoryBreakdown,

    methodBreakdown,

    series,

    expenses: expenses.map((expense) => ({
      id: expense.id,
      title: expense.title,

      // Return category name instead of the old enum
      category: expense.category.name,

      // Useful if the UI needs the category ID
      categoryId: expense.categoryId,

      amount: Number(expense.amount),
      method: expense.method,
      date: expense.date,
      notes: expense.notes,
    })),
  };
}

export type ExpenseReportData = Awaited<
  ReturnType<typeof getExpenseReportData>
>;
