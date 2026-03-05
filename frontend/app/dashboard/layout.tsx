"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { User, Lock, Users, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation("dashboard");

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth/login");
    }
  }, [isLoading, user, router]);

  // Show loading skeleton while auth state resolves
  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-64 flex-col border-r bg-card p-4 gap-2">
          <Skeleton className="h-8 w-32 mb-4" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </aside>
        <main className="flex-1 p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  // Redirect handled in useEffect — render nothing while redirecting
  if (!user) return null;

  const navItems: NavItem[] = [
    {
      href: "/dashboard/profile",
      label: t("nav.profile"),
      icon: <User className="h-4 w-4" />,
    },
    {
      href: "/dashboard/change-password",
      label: t("nav.security"),
      icon: <Lock className="h-4 w-4" />,
    },
    ...(user.role === "admin"
      ? [
          {
            href: "/admin/users",
            label: t("nav.users"),
            icon: <Users className="h-4 w-4" />,
            adminOnly: true,
          },
        ]
      : []),
  ];

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card">
        <div className="p-4 border-b">
          <Link href="/" className="text-lg font-semibold text-foreground hover:text-primary">
            ShopFlow
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1" aria-label="Dashboard navigation">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {item.icon}
                {item.label}
                {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-3">
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          <Separator />
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {t("common:nav.signOut")}
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-10 border-b bg-card px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-base font-semibold">
          ShopFlow
        </Link>
        <nav className="flex items-center gap-1" aria-label="Dashboard navigation">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:p-8 p-4 pt-20 lg:pt-8 max-w-4xl">{children}</main>
    </div>
  );
}
