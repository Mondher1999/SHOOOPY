"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Menu, Search, ExternalLink, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { cn } from "@/lib/utils";

interface AdminTopBarProps {
  onMenuClick: () => void;
}

export function AdminTopBar({ onMenuClick }: AdminTopBarProps) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation("admin");
  const { theme, toggleTheme } = useTheme();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
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

      {/* Store chip — links back to storefront */}
      <Link
        href="/"
        className={cn(
          "hidden sm:inline-flex items-center gap-1.5 shrink-0",
          "h-8 px-3 rounded-md border border-polaris-border bg-polaris-bg",
          "text-sm font-medium text-polaris-text",
          "hover:bg-polaris-surface-hovered hover:border-polaris-border-hovered",
          "transition-colors cursor-pointer group"
        )}
        title={settings?.store?.name}
      >
        <span>{t("topbar.viewStore")}</span>
        <ExternalLink className="h-3.5 w-3.5 text-polaris-icon-subdued group-hover:text-polaris-text transition-colors shrink-0" />
      </Link>

      {/* Mobile: icon-only store link */}
      <Link
        href="/"
        className="sm:hidden p-1.5 rounded hover:bg-polaris-surface-hovered transition-colors cursor-pointer"
        title={t("topbar.viewStore")}
        aria-label={t("topbar.viewStore")}
      >
        <ExternalLink className="h-5 w-5 text-polaris-icon" />
      </Link>

      {/* Search bar */}
      <div className="flex-1 max-w-[480px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-polaris-icon-subdued" />
          <input
            type="text"
            placeholder={t("topbar.searchPlaceholder")}
            className={cn(
              "w-full h-9 pl-9 pr-3 text-sm rounded bg-polaris-bg border border-polaris-border",
              "placeholder:text-polaris-text-subdued text-polaris-text",
              "focus:outline-none focus:ring-1 focus:ring-polaris-primary focus:border-polaris-primary",
              "transition-colors"
            )}
          />
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Language switcher */}
      <LanguageSwitcher iconClassName="text-polaris-icon" />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label={theme === "dark" ? t("topbar.switchToLight") : t("topbar.switchToDark")}
        className="relative h-8 w-8 rounded flex items-center justify-center text-polaris-icon hover:bg-polaris-surface-hovered transition-colors cursor-pointer"
      >
        <Sun
          className={cn(
            "h-[18px] w-[18px] absolute transition-all duration-300",
            theme === "dark" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
          )}
        />
        <Moon
          className={cn(
            "h-[18px] w-[18px] absolute transition-all duration-300",
            theme === "light" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          )}
        />
      </button>

      {/* Store branding — logo + name + admin label */}
      <div className="hidden md:flex items-center gap-2.5 shrink-0 pl-1 border-l border-polaris-border ml-1">
        {settings?.store?.logoEnabled && settings?.store?.logo && (
          <img
            src={settings.store.logo}
            alt={settings.store.name}
            className="h-7 w-auto max-w-[40px] object-contain rounded"
          />
        )}
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-polaris-text truncate max-w-[140px]">
            {settings?.store?.name || "ShopFlow"}
          </span>
          <span className="text-[10px] text-polaris-text-subdued">
            {t("topbar.adminPanel", { defaultValue: "Administration" })}
          </span>
        </div>
      </div>

      {/* User avatar */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="h-8 w-8 rounded-full bg-polaris-primary flex items-center justify-center text-xs font-semibold text-white shrink-0">
          {initials}
        </div>
      </div>
    </header>
  );
}
