"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CategoriesListViewSwitcher } from "@/components/categories/views/CategoriesListViewSwitcher";
import { getAllCategoriesAPI } from "@/services/category-service";
import logger from "@/lib/logger";
import type { Category } from "@/types";

export default function CategoriesListClient() {
  const { t } = useTranslation("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllCategoriesAPI()
      .then((res) => {
        setCategories(res.data.filter((c) => !c.parent && c.isActive));
      })
      .catch((err) => {
        logger.error("Categories fetch error:", err);
        setError(t("catalog.errorLoading"));
      })
      .finally(() => setLoading(false));
  }, [t]);

  const handleRetry = useCallback(() => window.location.reload(), []);

  return (
    <CategoriesListViewSwitcher
      categories={categories}
      loading={loading}
      error={error}
      onRetry={handleRetry}
    />
  );
}
