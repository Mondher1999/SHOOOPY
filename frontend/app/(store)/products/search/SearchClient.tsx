"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LayoutGrid, List, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemedProductCard, ThemedProductCardSkeleton } from "@/components/products/ThemedProductCard";
import { ProductFilters } from "@/components/products/ProductFilters";
import { MobileFilterSheet } from "@/components/products/MobileFilterSheet";
import { ActiveFilterChips } from "@/components/products/ActiveFilterChips";
import { ProductSort } from "@/components/products/ProductSort";
import { getAllProductsAPI } from "@/services/product-service";
import { getCategoryTreeAPI } from "@/services/category-service";
import { cn } from "@/lib/utils";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import logger from "@/lib/logger";
import type { Product, PaginationInfo, ProductQueryParams, CategoryNode } from "@/types";

type SortValue = NonNullable<ProductQueryParams["sort"]>;
type ViewMode = "grid" | "list";

export default function SearchClient() {
  const { t } = useTranslation("products");
  const theme = useActiveTheme();
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get("q") ?? "";
  const sort = (searchParams.get("sort") as SortValue) ?? undefined;
  const page = Number(searchParams.get("page") ?? 1);
  const filters = {
    category: searchParams.get("category") ?? undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    inStock: searchParams.get("inStock") === "true" ? true : undefined,
    onSale: searchParams.get("onSale") === "true" ? true : undefined,
    rating: searchParams.get("rating") ? Number(searchParams.get("rating")) : undefined,
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("grid");

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v !== undefined) params.set(k, v);
        else params.delete(k);
      });
      params.delete("page");
      router.push(`/products/search?${params.toString()}`);
    },
    [searchParams, router]
  );

  const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
    updateParams({
      category: newFilters.category,
      minPrice: newFilters.minPrice?.toString(),
      maxPrice: newFilters.maxPrice?.toString(),
      inStock: newFilters.inStock ? "true" : undefined,
      onSale: newFilters.onSale ? "true" : undefined,
      rating: newFilters.rating?.toString(),
    });
  };

  const handleSortChange = (s: SortValue) => updateParams({ sort: s });
  const handlePageChange = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/products/search?${params.toString()}`);
  };

  useEffect(() => {
    getCategoryTreeAPI()
      .then((res) => setCategories(res.data))
      .catch((err) => logger.error("Category tree fetch error:", err));
  }, []);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    getAllProductsAPI({ ...filters, sort, search: query, page, limit: 12 })
      .then((res) => {
        if (!cancelled) {
          setProducts(res.data.products);
          setPagination(res.data.pagination);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          logger.error("Search fetch error:", err);
          setError(t("catalog.errorLoading"));
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  return (
    <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", theme.pageBg, theme.bodyClass)}>
      {/* Search Header */}
      <div className="mb-6">
        <div className={cn("flex items-center gap-2 mb-1", theme.textMuted)}>
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">{t("catalog.searchResultsFor")}</span>
        </div>
        <h1 className={cn("text-2xl font-bold", theme.text, theme.headingClass)}>
          {query ? `"${query}"` : t("catalog.searchAll")}
        </h1>
        {pagination && !loading && (
          <p className={cn("text-sm mt-1", theme.textMuted)}>
            {t("catalog.resultCount", { count: pagination.total })}
          </p>
        )}
      </div>

      {!query ? (
        <div className="text-center py-16">
          <Search className={cn("h-12 w-12 mx-auto mb-3", theme.textMuted)} aria-hidden="true" />
          <p className={theme.textMuted}>{t("catalog.searchHint")}</p>
        </div>
      ) : (
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <ProductFilters
              categories={categories}
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </aside>

          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 gap-2">
              <div />
              <div className="flex items-center gap-2">
                <MobileFilterSheet categories={categories} filters={filters} onFiltersChange={handleFiltersChange} />
                <ProductSort value={sort} onChange={handleSortChange} />
                <div className={cn("flex rounded-md overflow-hidden", theme.border, "border")}>
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    className={cn("p-2 transition-colors", view === "grid" ? theme.btnPrimary : cn(theme.surface, "hover:opacity-80"))}
                    aria-pressed={view === "grid"}
                    aria-label={t("catalog.gridView")}
                  >
                    <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
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
              onFiltersChange={handleFiltersChange}
              className="mb-4"
            />

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading && (
              <div className={cn("grid gap-4", view === "grid" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1")}>
                {[...Array(12)].map((_, i) => <ThemedProductCardSkeleton key={i} view={view} />)}
              </div>
            )}

            {!loading && !error && products.length === 0 && (
              <div className="text-center py-16">
                <Search className={cn("h-12 w-12 mx-auto mb-3", theme.textMuted)} aria-hidden="true" />
                <p className={cn("text-lg font-medium mb-1", theme.text)}>{t("catalog.searchEmpty", { query })}</p>
                <p className={cn("text-sm", theme.textMuted)}>{t("catalog.searchEmptyHint")}</p>
              </div>
            )}

            {!loading && !error && products.length > 0 && (
              <>
                <div className={cn("grid gap-4", view === "grid" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1")}>
                  {products.map((p) => <ThemedProductCard key={p.id} product={p} view={view} />)}
                </div>
                {pagination && pagination.pages > 1 && (
                  <nav aria-label={t("catalog.paginationLabel")} className="flex justify-center gap-1 mt-8">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((n) => (
                      <Button
                        key={n}
                        variant={n === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(n)}
                        aria-current={n === page ? "page" : undefined}
                        className="w-8"
                      >
                        {n}
                      </Button>
                    ))}
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
