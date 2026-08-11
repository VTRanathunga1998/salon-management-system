// components/NavBar.tsx
import { getCurrentUser } from "@/lib/auth/current-user";
import LogoutButton from "./LogoutButton";

const NavBar = async () => {
  const user = await getCurrentUser();

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Salon */}
      <h1 className="text-sm font-semibold tracking-tight text-slate-800">
        AVENUE LADIES SALON
        <span className="mx-2 text-slate-300">|</span>
        <span className="font-normal text-slate-500">+971 56 599 4695</span>
      </h1>

      {/* User */}
      {user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="text-right leading-tight">
              <p className="text-xs font-medium text-slate-700">
                {user.username}
              </p>

              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                {user.role}
              </span>
            </div>

            {/* Avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold uppercase text-slate-600 ring-1 ring-slate-200">
              {user.username?.charAt(0)}
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <LogoutButton />
        </div>
      )}
    </header>
  );
};

export default NavBar;
