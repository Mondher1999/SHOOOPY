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

export default function MagazineProductListView({
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
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Heading with double rule */}
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight text-black border-b-[3px] border-black pb-3 mb-2">
            {t("catalog.title")}
          </h1>
          <div className="border-b border-black" />
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white border-r-2 border-black pr-6">
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
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-600">
                  {pagination ? t("catalog.resultCount", { count: pagination.total }) : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MobileFilterSheet categories={categories} filters={filters} onFiltersChange={onFiltersChange} />
                <ProductSort value={sort} onChange={onSortChange} />
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => onViewChange("grid")}
                    className={cn(
                      "p-2 rounded-none transition-colors",
                      view === "grid"
                        ? "bg-black text-white"
                        : "bg-white text-black border-2 border-black hover:bg-gray-100"
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
                      "p-2 rounded-none transition-colors",
                      view === "list"
                        ? "bg-black text-white"
                        : "bg-white text-black border-2 border-black hover:bg-gray-100"
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
              <Alert variant="destructive" className="mb-4 bg-white border-2 border-black rounded-none">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription className="text-black font-medium">
                  {error}
                  <Button
                    variant="link"
                    className="ml-2 h-auto p-0 text-black underline font-bold uppercase text-xs tracking-wider"
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
                  "grid gap-4",
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
              <div className="text-center py-16">
                <p className="text-lg font-bold uppercase text-gray-400 mb-2">
                  {t("catalog.empty")}
                </p>
                <p className="text-sm font-bold uppercase text-gray-400">
                  {t("catalog.emptyHint")}
                </p>
              </div>
            )}

            {/* Success State */}
            {!loading && !error && products.length > 0 && (
              <>
                <div
                  className={cn(
                    "grid gap-4",
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
