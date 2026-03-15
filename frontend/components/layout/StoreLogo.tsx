"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "react-i18next";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

interface StoreLogoProps {
  /** className passed to <span> for the text fallback */
  className?: string;
  /** Tailwind height class for the logo image — default "h-8" */
  imgHeight?: string;
}

/**
 * Renders the store logo image when `settings.store.logoEnabled && settings.store.logo`,
 * otherwise falls back to the store name text (inheriting parent className).
 */
export function StoreLogo({ className, imgHeight = "h-8" }: StoreLogoProps) {
  const { settings } = useSettings();
  const { t } = useTranslation("common");

  const logo = settings?.store?.logo;
  const logoEnabled = settings?.store?.logoEnabled ?? true;
  const storeName = settings?.store?.name || t("appName");

  if (logoEnabled && logo) {
    const src = logo.startsWith("/") ? `${API_BASE}${logo}` : logo;
    return (
      <img
        src={src}
        alt={storeName}
        className={`${imgHeight} w-auto max-w-[180px] object-contain`}
      />
    );
  }

  return <span className={className}>{storeName}</span>;
}
