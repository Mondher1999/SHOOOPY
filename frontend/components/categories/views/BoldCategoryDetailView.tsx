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
import type { CategoryDetailViewProps } from "@/types";

export default function BoldCategoryDetailView({
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
    <div className="bg-[#0F0F0F] min-h-screen">
      {/* Hero banner */}
      <div className="bg-[#1A1A1A] w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Breadcrumbs */}
          {catLoading ? (
            <Skeleton className="h-4 w-48 mb-6 bg-[#2A2A2A]" />
          ) : (
            <Breadcrumb
              items={crumbs}
              className={cn(
                "mb-6",
                "[&_ol]:text-gray-500",
                "[&_a]:text-gray-500 [&_a]:hover:text-gray-300",
                "[&_svg]:text-gray-600",
                "[&_span]:text-gray-400"
              )}
            />
          )}

          {/* Category header */}
          {catLoading ? (
            <div>
              <Skeleton className="h-9 w-72 mb-3 bg-[#2A2A2A]" />
              <Skeleton className="h-4 w-96 bg-[#2A2A2A]" />
            </div>
          ) : category ? (
            <div>
              <h1 className="text-3xl font-extrabold uppercase tracking-wider text-white">
                {category.name}
              </h1>
              {category.description && (
                <p className="mt-2 text-gray-400 max-w-2xl">{category.description}</p>
              )}
            </div>
          ) : (
            <Alert variant="destructive" className="max-w-sm bg-[#1A1A1A] border-red-800">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription className="text-gray-300">
                {t("categories:catalog.notFound")}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Subcategory navigation */}
        {subcategories.length > 0 && (
          <nav aria-label={t("categories:catalog.subcategoriesLabel")} className="mb-6">
            <div className="flex flex-wrap gap-2">
              {subcategories.map((sub) => (
                <Link key={sub.id} href={`/categories/${sub.slug}`}>
                  <Badge
                    variant="outline"
                    className={cn(
                      "cursor-pointer rounded-none uppercase text-xs tracking-wider py-1.5 px-4 transition-colors",
                      "bg-[#1A1A1A] text-gray-300 border-gray-700",
                      "hover:border-[#FF3C00] hover:text-[#FF3C00]"
                    )}
                  >
                    {sub.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </nav>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400">
            {pagination && !loading ? t("products:catalog.resultCount", { count: pagination.total }) : ""}
          </span>
          <ProductSort value={sort} onChange={onSortChange} />
        </div>

        {/* Error state */}
        {error && (
          <Alert variant="destructive" className="mb-4 bg-[#1A1A1A] border-red-800">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription className="text-gray-300">{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading grid */}
        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(12)].map((_, i) => <ThemedProductCardSkeleton key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && products.length === 0 && category && (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">{t("products:catalog.empty")}</p>
            <Button variant="outline" asChild className="rounded-none border-gray-700 text-gray-300 hover:border-[#FF3C00] hover:text-[#FF3C00]">
              <Link href="/products">{t("products:catalog.backToProducts")}</Link>
            </Button>
          </div>
        )}

        {/* Product grid + pagination */}
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
                    className={cn(
                      "w-8 rounded-none",
                      n === page
                        ? "bg-[#FF3C00] border-[#FF3C00] text-white hover:bg-[#FF3C00]/90"
                        : "border-gray-700 text-gray-400 hover:border-[#FF3C00] hover:text-[#FF3C00]"
                    )}
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
