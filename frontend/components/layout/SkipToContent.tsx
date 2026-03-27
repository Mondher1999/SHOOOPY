"use client";

import { useTranslation } from "react-i18next";

export function SkipToContent() {
  const { t } = useTranslation("common");

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:rounded focus:ring-2 focus:ring-ring focus:shadow-lg"
    >
      {t("actions.skipToContent")}
    </a>
  );
}
