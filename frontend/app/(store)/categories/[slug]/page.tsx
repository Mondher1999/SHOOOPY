"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { ProductCard, ProductCardSkeleton } from "@/components/products/ProductCard";
import { ProductSort } from "@/components/products/ProductSort";
import { getAllProductsAPI } from "@/services/product-service";
import { getAllCategoriesAPI } from "@/services/category-service";
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";
import type { Product, PaginationInfo, ProductQueryParams, Category } from "@/types";

type SortValue = NonNullable<ProductQueryParams["sort"]>;

export default function CategoryPage() {
  const { t } = useTranslation(["products", "categories"]);
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sort = (searchParams.get("sort") as SortValue) ?? undefined;
  const page = Number(searchParams.get("page") ?? 1);

  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [catLoading, setCatLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load category info + subcategories
  useEffect(() => {
    setCatLoading(true);
    getAllCategoriesAPI()
      .then((res) => {
        const found = res.data.find((c) => c.slug === slug);
        setCategory(found ?? null);
        if (found) {
          setSubcategories(res.data.filter((c) => {
            const parentId = typeof c.parent === "object" && c.parent
              ? c.parent.id
              : c.parent;
            return parentId === found.id && c.isActive;
          }));
        }
      })
      .catch((err) => logger.error("Category fetch error:", err))
      .finally(() => setCatLoading(false));
  }, [slug]);

  // Load products for this category
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

  const handleSortChange = (s: SortValue) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", s);
    params.delete("page");
    router.push(`/categories/${slug}?${params.toString()}`);
  };

  // Build breadcrumbs
  const crumbs: BreadcrumbItem[] = [
    { label: t("categories:catalog.title"), href: "/categories" },
  ];
  if (category) crumbs.push({ label: category.name });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {catLoading ? (
        <Skeleton className="h-4 w-48 mb-6" />
      ) : (
        <Breadcrumb items={crumbs} className="mb-6" />
      )}

      {/* Category Header */}
      {catLoading ? (
        <Skeleton className="h-8 w-64 mb-4" />
      ) : category ? (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground mt-1">{category.description}</p>
          )}
        </div>
      ) : (
        <Alert variant="destructive" className="max-w-sm">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{t("categories:catalog.notFound")}</AlertDescription>
        </Alert>
      )}

      {/* Subcategory Navigation */}
      {subcategories.length > 0 && (
        <nav aria-label={t("categories:catalog.subcategoriesLabel")} className="mb-6">
          <div className="flex flex-wrap gap-2">
            {subcategories.map((sub) => (
              <Link key={sub.id} href={`/categories/${sub.slug}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted text-sm py-1 px-3 transition-colors">
                  {sub.name}
                </Badge>
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          {pagination && !loading ? t("products:catalog.resultCount", { count: pagination.total }) : ""}
        </span>
        <ProductSort value={sort} onChange={handleSortChange} />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(12)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      )}

      {!loading && !error && products.length === 0 && category && (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">{t("products:catalog.empty")}</p>
          <Button variant="outline" asChild>
            <Link href="/products">{t("products:catalog.backToProducts")}</Link>
          </Button>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {pagination && pagination.pages > 1 && (
            <nav aria-label={t("products:catalog.paginationLabel")} className="flex justify-center gap-1 mt-8">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((n) => (
                <Button
                  key={n}
                  variant={n === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("page", String(n));
                    router.push(`/categories/${slug}?${params.toString()}`);
                  }}
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
  );
}
