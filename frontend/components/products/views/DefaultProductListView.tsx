"use client";

import { useTranslation } from "react-i18next";
import { LayoutGrid, List, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemedProductCard, ThemedProductCardSkeleton } from "@/components/products/ThemedProductCard";
import { ProductFilters } from "@/components/products/ProductFilters";
import { MobileFilterSheet } from "@/components/products/MobileFilterSheet";
import { ActiveFilterChips } from "@/components/products/ActiveFilterChips";
import { ProductSort } from "@/components/products/ProductSort";
import { Pagination } from "@/components/products/Pagination";
import { cn } from "@/lib/utils";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import type { ProductListViewProps } from "@/types";

export default function DefaultProductListView({
  products,
  pagination,
  categories,
  loading,
  error,
  view,
  sort,
  filters,
  onViewChange,
  onSortChange,
  onFiltersChange,
  onPageChange,
  onRetry,
}: ProductListViewProps) {
  const { t } = useTranslation("products");
  const theme = useActiveTheme();

  return (
    <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", theme.pageBg, theme.bodyClass)}>
      <h1 className={cn("text-2xl font-bold mb-6", theme.text, theme.headingClass)}>{t("catalog.title")}</h1>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <ProductFilters
            categories={categories}
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0" aria-live="polite" aria-busy={loading}>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className={cn("text-sm", theme.textMuted)}>
                {pagination ? t("catalog.resultCount", { count: pagination.total }) : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MobileFilterSheet categories={categories} filters={filters} onFiltersChange={onFiltersChange} />
              <ProductSort value={sort} onChange={onSortChange} />
              <div className={cn("flex rounded-md overflow-hidden", theme.border, "border")}>
                <button
                  type="button"
                  onClick={() => onViewChange("grid")}
                  className={cn("p-2 transition-colors", view === "grid" ? theme.btnPrimary : cn(theme.surface, "hover:opacity-80"))}
                  aria-pressed={view === "grid"}
                  aria-label={t("catalog.gridView")}
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onViewChange("list")}
                  className={cn("p-2 transition-colors", view === "list" ? theme.btnPrimary : cn(theme.surface, "hover:opacity-80"))}
                  aria-pressed={view === "list"}
                  aria-label={t("catalog.listView")}
                >
                  <List className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <ActiveFilterChips
            filters={filters}
            categories={categories}
            onFiltersChange={onFiltersChange}
            className="mb-4"
          />

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                {error}
                <Button variant="link" className="ml-2 h-auto p-0" onClick={onRetry}>
                  {t("common:actions.retry")}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className={cn("grid gap-4", view === "grid" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1")}>
              {[...Array(12)].map((_, i) => <ThemedProductCardSkeleton key={i} view={view} />)}
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="text-center py-16">
              <p className={cn("text-lg mb-2", theme.textMuted)}>{t("catalog.empty")}</p>
              <p className={cn("text-sm", theme.textMuted)}>{t("catalog.emptyHint")}</p>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <>
              <div className={cn("grid gap-4", view === "grid" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1")}>
                {products.map((p) => (
                  <ThemedProductCard key={p.id} product={p} view={view} />
                ))}
              </div>
              {pagination && <Pagination pagination={pagination} onPageChange={onPageChange} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
