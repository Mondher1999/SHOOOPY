"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { User, Lock, ShoppingBag, LayoutDashboard, LogOut, X, Menu, Store } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation(["dashboard", "common"]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="admin-polaris flex min-h-screen">
        <aside className="hidden lg:flex w-60 flex-col bg-polaris-nav-bg p-4 gap-2">
          <Skeleton className="h-7 w-32 mb-4 bg-[#333536]" />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-full bg-[#333536]" />
          ))}
        </aside>
        <div className="flex-1 flex flex-col">
          <Skeleton className="h-14 w-full" />
          <main className="flex-1 p-6">
            <Skeleton className="h-8 w-48 mb-6" />
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems: NavItem[] = [
    { href: "/dashboard/profile", label: t("dashboard:nav.profile"), icon: User },
    { href: "/dashboard/change-password", label: t("dashboard:nav.security"), icon: Lock },
    { href: "/dashboard/orders", label: t("dashboard:nav.orders"), icon: ShoppingBag },
    ...(user.role === "admin"
      ? [{ href: "/admin", label: t("dashboard:nav.adminDashboard"), icon: LayoutDashboard, adminOnly: true }]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Title */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0">
        <Link href="/" className="text-base font-semibold text-white tracking-tight hover:text-white/80 transition-colors">
          {t("dashboard:nav.myAccount")}
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1 rounded text-[#8C9196] hover:text-white transition-colors cursor-pointer"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto" aria-label={t("dashboard:nav.myAccount")}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 h-9 text-sm transition-colors relative",
                active
                  ? "bg-polaris-nav-item-active text-white font-medium"
                  : "text-[#E3E5E7] hover:bg-polaris-nav-item-hover"
              )}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r bg-polaris-primary" />
              )}
              <Icon className={cn("h-5 w-5 shrink-0", active ? "text-white" : "text-polaris-icon-subdued")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-3 space-y-1 border-t border-[#333536] pt-3 mt-auto">
        {user && (
          <div className="px-3 py-1.5">
            <p className="text-xs text-[#8C9196] truncate">{user.name}</p>
            <p className="text-[11px] text-[#636669] truncate">{user.email}</p>
          </div>
        )}
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md px-3 h-9 text-sm text-[#E3E5E7] hover:bg-polaris-nav-item-hover transition-colors"
        >
          <Store className="h-5 w-5 shrink-0 text-polaris-icon-subdued" />
          <span>{t("dashboard:nav.backToWebsite")}</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full rounded-md px-3 h-9 text-sm text-[#E3E5E7] hover:bg-polaris-nav-item-hover transition-colors cursor-pointer"
        >
          <LogOut className="h-5 w-5 shrink-0 text-polaris-icon-subdued" />
          <span>{t("common:nav.signOut")}</span>
        </button>
      </div>
    </div>
  );

  return (
    /* admin-polaris is ALWAYS on root so sidebar CSS vars (--polaris-nav-bg etc.) are always defined.
       The content area reverts to standard theme vars on non-polaris pages via dashboard-content class. */
    <div className="admin-polaris flex min-h-screen">
      {/* Desktop sidebar — always Polaris dark nav regardless of page */}
      <aside className="hidden lg:flex w-60 flex-col bg-polaris-nav-bg shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-polaris-nav-bg">
            {navContent}
          </aside>
        </>
      )}

      {/* Main content column */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Mobile topbar */}
        <div className="lg:hidden sticky top-0 z-30 h-14 px-4 flex items-center gap-3 shadow-sm border-b bg-polaris-surface border-polaris-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded text-polaris-icon hover:bg-polaris-surface-hovered transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="text-sm font-semibold text-polaris-text">
            {t("dashboard:nav.myAccount")}
          </Link>
        </div>

        <main className="flex-1 lg:p-6 p-4 pt-4 overflow-auto bg-polaris-bg">
          <div className="max-w-3xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
