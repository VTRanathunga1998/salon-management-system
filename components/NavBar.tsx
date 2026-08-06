// components/NavBar.tsx
import { getCurrentUser } from "@/lib/auth/current-user";
import LogoutButton from "./LogoutButton";

const NavBar = async () => {
  const user = await getCurrentUser();

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-slate-200">
      <h1 className="text-md font-semibold text-slate-800">
        Salon Management System
      </h1>

      {user && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {user.username}
            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium uppercase tracking-wide">
              {user.role}
            </span>
          </span>
          <LogoutButton />
        </div>
      )}
    </header>
  );
};

export default NavBar;
