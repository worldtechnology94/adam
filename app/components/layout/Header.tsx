"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTheme } from "@/app/components/theme-provider";
import { clearMockSession } from "@/app/lib/auth-mock";
import { Sun, Moon, Contrast, User, Menu, LogOut } from "lucide-react";

const themeIcons = {
  light: Sun,
  dark: Moon,
  "high-contrast": Contrast,
} as const;

interface HeaderProps {
  onMobileMenuClick?: () => void;
}

export function Header({ onMobileMenuClick }: HeaderProps) {
  const router = useRouter();
  const { theme, cycleTheme } = useTheme();
  const ThemeIcon = themeIcons[theme];

  const handleThemeClick = useCallback(() => {
    cycleTheme();
  }, [cycleTheme]);

  const handleSignOut = useCallback(() => {
    clearMockSession();
    router.push("/");
  }, [router]);

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4"
      role="banner"
    >
      <div className="flex items-center gap-2">
        {/* Mobile: hamburger to open sidebar drawer */}
        {onMobileMenuClick && (
          <button
            type="button"
            onClick={onMobileMenuClick}
            className="flex size-9 items-center justify-center rounded-md text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] md:hidden"
            aria-label="Open menu"
            aria-expanded={false}
          >
            <Menu className="size-5" aria-hidden />
          </button>
        )}
        <span className="text-sm font-semibold text-[var(--foreground)]">
          ADAM
        </span>
        <span
          className="hidden text-sm text-[var(--muted-foreground)] sm:inline"
          aria-hidden
        >
          — Write it right. Every time.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleThemeClick}
          className="flex size-9 items-center justify-center rounded-md text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          aria-label={`Switch theme (current: ${theme}). Choose light, dark, or high contrast.`}
          title={`Theme: ${theme}. Click to cycle.`}
        >
          <ThemeIcon className="size-5" aria-hidden />
        </button>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-md text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
              aria-label="User menu"
              aria-haspopup="menu"
              title="User menu"
            >
              <User className="size-5" aria-hidden />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[10rem] rounded-md border border-[var(--border)] bg-[var(--background)] py-1 shadow-lg focus:outline-none"
              sideOffset={6}
              aria-label="User actions"
            >
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] focus:bg-[var(--muted)] focus:outline-none"
                onSelect={handleSignOut}
                aria-label="Sign out"
              >
                <LogOut className="size-4" aria-hidden />
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
