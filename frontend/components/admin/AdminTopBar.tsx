"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Menu, ExternalLink, Sun, Moon } from "lucide-react";
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

      {/* Voir la boutique — desktop */}
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

      {/* Push right items to far right */}
      <div className="flex-1" />

      {/* Language switcher */}
      <LanguageSwitcher iconClassName="text-polaris-icon" />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label={theme === "dark" ? t("topbar.switchToLight") : t("topbar.switchToDark")}
        className="relative h-8 w-8 rounded flex items-center justify-center text-polaris-icon hover:bg-polaris-surface-hovered transition-colors cursor-pointer"
      >
        <Sun className={cn("h-[18px] w-[18px] absolute transition-all duration-300", theme === "dark" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0")} />
        <Moon className={cn("h-[18px] w-[18px] absolute transition-all duration-300", theme === "light" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")} />
      </button>

      {/* Store branding — logo (circle) + name + "Administration" */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        {/* Logo: circular container — shows store logo if configured, else initials */}
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
          style={{ border: "2px solid var(--polaris-primary, #008060)" }}
        >
          {settings?.store?.logoEnabled && settings?.store?.logo ? (
            <img
              src={settings.store.logo?.startsWith("/") ? `${BASE_URL}${settings.store.logo}` : settings.store.logo}
              alt={settings.store.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-polaris-primary">
              {(settings?.store?.name || "S").charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Store name + subtitle */}
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
      <div className="h-8 w-8 rounded-full bg-polaris-primary flex items-center justify-center text-xs font-semibold text-white shrink-0">
        {initials}
      </div>
    </header>
  );
}
