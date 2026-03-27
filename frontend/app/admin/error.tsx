"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import logger from "@/lib/logger";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation("common");

  useEffect(() => {
    logger.error("Admin error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" aria-hidden="true" />
      <h1 className="text-2xl font-bold mb-2">{t("errorBoundary.title")}</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        {t("errorBoundary.description")}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>{t("actions.retry")}</Button>
        <Button variant="outline" asChild>
          <Link href="/admin">{t("errorBoundary.backToAdmin")}</Link>
        </Button>
      </div>
    </div>
  );
}
