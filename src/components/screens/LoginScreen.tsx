"use client";

import { FormEvent, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

type LoginScreenProps = {
  mode?: "login" | "register";
  loading?: boolean;
  error?: string | null;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string) => Promise<void>;
  onToggleMode?: () => void;
};

export function LoginScreen({
  mode = "login",
  loading = false,
  error,
  onLogin,
  onRegister,
  onToggleMode,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "register") {
      await onRegister(email, password);
    } else {
      await onLogin(email, password);
    }
  }

  return (
    <div className="relative flex min-h-full flex-col px-6 pb-8 pt-14">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-pulse-soft absolute -left-10 top-16 h-40 w-40 rounded-full bg-app-accent-soft blur-3xl" />
        <div className="animate-pulse-soft absolute -right-8 top-40 h-36 w-36 rounded-full bg-app-success blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <div className="mt-6 mb-12 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-app bg-app-card backdrop-blur">
            <div className="relative h-8 w-8">
              <span className="absolute left-1 top-1 h-3.5 w-3.5 rounded-full bg-violet-400/90" />
              <span className="absolute right-0.5 top-2 h-2.5 w-2.5 rounded-full bg-teal-300/80" />
              <span className="absolute bottom-0.5 left-2.5 h-3 w-3 rounded-full bg-amber-300/70" />
            </div>
          </div>
          <h1 className="text-[2rem] font-semibold tracking-tight text-app">
            Organized
          </h1>
          <p className="mt-2 text-lg font-medium text-app-tagline">
            Get your time back
          </p>
          <p className="mx-auto mt-2 max-w-[260px] text-sm leading-relaxed text-app-muted">
            {mode === "register"
              ? "Create your account and set up your life orbit."
              : "Sign in to your life orbit."}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-app-warning bg-app-warning px-3.5 py-2.5 text-sm text-app-warning-soft">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-app-muted">
              Email
            </span>
            <input
              type="email"
              autoComplete="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-app w-full px-4 py-3.5 text-[15px]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-app-muted">
              Password
            </span>
            <input
              type="password"
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              required
              minLength={8}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-app w-full px-4 py-3.5 text-[15px]"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full btn-primary btn-lg disabled:opacity-60"
          >
            {loading
              ? "Please wait…"
              : mode === "register"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          onClick={onToggleMode}
          className="mt-4 text-center text-sm text-app-secondary transition hover:text-app"
        >
          {mode === "register"
            ? "Already have an account? Sign in"
            : "Create account"}
        </button>
      </div>
    </div>
  );
}
