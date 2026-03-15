"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ProductListViewSwitcher } from "@/components/products/views/ProductListViewSwitcher";
import { getAllProductsAPI } from "@/services/product-service";
import { getCategoryTreeAPI } from "@/services/category-service";
import logger from "@/lib/logger";
import type { Product, PaginationInfo, CategoryNode, ViewMode, SortValue, FilterState } from "@/types";

export default function ProductListClient() {
  const { t } = useTranslation("products");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("grid");

  const filters: FilterState = {
    category: searchParams.get("category") ?? undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    inStock: searchParams.get("inStock") === "true" ? true : undefined,
    onSale: searchParams.get("onSale") === "true" ? true : undefined,
    rating: searchParams.get("rating") ? Number(searchParams.get("rating")) : undefined,
  };
  const sort = (searchParams.get("sort") as SortValue) ?? undefined;
  const page = Number(searchParams.get("page") ?? 1);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v !== undefined) params.set(k, v);
        else params.delete(k);
      });
      params.delete("page");
      router.push(`/products?${params.toString()}`);
    },
    [searchParams, router]
  );

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    updateParams({
      category: newFilters.category,
      minPrice: newFilters.minPrice?.toString(),
      maxPrice: newFilters.maxPrice?.toString(),
      inStock: newFilters.inStock ? "true" : undefined,
      onSale: newFilters.onSale ? "true" : undefined,
      rating: newFilters.rating?.toString(),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateParams]);

  const handleSortChange = useCallback((s: SortValue) => updateParams({ sort: s }), [updateParams]);
  const handlePageChange = useCallback((p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/products?${params.toString()}`);
  }, [searchParams, router]);

  const handleRetry = useCallback(() => router.refresh(), [router]);

  const categoriesLoaded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchPromises: Promise<void>[] = [
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
        }),
    ];

    if (!categoriesLoaded.current) {
      fetchPromises.push(
        getCategoryTreeAPI()
          .then((res) => { if (!cancelled) { setCategories(res.data); categoriesLoaded.current = true; } })
          .catch((err) => logger.error("Category tree fetch error:", err))
      );
    }

    Promise.all(fetchPromises).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  return (
    <ProductListViewSwitcher
      products={products}
      pagination={pagination}
      categories={categories}
      loading={loading}
      error={error}
      view={view}
      sort={sort}
      filters={filters}
      onViewChange={setView}
      onSortChange={handleSortChange}
      onFiltersChange={handleFiltersChange}
      onPageChange={handlePageChange}
      onRetry={handleRetry}
    />
  );
}
