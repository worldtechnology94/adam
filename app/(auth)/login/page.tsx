"use client";

import { useState, useCallback, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setMockSession } from "@/app/lib/auth-mock";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setError("Please enter your email address.");
        return;
      }
      if (!password) {
        setError("Please enter your password.");
        return;
      }
      setMockSession(trimmedEmail);
      router.replace("/dashboard");
    },
    [email, password, router]
  );

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Demo mode — no real authentication. Enter any email and password to continue.
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 shadow-sm"
        aria-labelledby="login-heading"
        noValidate
      >
        <h2 id="login-heading" className="sr-only">
          Sign in to ADAM
        </h2>
        {error && (
          <div
            className="rounded-md border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]"
            role="alert"
          >
            {error}
          </div>
        )}
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-[var(--foreground)]">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoCapitalize="none"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            placeholder="you@example.com"
            required
            aria-required="true"
            aria-invalid={!!error}
          />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-[var(--foreground)]">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            placeholder="••••••••"
            required
            aria-required="true"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          aria-label="Sign in to ADAM"
        >
          Sign in
        </button>
      </form>
      <p className="text-center text-sm text-[var(--muted-foreground)]">
        <Link
          href="/"
          className="font-medium text-[var(--primary)] underline hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded"
        >
          Back to home
        </Link>
      </p>
    </div>
  );
}
