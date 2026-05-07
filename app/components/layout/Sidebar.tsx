"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  FileWarning,
  BookOpen,
  MessageSquare,
  FileText,
  FolderOpen,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeft,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/app/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/violations", label: "Violations", icon: FileWarning },
  { href: "/rules", label: "Rules", icon: BookOpen },
  { href: "/ask-adam", label: "Ask ADAM", icon: MessageSquare },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  /* On mobile, close drawer when route changes */
  useEffect(() => {
    onMobileClose?.();
  }, [pathname, onMobileClose]);

  const navContent = (
    <>
      <div className="flex h-14 items-center justify-between gap-2 border-b border-[var(--border)] px-3">
        {!collapsed && (
          <span className="truncate text-sm font-semibold">ADAM</span>
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-foreground)] max-md:hidden"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="size-5" aria-hidden />
            ) : (
              <PanelLeftClose className="size-5" aria-hidden />
            )}
          </button>
          {onMobileClose && (
            <button
              type="button"
              onClick={onMobileClose}
              className="flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-foreground)] md:hidden"
              aria-label="Close menu"
            >
              <X className="size-5" aria-hidden />
            </button>
          )}
        </div>
      </div>
      <nav className="sidebar-nav flex-1 overflow-y-auto py-2" aria-label="App sections">
        <ul className="space-y-0.5 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    "hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-foreground)]",
                    isActive
                      ? "bg-white/15 text-[var(--primary-foreground)]"
                      : "text-[var(--primary-foreground)]/90"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className="size-5 shrink-0"
                    aria-hidden
                    strokeWidth={2}
                  />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );

  /* Mobile: overlay drawer */
  return (
    <>
      {/* Backdrop when mobile menu is open */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-label="Close menu"
          onClick={onMobileClose}
          tabIndex={-1}
        />
      )}
      <aside
        className={cn(
          "flex flex-col border-r border-[var(--border)] bg-[var(--primary)] text-[var(--primary-foreground)] transition-[width] duration-200 ease-in-out",
          collapsed ? "w-[4rem]" : "w-56",
          "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:shadow-xl max-md:transition-transform",
          mobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full",
          "md:sticky md:top-0 md:self-start md:h-screen md:min-h-0 md:shrink-0",
          "md:shadow-[2px_0_16px_rgba(0,0,0,0.06)] dark:md:shadow-[2px_0_20px_rgba(0,0,0,0.25)]"
        )}
        aria-label="Main navigation"
        aria-hidden={!mobileOpen}
      >
        {navContent}
      </aside>
    </>
  );
}
