"use client";

import { useTranslation } from "react-i18next";
import { LayoutGrid, List, AlertCircle, PackageOpen } from "lucide-react";
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

export default function PlayfulProductListView({
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
    <div className="bg-[#F8F7FF] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Heading with gradient accent bar */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#2D2B55]">
            {t("catalog.title")}
          </h1>
          <div className="h-1 w-20 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] mt-3 rounded-full" />
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5">
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
            <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
              <span className="text-sm text-[#6B6798]">
                {pagination ? t("catalog.resultCount", { count: pagination.total }) : ""}
              </span>

              <div className="flex items-center gap-3">
                <MobileFilterSheet categories={categories} filters={filters} onFiltersChange={onFiltersChange} />
                <ProductSort value={sort} onChange={onSortChange} />

                {/* View toggle — pill-shaped with gradient */}
                <div className="flex rounded-full overflow-hidden border border-purple-200">
                  <button
                    type="button"
                    onClick={() => onViewChange("grid")}
                    className={cn(
                      "p-2 px-3 transition-all",
                      view === "grid"
                        ? "bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white"
                        : "bg-white text-[#7C3AED] hover:bg-purple-50"
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
                      "p-2 px-3 transition-all",
                      view === "list"
                        ? "bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white"
                        : "bg-white text-[#7C3AED] hover:bg-purple-50"
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
              <Alert variant="destructive" className="mb-5 rounded-2xl border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription className="text-red-700">
                  {error}
                  <Button
                    variant="link"
                    className="ml-2 h-auto p-0 text-[#7C3AED] font-semibold"
                    onClick={onRetry}
                  >
                    {t("common:actions.retry")}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {loading && (
              <div
                className={cn(
                  "grid",
                  view === "grid"
                    ? "grid-cols-2 lg:grid-cols-3 gap-5"
                    : "grid-cols-1 gap-4"
                )}
              >
                {[...Array(12)].map((_, i) => (
                  <ThemedProductCardSkeleton key={i} view={view} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-purple-200 bg-white">
                <PackageOpen className="h-16 w-16 text-purple-300 mb-4" aria-hidden="true" />
                <p className="text-lg font-semibold text-[#6B6798] mb-1">
                  {t("catalog.empty")}
                </p>
                <p className="text-sm text-[#6B6798]/70">
                  {t("catalog.emptyHint")}
                </p>
              </div>
            )}

            {/* Success State */}
            {!loading && !error && products.length > 0 && (
              <>
                <div
                  className={cn(
                    "grid",
                    view === "grid"
                      ? "grid-cols-2 lg:grid-cols-3 gap-5"
                      : "grid-cols-1 gap-4"
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
