"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LayoutGrid, List, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard, ProductCardSkeleton } from "@/components/products/ProductCard";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductSort } from "@/components/products/ProductSort";
import { getAllProductsAPI } from "@/services/product-service";
import { getCategoryTreeAPI } from "@/services/category-service";
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";
import type { Product, PaginationInfo, ProductQueryParams, CategoryNode } from "@/types";

type ViewMode = "grid" | "list";
type SortValue = NonNullable<ProductQueryParams["sort"]>;

function Pagination({
  pagination,
  onPageChange,
}: {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation("products");
  const { page, pages, total } = pagination;
  if (pages <= 1) return null;

  const pageNumbers = Array.from({ length: Math.min(pages, 7) }, (_, i) => {
    if (pages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= pages - 3) return pages - 6 + i;
    return page - 3 + i;
  });

  return (
    <nav aria-label={t("catalog.paginationLabel")} className="flex items-center justify-center gap-1 mt-8">
      <span className="text-sm text-muted-foreground mr-2">
        {t("catalog.paginationTotal", { total })}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label={t("catalog.prevPage")}
      >
        ‹
      </Button>
      {pageNumbers.map((n) => (
        <Button
          key={n}
          variant={n === page ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(n)}
          aria-current={n === page ? "page" : undefined}
          className="w-8"
        >
          {n}
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
        aria-label={t("catalog.nextPage")}
      >
        ›
      </Button>
    </nav>
  );
}

export default function ProductsPage() {
  const { t } = useTranslation("products");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("grid");

  // Read filters from URL
  const filters = {
    category: searchParams.get("category") ?? undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    inStock: searchParams.get("inStock") === "true" ? true : undefined,
    rating: searchParams.get("rating") ? Number(searchParams.get("rating")) : undefined,
  };
  const sort = (searchParams.get("sort") as SortValue) ?? undefined;
  const page = Number(searchParams.get("page") ?? 1);

  // Update URL with new params (merges, preserves existing)
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v !== undefined) params.set(k, v);
        else params.delete(k);
      });
      params.delete("page"); // Reset to page 1 on filter change
      router.push(`/products?${params.toString()}`);
    },
    [searchParams, router]
  );

  const handleFiltersChange = (newFilters: typeof filters) => {
    updateParams({
      category: newFilters.category,
      minPrice: newFilters.minPrice?.toString(),
      maxPrice: newFilters.maxPrice?.toString(),
      inStock: newFilters.inStock ? "true" : undefined,
      rating: newFilters.rating?.toString(),
    });
  };

  const handleSortChange = (s: SortValue) => updateParams({ sort: s });
  const handlePageChange = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/products?${params.toString()}`);
  };

  useEffect(() => {
    getCategoryTreeAPI()
      .then((res) => setCategories(res.data))
      .catch((err) => logger.error("Category tree fetch error:", err));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getAllProductsAPI({ ...filters, sort, page, limit: 12 })
      .then((res) => {
        if (!cancelled) {
          setProducts(res.data.products);
          setPagination(res.data.pagination);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          logger.error("Products fetch error:", err);
          setError(t("catalog.errorLoading"));
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">{t("catalog.title")}</h1>

      <div className="flex gap-8">
        {/* Sidebar Filters — Desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <ProductFilters
            categories={categories}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0" aria-live="polite" aria-busy={loading}>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {/* Mobile Filter — TODO Sprint: sheet drawer */}
              <span className="text-sm text-muted-foreground">
                {pagination ? t("catalog.resultCount", { count: pagination.total }) : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ProductSort value={sort} onChange={handleSortChange} />
              <div className="flex border rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className={cn(
                    "p-2 transition-colors",
                    view === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                  aria-pressed={view === "grid"}
                  aria-label={t("catalog.gridView")}
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={cn(
                    "p-2 transition-colors",
                    view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                  aria-pressed={view === "list"}
                  aria-label={t("catalog.listView")}
                >
                  <List className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                {error}
                <Button variant="link" className="ml-2 h-auto p-0" onClick={() => router.refresh()}>
                  {t("common:actions.retry")}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading */}
          {loading && (
            <div
              className={cn(
                "grid gap-4",
                view === "grid" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"
              )}
            >
              {[...Array(12)].map((_, i) => <ProductCardSkeleton key={i} view={view} />)}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && products.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-2">{t("catalog.empty")}</p>
              <p className="text-sm text-muted-foreground">{t("catalog.emptyHint")}</p>
            </div>
          )}

          {/* Products */}
          {!loading && !error && products.length > 0 && (
            <>
              <div
                className={cn(
                  "grid gap-4",
                  view === "grid" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"
                )}
              >
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} view={view} />
                ))}
              </div>
              {pagination && <Pagination pagination={pagination} onPageChange={handlePageChange} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
