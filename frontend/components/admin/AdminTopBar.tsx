"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Menu, ExternalLink, Sun, Moon, ChevronRight, Store } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { cn } from "@/lib/utils";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

interface AdminTopBarProps {
  onMenuClick: () => void;
}

export function AdminTopBar({ onMenuClick }: AdminTopBarProps) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation("admin");
  const { theme, toggleTheme } = useTheme();

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <header className="sticky top-0 z-30 flex items-center h-14 bg-polaris-surface border-b border-polaris-border px-4 lg:px-5 gap-3">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 -ml-1.5 rounded hover:bg-polaris-surface-hovered transition-colors cursor-pointer"
        aria-label={t("sidebar.expand")}
      >
        <Menu className="h-5 w-5 text-polaris-icon" />
      </button>

      {/* Breadcrumb — Logo + Store name > Admin */}
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-polaris-surface-hovered">
          {settings?.store?.logoEnabled && settings?.store?.logo ? (
            <img
              src={settings.store.logo?.startsWith("/") ? `${BASE_URL}${settings.store.logo}` : settings.store.logo}
              alt={settings?.store?.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[11px] font-bold text-polaris-text">
              {(settings?.store?.name || "S").charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <span className="hidden sm:block text-[13px] font-semibold text-polaris-text truncate max-w-[150px]">
          {settings?.store?.name || "ShopFlow"}
        </span>

        <ChevronRight className="hidden sm:block h-3.5 w-3.5 text-polaris-icon-subdued shrink-0" />

        <span className="hidden sm:block text-[13px] text-polaris-text-subdued font-medium">
          {t("topbar.adminPanel", { defaultValue: "Admin" })}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* View store — prominent button */}
        <Link
          href="/"
          className={cn(
            "inline-flex items-center gap-2 shrink-0",
            "h-8 px-3.5 rounded-lg border border-polaris-primary/30",
            "text-xs font-semibold text-polaris-primary",
            "bg-polaris-primary/5 hover:bg-polaris-primary/10 hover:border-polaris-primary/50",
            "transition-all cursor-pointer group"
          )}
          title={t("topbar.viewStore")}
        >
          <Store className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">{t("topbar.viewStore")}</span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
        </Link>

        <div className="h-5 w-px bg-polaris-border mx-2 shrink-0" />

        {/* Utility icons */}
        <div className="flex items-center gap-0.5">
          <LanguageSwitcher iconClassName="text-polaris-icon" />

          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? t("topbar.switchToLight") : t("topbar.switchToDark")}
            className="relative h-8 w-8 rounded-lg flex items-center justify-center text-polaris-icon hover:bg-polaris-surface-hovered transition-colors cursor-pointer"
          >
            <Sun className={cn("h-[18px] w-[18px] absolute transition-all duration-300", theme === "dark" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0")} />
            <Moon className={cn("h-[18px] w-[18px] absolute transition-all duration-300", theme === "light" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")} />
          </button>
        </div>

        <div className="h-5 w-px bg-polaris-border mx-2 shrink-0" />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex flex-col items-end leading-tight">
            <span className="text-[12px] font-medium text-polaris-text truncate max-w-[120px]">
              {user?.name || "Admin"}
            </span>
            <span className="text-[10px] text-polaris-text-subdued capitalize">
              {user?.role || "admin"}
            </span>
          </div>
          <div className="h-8 w-8 rounded-full bg-polaris-primary flex items-center justify-center text-xs font-semibold text-white shrink-0 ring-2 ring-polaris-primary/20">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
