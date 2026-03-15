"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export function AnnouncementBar() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const [dismissed, setDismissed] = useState(false);

  const announcement = settings?.homepage?.announcement;
  const isEnabled = announcement?.enabled ?? true;
  const text = announcement?.text || settings?.homepage?.announcementText || t("landing.announcement");
  const link = announcement?.link || "";
  const isHex = (c: string) => /^#[0-9a-fA-F]{6}$/.test(c);
  const bgColor = isHex(announcement?.bgColor || "") ? announcement!.bgColor : "";
  const textColor = isHex(announcement?.textColor || "") ? announcement!.textColor : "";
  const dismissible = announcement?.dismissible ?? false;

  if (!isEnabled || dismissed || !text) return null;

  const content = (
    <p
      className="text-[11px] uppercase tracking-allure font-heading"
      style={textColor ? { color: textColor } : undefined}
      suppressHydrationWarning
    >
      {text}
    </p>
  );

  return (
    <div
      className="w-full h-10 flex items-center justify-center bg-allure-dark relative"
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      {link ? (
        <Link href={link} className="hover:opacity-80 transition-opacity text-white">
          {content}
        </Link>
      ) : (
        <span className="text-white">{content}</span>
      )}

      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 cursor-pointer text-white"
          style={textColor ? { color: textColor } : undefined}
          aria-label={t("landing.announcementClose")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
