// components/LogoutButton.tsx
"use client";

import Image from "next/image";
import { useTransition } from "react";
import { logOut } from "@/lib/auth/actions";

const LogoutButton = () => {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logOut())}
      disabled={isPending}
      title="Sign Out"
      aria-label="Sign Out"
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 md:px-4"
    >
      <Image
        src="/logout.png"
        alt=""
        width={17}
        height={17}
        className="h-[17px] w-[17px] brightness-0 opacity-60"
      />

      <span className="hidden md:inline">
        {isPending ? "Signing out..." : "Sign Out"}
      </span>
    </button>
  );
};

export default LogoutButton;
