"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { ThemedProductCard, ThemedProductCardSkeleton } from "@/components/products/ThemedProductCard";
import { ProductSort } from "@/components/products/ProductSort";
import { cn } from "@/lib/utils";
import type { CategoryDetailViewProps } from "@/types";

export default function MagazineCategoryDetailView({
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
  const { t } = useTranslation(["products", "categories", "common"]);

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
    <div className="w-full bg-white min-h-[60vh]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs — uppercase editorial style with | separators */}
      {catLoading ? (
        <Skeleton className="h-3 w-48 mb-6 bg-gray-100 rounded-none" />
      ) : (
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-gray-500">
            <li>
              <Link href="/" className="hover:text-black transition-colors">
                {t("common:nav.home")}
              </Link>
            </li>
            {crumbs.map((crumb, idx) => {
              const isLast = idx === crumbs.length - 1;
              return (
                <li key={idx} className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-gray-300">|</span>
                  {isLast || !crumb.href ? (
                    <span
                      className="text-black font-bold"
                      aria-current={isLast ? "page" : undefined}
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-black transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* Category header — bold editorial double-rule */}
      {catLoading ? (
        <div className="mb-8">
          <Skeleton className="h-9 w-72 mb-3 bg-gray-200 rounded-none" />
          <Skeleton className="h-4 w-96 bg-gray-100 rounded-none" />
        </div>
      ) : category ? (
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase text-black tracking-tight border-b-[3px] border-black pb-3">
            {category.name}
          </h1>
          <div className="border-b border-black/20" />
          {category.description && (
            <p className="mt-4 text-gray-600">{category.description}</p>
          )}
        </div>
      ) : (
        <Alert variant="destructive" className="max-w-sm mb-8 rounded-none border-black bg-white">
          <AlertCircle className="h-4 w-4 text-black" aria-hidden="true" />
          <AlertDescription className="text-black">
            {t("categories:catalog.notFound")}
          </AlertDescription>
        </Alert>
      )}

      {/* Subcategory links — plain text separated by | */}
      {subcategories.length > 0 && (
        <nav aria-label={t("categories:catalog.subcategoriesLabel")} className="mb-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {subcategories.map((sub, idx) => (
              <span key={sub.id} className="flex items-center gap-3">
                {idx > 0 && (
                  <span aria-hidden="true" className="text-gray-300">|</span>
                )}
                <Link
                  href={`/categories/${sub.slug}`}
                  className="uppercase text-xs tracking-widest font-bold text-black hover:underline transition-all"
                >
                  {sub.name}
                </Link>
              </span>
            ))}
          </div>
        </nav>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 border-b border-black/10 pb-3">
        <span className="text-xs uppercase tracking-wider text-gray-500">
          {pagination && !loading ? t("products:catalog.resultCount", { count: pagination.total }) : ""}
        </span>
        <ProductSort value={sort} onChange={onSortChange} />
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive" className="mb-4 rounded-none border-black bg-white">
          <AlertCircle className="h-4 w-4 text-black" aria-hidden="true" />
          <AlertDescription className="text-black">{error}</AlertDescription>
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
          <p className="font-bold uppercase text-gray-400 tracking-wider mb-4">
            {t("products:catalog.empty")}
          </p>
          <Button
            variant="outline"
            asChild
            className="rounded-none border-black text-black hover:bg-black hover:text-white"
          >
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
                      ? "bg-black border-black text-white hover:bg-black/90"
                      : "border-black/30 text-black hover:bg-black hover:text-white hover:border-black"
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
