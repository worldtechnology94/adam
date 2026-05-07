"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMockSession } from "@/app/lib/auth-mock";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<ReturnType<typeof getMockSession>>(null);

  useEffect(() => {
    setSession(getMockSession());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (session) router.replace("/dashboard");
  }, [mounted, session, router]);

  if (!mounted || session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4">
        <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[var(--background)] px-4 text-[var(--foreground)]">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          ADAM
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Automated Document Analysis &amp; Management
        </p>
        <p className="mt-2 text-base italic text-[var(--muted-foreground)]">
          Write it right. Every time.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/login"
          className="rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          aria-label="Sign in to ADAM"
        >
          Sign in
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          aria-label="Go to Dashboard without signing in"
        >
          Get started
        </Link>
      </div>
    </div>
  );
}
