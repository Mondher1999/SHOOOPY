"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Home,
  ShoppingBag,
  Package,
  FolderTree,
  Users,
  Settings,
  LogOut,
  X,
  ArrowRightLeft,
  Tag,
  Mail,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface AdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const pathname = usePathname();
  const { t } = useTranslation("admin");

  const navItems: NavItem[] = [
    { href: "/admin", label: t("sidebar.dashboard"), icon: Home },
    { href: "/admin/orders", label: t("sidebar.orders"), icon: ShoppingBag },
    { href: "/admin/products", label: t("sidebar.products"), icon: Package },
    { href: "/admin/categories", label: t("sidebar.categories"), icon: FolderTree },
    { href: "/admin/coupons", label: t("sidebar.coupons"), icon: Tag },
    { href: "/admin/users", label: t("sidebar.users"), icon: Users },
    { href: "/admin/contacts", label: t("sidebar.contacts"), icon: Mail },
    { href: "/admin/faq", label: t("sidebar.faq"), icon: HelpCircle },
    { href: "/admin/redirects", label: t("sidebar.redirects"), icon: ArrowRightLeft },
    { href: "/admin/settings", label: t("sidebar.settings"), icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
  };

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0">
        <Link
          href="/admin"
          className="text-xl font-semibold text-white tracking-tight"
          onClick={onClose}
        >
          {settings?.store?.name || t("sidebar.appName")}
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded text-polaris-icon-subdued hover:text-white transition-colors cursor-pointer"
            aria-label={t("sidebar.close")}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto" aria-label={t("sidebar.navLabel")}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
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
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full rounded-md px-3 h-9 text-sm text-[#E3E5E7] hover:bg-polaris-nav-item-hover transition-colors cursor-pointer"
        >
          <LogOut className="h-5 w-5 shrink-0 text-polaris-icon-subdued" />
          <span>{t("sidebar.signOut")}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-polaris-nav-bg shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-polaris-nav-bg">
            {navContent}
          </aside>
        </>
      )}
    </>
  );
}
