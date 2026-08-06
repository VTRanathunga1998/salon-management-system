"use client";

import { useActionState } from "react";
import { signIn } from "@/lib/auth/actions";

const SignInForm = () => {
  const [state, action, pending] = useActionState(signIn, {
    success: false,
    error: false,
    message: "",
  });

  return (
    <form action={action}>
      {state.error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-4">
          {state.message}
        </div>
      )}

      <div className="flex flex-col gap-2 mb-4">
        <label className="text-xs font-semibold text-stone-600">Username</label>
        <input
          type="text"
          name="username"
          placeholder="username"
          className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 px-4 text-sm outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
        />
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <label className="text-xs font-semibold text-stone-600">Password</label>
        <input
          type="password"
          name="password"
          placeholder="••••••••"
          className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 px-4 text-sm outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl py-3 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign In"}
      </button>

      <div className="flex justify-center mt-3 text-xs text-stone-400">
        Salon owner access only
      </div>
    </form>
  );
};

export default SignInForm;
