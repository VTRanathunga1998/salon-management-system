// components/NavBar.tsx
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth/current-user";
import LogoutButton from "./LogoutButton";

const NavBar = async () => {
  const user = await getCurrentUser();

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      {/* Salon — hidden on small screens */}
      <h1 className="hidden text-sm font-semibold tracking-tight text-slate-800 md:block">
        AVENUE LADIES SALON
        <span className="mx-2 text-slate-300">|</span>
        <span className="font-normal text-slate-500">+971 56 599 4695</span>
      </h1>

      {user && (
        <div className="ml-auto flex items-center">
          {/* User — visible from md */}
          <div className="hidden items-center gap-2.5 md:flex">
            <div className="text-right leading-tight">
              <p className="text-xs font-medium text-slate-700">
                {user.username}
              </p>

              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                {user.role}
              </span>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold uppercase text-slate-600 ring-1 ring-slate-200">
              {user.username?.charAt(0)}
            </div>
          </div>

          {/* Divider — visible from md */}
          <div className="mx-4 hidden h-6 w-px bg-slate-200 md:block" />

          {/* Logout */}
          <LogoutButton />
        </div>
      )}
    </header>
  );
};

export default NavBar;
