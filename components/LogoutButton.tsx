// components/LogoutButton.tsx
"use client";

import { useTransition } from "react";
import { logOut } from "@/lib/auth/actions";

const LogoutButton = () => {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logOut())}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-red-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-red-400"
    >
      {isPending ? "Signing out..." : "Sign Out"}
    </button>
  );
};

export default LogoutButton;
