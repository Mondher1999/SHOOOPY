"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function AdminSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { t } = useTranslation("admin");
  const [collapsed, setCollapsed] = useState(false);

  const navItems: NavItem[] = [
    {
      href: "/admin",
      label: t("sidebar.dashboard"),
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
    },
    {
      href: "/admin/orders",
      label: t("sidebar.orders"),
      icon: <ShoppingBag className="h-4 w-4 shrink-0" />,
    },
    {
      href: "/admin/products",
      label: t("sidebar.products"),
      icon: <Package className="h-4 w-4 shrink-0" />,
    },
    {
      href: "/admin/categories",
      label: t("sidebar.categories"),
      icon: <FolderTree className="h-4 w-4 shrink-0" />,
    },
    {
      href: "/admin/users",
      label: t("sidebar.users"),
      icon: <Users className="h-4 w-4 shrink-0" />,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r bg-card transition-all duration-200",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div className="p-4 border-b flex items-center justify-between min-h-[57px]">
          {!collapsed && (
            <Link href="/admin" className="text-lg font-semibold text-foreground hover:text-primary">
              {t("sidebar.appName")}
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", collapsed && "mx-auto")}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 p-2 space-y-1" aria-label={t("sidebar.navLabel")}>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-2",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t space-y-2">
          {!collapsed && user && (
            <div className="px-3 py-1 text-xs text-muted-foreground truncate">{user.email}</div>
          )}
          <Separator />
          <Button
            variant="ghost"
            className={cn(
              "w-full text-muted-foreground hover:text-destructive",
              collapsed ? "justify-center px-2" : "justify-start gap-2"
            )}
            onClick={handleLogout}
            title={collapsed ? t("sidebar.signOut") : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{t("sidebar.signOut")}</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-10 border-b bg-card px-4 h-14 flex items-center justify-between">
        <Link href="/admin" className="text-base font-semibold">
          {t("sidebar.appName")}
        </Link>
        <nav className="flex items-center gap-1" aria-label={t("sidebar.navLabel")}>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
