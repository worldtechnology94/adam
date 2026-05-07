"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { OnboardingTour } from "@/app/components/onboarding/OnboardingTour";
export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const openMobileMenu = useCallback(() => setMobileMenuOpen(true), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)] md:flex-row md:items-start">
      <Link
        href="#main-content"
        className="skip-link"
      >
        Skip to main content
      </Link>
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={closeMobileMenu}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <Header onMobileMenuClick={openMobileMenu} />
        <main
          className="flex-1 p-4 md:p-6"
          id="main-content"
          role="main"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
      <OnboardingTour />
    </div>
  );
}
