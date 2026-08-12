import { prisma } from "@/lib/prisma";
import { ExpenseCategory } from "@prisma/client";

export interface ExpenseReportFilters {
  from: Date;
  to: Date;
  category?: ExpenseCategory; // undefined = all categories
}

export async function getExpenseReportData({
  from,
  to,
  category,
}: ExpenseReportFilters) {
  const expenses = await prisma.expense.findMany({
    where: {
      date: { gte: from, lte: to },
      ...(category ? { category } : {}),
    },
    orderBy: { date: "desc" },
  });

  const totalAmount = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const categoryMap = new Map<string, number>();
  for (const e of expenses) {
    categoryMap.set(
      e.category,
      (categoryMap.get(e.category) ?? 0) + Number(e.amount),
    );
  }
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([cat, amount]) => ({ category: cat, amount }))
    .sort((a, b) => b.amount - a.amount);

  const methodMap = new Map<string, number>();
  for (const e of expenses) {
    methodMap.set(e.method, (methodMap.get(e.method) ?? 0) + Number(e.amount));
  }
  const methodBreakdown = Array.from(methodMap.entries()).map(
    ([method, amount]) => ({ method, amount }),
  );

  const rangeDays = Math.max(
    1,
    Math.ceil((to.getTime() - from.getTime()) / 86_400_000),
  );
  const granularity: "day" | "month" = rangeDays <= 31 ? "day" : "month";
  const bucketKey = (d: Date) =>
    granularity === "day"
      ? d.toISOString().slice(0, 10)
      : d.toISOString().slice(0, 7);

  const seriesMap = new Map<string, number>();
  for (const e of expenses) {
    const key = bucketKey(new Date(e.date));
    seriesMap.set(key, (seriesMap.get(key) ?? 0) + Number(e.amount));
  }
  const series = Array.from(seriesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));

  return {
    range: { from, to, granularity },
    summary: { totalAmount, count: expenses.length },
    categoryBreakdown,
    methodBreakdown,
    series,
    expenses: expenses.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      amount: Number(e.amount),
      method: e.method,
      date: e.date,
      notes: e.notes,
    })),
  };
}

export type ExpenseReportData = Awaited<
  ReturnType<typeof getExpenseReportData>
>;
