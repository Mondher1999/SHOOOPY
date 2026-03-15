"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { ThemedProductCard, ThemedProductCardSkeleton } from "@/components/products/ThemedProductCard";
import { ProductSort } from "@/components/products/ProductSort";
import { cn } from "@/lib/utils";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import type { CategoryDetailViewProps } from "@/types";

export default function DefaultCategoryDetailView({
  category,
  subcategories,
  products,
  pagination,
  loading,
  catLoading,
  error,
  sort,
  page,
  slug,
  onSortChange,
  onPageChange,
}: CategoryDetailViewProps) {
  const { t } = useTranslation(["products", "categories"]);
  const theme = useActiveTheme();

  const crumbs: BreadcrumbItem[] = [
    { label: t("categories:catalog.title"), href: "/categories" },
  ];
  if (category) {
    if (category.ancestors) {
      for (const ancestor of category.ancestors) {
        crumbs.push({ label: ancestor.name, href: `/categories/${ancestor.slug}` });
      }
    }
    crumbs.push({ label: category.name });
  }

  return (
    <div className={cn("w-full", theme.pageBg, theme.bodyClass)}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {catLoading ? (
        <Skeleton className="h-4 w-48 mb-6" />
      ) : (
        <Breadcrumb items={crumbs} className="mb-6" />
      )}

      {catLoading ? (
        <Skeleton className="h-8 w-64 mb-4" />
      ) : category ? (
        <div className="mb-6">
          <h1 className={cn("text-2xl font-bold", theme.text, theme.headingClass)}>{category.name}</h1>
          {category.description && (
            <p className={cn("mt-1", theme.textMuted)}>{category.description}</p>
          )}
        </div>
      ) : (
        <Alert variant="destructive" className="max-w-sm">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{t("categories:catalog.notFound")}</AlertDescription>
        </Alert>
      )}

      {subcategories.length > 0 && (
        <nav aria-label={t("categories:catalog.subcategoriesLabel")} className="mb-6">
          <div className="flex flex-wrap gap-2">
            {subcategories.map((sub) => (
              <Link key={sub.id} href={`/categories/${sub.slug}`}>
                <Badge variant="outline" className={cn("cursor-pointer hover:bg-muted text-sm py-1 px-3 transition-colors", theme.border, theme.accentHover)}>
                  {sub.name}
                </Badge>
              </Link>
            ))}
          </div>
        </nav>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className={cn("text-sm", theme.textMuted)}>
          {pagination && !loading ? t("products:catalog.resultCount", { count: pagination.total }) : ""}
        </span>
        <ProductSort value={sort} onChange={onSortChange} />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(12)].map((_, i) => <ThemedProductCardSkeleton key={i} />)}
        </div>
      )}

      {!loading && !error && products.length === 0 && category && (
        <div className="text-center py-16">
          <p className={cn("mb-4", theme.textMuted)}>{t("products:catalog.empty")}</p>
          <Button variant="outline" asChild>
            <Link href="/products">{t("products:catalog.backToProducts")}</Link>
          </Button>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => <ThemedProductCard key={p.id} product={p} />)}
          </div>
          {pagination && pagination.pages > 1 && (
            <nav aria-label={t("products:catalog.paginationLabel")} className="flex justify-center gap-1 mt-8">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((n) => (
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
            </nav>
          )}
        </>
      )}
    </div>
    </div>
  );
}
