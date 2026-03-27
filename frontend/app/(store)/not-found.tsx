"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StoreNotFound() {
  const { t } = useTranslation("common");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <SearchX className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
      <h1 className="text-2xl font-bold mb-2">{t("notFound.title")}</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        {t("notFound.description")}
      </p>
      <Button asChild>
        <Link href="/">{t("notFound.backHome")}</Link>
      </Button>
    </div>
  );
}
