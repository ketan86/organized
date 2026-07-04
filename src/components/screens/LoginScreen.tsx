"use client";

import { FormEvent, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

type LoginScreenProps = {
  onContinue?: () => void;
  onCreateAccount?: () => void;
};

export function LoginScreen({ onContinue, onCreateAccount }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onContinue?.();
  }

  return (
    <div className="relative flex min-h-full flex-col px-6 pb-8 pt-14">
      {/* Background orbs — hint of Life Orbit */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-pulse-soft absolute -left-10 top-16 h-40 w-40 rounded-full bg-app-accent-soft blur-3xl" />
        <div className="animate-pulse-soft absolute -right-8 top-40 h-36 w-36 rounded-full bg-app-success blur-3xl" />
        <div className="animate-float-orb absolute left-10 top-28 h-16 w-16 rounded-full bg-violet-400/30 blur-sm" />
        <div className="animate-float-orb-delayed absolute right-12 top-44 h-12 w-12 rounded-full bg-teal-300/25 blur-sm" />
        <div className="animate-float-orb-slow absolute bottom-40 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full bg-amber-300/15 blur-md" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        {/* Brand */}
        <div className="mt-6 mb-12 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-app-card border border-app backdrop-blur">
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
            Protect what matters. Spend money to buy time.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-app-muted">
              Email
            </span>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-app bg-app-input px-4 py-3.5 text-[15px] text-app outline-none placeholder-app focus:border-app-accent focus:bg-app-chip focus:ring-2 focus:ring-violet-500/20"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-app-muted">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-app bg-app-input px-4 py-3.5 text-[15px] text-app outline-none placeholder-app focus:border-app-accent focus:bg-app-chip focus:ring-2 focus:ring-violet-500/20"
            />
          </label>

          <button
            type="submit"
            className="mt-2 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-violet-400 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-violet-500/25 transition active:scale-[0.98]"
          >
            Continue
          </button>
        </form>

        <button
          type="button"
          onClick={onCreateAccount}
          className="mt-4 text-center text-sm text-app-secondary transition hover:text-app"
        >
          Create account
        </button>

        {/* Divider */}
        <div className="my-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-app-chip" />
          <span className="text-xs uppercase tracking-wider text-app-faint">
            or continue with
          </span>
          <div className="h-px flex-1 bg-app-chip" />
        </div>

        {/* Social — visual only */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="flex items-center justify-center gap-2 rounded-2xl border border-app bg-app-card py-3.5 text-sm font-medium text-app transition active:scale-[0.98]"
          >
            <AppleIcon />
            Apple
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="flex items-center justify-center gap-2 rounded-2xl border border-app bg-app-card py-3.5 text-sm font-medium text-app transition active:scale-[0.98]"
          >
            <GoogleIcon />
            Google
          </button>
        </div>

        <p className="mt-auto pt-10 text-center text-[11px] leading-relaxed text-app-faint">
          Prototype UI — no real auth yet
        </p>
      </div>
    </div>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.9 2.4 2.8 6.5 2.8 11.6S6.9 20.8 12 20.8c6.9 0 8.1-4.8 8.1-7.3 0-.5 0-.8-.1-1.2H12z"
      />
    </svg>
  );
}
