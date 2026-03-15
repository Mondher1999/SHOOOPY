"use client";

import { useState } from "react";
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

export default function ZenProductListView({
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
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Heading — centered, ultra-light */}
        <h1 className="text-center text-xl font-light text-[#111] tracking-[0.2em] uppercase mb-10">
          {t("catalog.title")}
        </h1>

        {/* Toolbar — minimal inline bar */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs text-gray-400 tracking-wide">
            {pagination ? t("catalog.resultCount", { count: pagination.total }) : ""}
          </span>

          <div className="flex items-center gap-6">
            <MobileFilterSheet categories={categories} filters={filters} onFiltersChange={onFiltersChange} />

            {/* Filter toggle */}
            <button
              type="button"
              onClick={() => setFiltersOpen((prev) => !prev)}
              className={cn(
                "text-xs tracking-wide uppercase transition-colors",
                filtersOpen ? "text-[#111] font-medium" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {t("catalog.filters", "Filters")}
            </button>

            <ProductSort value={sort} onChange={onSortChange} />

            {/* View toggle — text-only, no borders */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onViewChange("grid")}
                className={cn(
                  "text-xs tracking-wide uppercase transition-colors",
                  view === "grid" ? "text-[#111] font-medium" : "text-gray-300"
                )}
                aria-pressed={view === "grid"}
                aria-label={t("catalog.gridView")}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onViewChange("list")}
                className={cn(
                  "text-xs tracking-wide uppercase transition-colors",
                  view === "list" ? "text-[#111] font-medium" : "text-gray-300"
                )}
                aria-pressed={view === "list"}
                aria-label={t("catalog.listView")}
              >
                <List className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible filter panel */}
        {filtersOpen && (
          <div className="border-b border-gray-100 pb-6 mb-8">
            <div className="max-w-xl mx-auto">
              <ProductFilters
                categories={categories}
                filters={filters}
                onFiltersChange={onFiltersChange}
              />
            </div>
          </div>
        )}

        <ActiveFilterChips
          filters={filters}
          categories={categories}
          onFiltersChange={onFiltersChange}
          className="mb-4"
        />

        {/* Main Content */}
        <div aria-live="polite" aria-busy={loading}>
          {/* Error State */}
          {error && (
            <Alert variant="destructive" className="mb-6 border-gray-200 bg-white">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription className="text-gray-500">
                {error}
                <Button variant="link" className="ml-2 h-auto p-0 text-[#111]" onClick={onRetry}>
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
                view === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" : "grid-cols-1 gap-6"
              )}
            >
              {[...Array(9)].map((_, i) => (
                <ThemedProductCardSkeleton key={i} view={view} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-sm font-light text-gray-400 tracking-wide">
                {t("catalog.empty")}
              </p>
              <p className="text-xs text-gray-300 mt-2">
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
                  view === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" : "grid-cols-1 gap-6"
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
  );
}
