"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { CategoryDetailViewSwitcher } from "@/components/categories/views/CategoryDetailViewSwitcher";
import { getAllProductsAPI } from "@/services/product-service";
import { getAllCategoriesAPI, getCategoryBySlugAPI } from "@/services/category-service";
import logger from "@/lib/logger";
import type { Product, PaginationInfo, Category, CategoryWithAncestors, SortValue } from "@/types";

interface CategoryDetailClientProps {
  initialCategory?: CategoryWithAncestors | null;
}

export default function CategoryDetailClient({ initialCategory }: CategoryDetailClientProps) {
  const { t } = useTranslation(["products", "categories"]);
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sort = (searchParams.get("sort") as SortValue) ?? undefined;
  const page = Number(searchParams.get("page") ?? 1);

  const [category, setCategory] = useState<CategoryWithAncestors | null>(initialCategory ?? null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [catLoading, setCatLoading] = useState(!initialCategory);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategory) {
      getAllCategoriesAPI()
        .then((res) => {
          setSubcategories(res.data.filter((c) => {
            const parentId = typeof c.parent === "object" && c.parent
              ? c.parent.id
              : c.parent;
            return parentId === initialCategory.id && c.isActive;
          }));
        })
        .catch((err) => logger.error("Category fetch error:", err));
      return;
    }

    setCatLoading(true);
    getCategoryBySlugAPI(slug)
      .then((res) => {
        setCategory({ ...res.data, ancestors: [] } as CategoryWithAncestors);
        return getAllCategoriesAPI().then((allRes) => {
          setSubcategories(allRes.data.filter((c) => {
            const parentId = typeof c.parent === "object" && c.parent
              ? c.parent.id
              : c.parent;
            return parentId === res.data.id && c.isActive;
          }));
        });
      })
      .catch((err) => {
        logger.error("Category fetch error:", err);
        setCategory(null);
      })
      .finally(() => setCatLoading(false));
  }, [slug, initialCategory]);

  useEffect(() => {
    if (!category) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getAllProductsAPI({ category: category.id, sort, page, limit: 12 })
      .then((res) => {
        if (!cancelled) {
          setProducts(res.data.products);
          setPagination(res.data.pagination);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          logger.error("Category products fetch error:", err);
          setError(t("products:catalog.errorLoading"));
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [category, sort, page, t]);

  const handleSortChange = useCallback((s: SortValue) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", s);
    params.delete("page");
    router.push(`/categories/${slug}?${params.toString()}`);
  }, [searchParams, router, slug]);

  const handlePageChange = useCallback((n: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(n));
    router.push(`/categories/${slug}?${params.toString()}`);
  }, [searchParams, router, slug]);

  return (
    <CategoryDetailViewSwitcher
      category={category}
      subcategories={subcategories}
      products={products}
      pagination={pagination}
      loading={loading}
      catLoading={catLoading}
      error={error}
      sort={sort}
      page={page}
      slug={slug}
      onSortChange={handleSortChange}
      onPageChange={handlePageChange}
    />
  );
}
