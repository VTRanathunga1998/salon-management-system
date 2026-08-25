// app/(dashboard)/expenses/layout.tsx
import { requireRole } from "@/lib/auth/guards";

export default async function ExpensesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["OWNER", "MANAGER"]);
  return <>{children}</>;
}
