import Menu from "@/components/Menu";
import NavBar from "@/components/NavBar";
import Image from "next/image";
import Link from "next/link";
import { requireRouteAccess } from "@/lib/auth/guards";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireRouteAccess();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Sidebar ── */}
      <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] flex flex-col h-screen sticky top-0 bg-white border-r border-slate-100 overflow-y-auto scrollbar-hidden flex-shrink-0">
        <Link
          href="/"
          className="flex items-center justify-center lg:justify-start gap-2.5 px-4 py-4 border-b border-slate-100 flex-shrink-0"
        >
          <Image
            src="/logo.png"
            alt="Avenue Ladies Salon"
            width={32}
            height={32}
            className="w-8 h-auto"
          />
          <span className="hidden lg:block text-sm font-bold text-slate-800 tracking-tight" />
        </Link>

        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          <Menu role={user.role} />{" "}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F7F8FA]">
        <div className="flex-shrink-0 sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
          <NavBar />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
