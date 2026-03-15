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
import type { ProductListViewProps } from "@/types";

export default function ElegantProductListView({
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

  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Heading */}
        <div className="mb-10">
          <h1
            className="text-2xl font-medium tracking-wide text-[#2C2C2C]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {t("catalog.title")}
          </h1>
          <div className="w-12 h-px bg-[#C5A467] mt-3" />
        </div>

        <div className="flex gap-10">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white border border-[#C5A467]/30 rounded-sm p-5">
              <ProductFilters
                categories={categories}
                filters={filters}
                onFiltersChange={onFiltersChange}
              />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0" aria-live="polite" aria-busy={loading}>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#8B7355]">
                  {pagination ? t("catalog.resultCount", { count: pagination.total }) : ""}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MobileFilterSheet categories={categories} filters={filters} onFiltersChange={onFiltersChange} />
                <ProductSort value={sort} onChange={onSortChange} />
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onViewChange("grid")}
                    className={cn(
                      "p-2 rounded-sm transition-colors",
                      view === "grid"
                        ? "bg-[#C5A467] text-white"
                        : "bg-white text-[#8B7355] border border-[#C5A467]/30 hover:border-[#C5A467]"
                    )}
                    aria-pressed={view === "grid"}
                    aria-label={t("catalog.gridView")}
                  >
                    <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewChange("list")}
                    className={cn(
                      "p-2 rounded-sm transition-colors",
                      view === "list"
                        ? "bg-[#C5A467] text-white"
                        : "bg-white text-[#8B7355] border border-[#C5A467]/30 hover:border-[#C5A467]"
                    )}
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

            {/* Error State */}
            {error && (
              <Alert variant="destructive" className="mb-6 bg-white border-[#C5A467]/40">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription className="text-[#2C2C2C]">
                  {error}
                  <Button variant="link" className="ml-2 h-auto p-0 text-[#C5A467]" onClick={onRetry}>
                    {t("common:actions.retry")}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {loading && (
              <div
                className={cn(
                  "grid gap-6",
                  view === "grid" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"
                )}
              >
                {[...Array(12)].map((_, i) => (
                  <ThemedProductCardSkeleton key={i} view={view} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && products.length === 0 && (
              <div className="text-center py-20">
                <p
                  className="text-lg text-[#8B7355] mb-2"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {t("catalog.empty")}
                </p>
                <p className="text-sm text-[#8B7355]">{t("catalog.emptyHint")}</p>
              </div>
            )}

            {/* Success State */}
            {!loading && !error && products.length > 0 && (
              <>
                <div
                  className={cn(
                    "grid gap-6",
                    view === "grid" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"
                  )}
                >
                  {products.map((p) => (
                    <ThemedProductCard key={p.id} product={p} view={view} />
                  ))}
                </div>
                {pagination && (
                  <Pagination pagination={pagination} onPageChange={onPageChange} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
