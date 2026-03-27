"use client";

import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function TermsClient() {
  const { t } = useTranslation("common");
  const { settings, isLoading } = useSettings();
  const content = settings?.legal?.termsAndConditions || "";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">{t("legal.terms")}</h1>
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      ) : content ? (
        <div className="prose prose-gray max-w-none whitespace-pre-wrap">{content}</div>
      ) : (
        <p className="text-muted-foreground">{t("legal.noContent")}</p>
      )}
    </div>
  );
}
