import { requireRole } from "@/lib/auth/guards";

export default async function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["OWNER", "ADMIN"]);
  return <>{children}</>;
}
