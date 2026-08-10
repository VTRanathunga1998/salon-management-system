"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useActionState, useEffect, startTransition } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { signIn } from "@/lib/auth/actions";

const signInSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type SignInSchema = z.infer<typeof signInSchema>;

const SignInForm = () => {
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: { username: "", password: "" },
  });

  const [showPassword, setShowPassword] = useState(false);

  const [state, formAction, pending] = useActionState(signIn, {
    success: false,
    error: false,
    message: "",
  });

  useEffect(() => {
    if (state.error) {
      setFocus("password");
    }
  }, [state, setFocus]);

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData();

    formData.append("username", data.username);
    formData.append("password", data.password);

    startTransition(() => {
      formAction(formData);
    });
  });

  const handleUsernameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setFocus("password");
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="w-full">
      {state.error && (
        <div className="flex items-center gap-2 mb-4 rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 animate-[shake_0.4s]">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-xs font-medium text-red-600">{state.message}</p>
        </div>
      )}

      {/* Username */}
      <div className="flex flex-col gap-2 mb-4">
        <label className="text-xs font-semibold text-stone-600">Username</label>
        <input
          type="text"
          placeholder="username"
          autoComplete="username"
          aria-invalid={!!errors.username}
          aria-describedby={errors.username ? "username-error" : undefined}
          {...register("username")}
          onKeyDown={handleUsernameKeyDown}
          className={`w-full rounded-xl border bg-stone-50 py-3 px-4 text-sm outline-none transition focus:bg-white focus:ring-4 ${
            errors.username
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : "border-stone-200 focus:border-orange-500 focus:ring-orange-100"
          }`}
        />
        {errors.username && (
          <p
            id="username-error"
            className="flex items-center gap-1 text-xs text-red-500 animate-[fadeIn_0.15s_ease]"
          >
            <AlertCircle className="h-3 w-3 shrink-0" />
            {errors.username.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2 mb-4">
        <label className="text-xs font-semibold text-stone-600">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
            className={`w-full rounded-xl border bg-stone-50 py-3 px-4 pr-11 text-sm outline-none transition focus:bg-white focus:ring-4 ${
              errors.password
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-stone-200 focus:border-orange-500 focus:ring-orange-100"
            }`}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition cursor-pointer"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p
            id="password-error"
            className="flex items-center gap-1 text-xs text-red-500 animate-[fadeIn_0.15s_ease]"
          >
            <AlertCircle className="h-3 w-3 shrink-0" />
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl py-3 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
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
