"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemedProductCard, ThemedProductCardSkeleton } from "@/components/products/ThemedProductCard";
import { ProductSort } from "@/components/products/ProductSort";
import { cn } from "@/lib/utils";
import type { CategoryDetailViewProps } from "@/types";

export default function ZenCategoryDetailView({
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

  return (
    <div className="w-full bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ── Breadcrumbs ── */}
      {catLoading ? (
        <Skeleton className="h-3 w-48 mb-8 bg-gray-50" />
      ) : (
        <nav aria-label="Breadcrumb" className="mb-8">
          <div className="flex items-center gap-0 text-xs font-light text-gray-400 tracking-wide">
            <Link href="/" className="hover:text-[#111] transition-colors">
              {t("common:nav.home", "Home")}
            </Link>
            <span className="mx-2">/</span>
            <Link href="/categories" className="hover:text-[#111] transition-colors">
              {t("categories:catalog.title")}
            </Link>
            {category?.ancestors?.map((ancestor) => (
              <span key={ancestor.id} className="contents">
                <span className="mx-2">/</span>
                <Link
                  href={`/categories/${ancestor.slug}`}
                  className="hover:text-[#111] transition-colors"
                >
                  {ancestor.name}
                </Link>
              </span>
            ))}
            {category && (
              <>
                <span className="mx-2">/</span>
                <span className="text-gray-500" aria-current="page">
                  {category.name}
                </span>
              </>
            )}
          </div>
        </nav>
      )}

      {/* ── Category header ── */}
      {catLoading ? (
        <div className="mb-10">
          <Skeleton className="h-6 w-48 bg-gray-50" />
          <Skeleton className="h-3 w-72 mt-3 bg-gray-50" />
        </div>
      ) : category ? (
        <div className="mb-10">
          <h1 className="text-lg font-light text-[#111] tracking-[0.15em] uppercase">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-2 text-sm text-gray-400 font-light max-w-xl">
              {category.description}
            </p>
          )}
        </div>
      ) : (
        <Alert variant="destructive" className="max-w-sm mb-8 border-gray-200">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{t("categories:catalog.notFound")}</AlertDescription>
        </Alert>
      )}

      {/* ── Subcategory nav ── */}
      {subcategories.length > 0 && (
        <nav aria-label={t("categories:catalog.subcategoriesLabel")} className="mb-8">
          <div className="flex flex-wrap items-center gap-0 text-sm font-light">
            {subcategories.map((sub, idx) => (
              <span key={sub.id} className="contents">
                {idx > 0 && (
                  <span className="mx-2 text-gray-300" aria-hidden="true">&middot;</span>
                )}
                <Link
                  href={`/categories/${sub.slug}`}
                  className="text-gray-500 hover:text-[#111] transition-colors"
                >
                  {sub.name}
                </Link>
              </span>
            ))}
          </div>
        </nav>
      )}

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs font-light text-gray-400 tracking-wide">
          {pagination && !loading
            ? t("products:catalog.resultCount", { count: pagination.total })
            : ""}
        </span>
        <ProductSort value={sort} onChange={onSortChange} />
      </div>

      {/* ── Error ── */}
      {error && (
        <Alert variant="destructive" className="mb-6 border-gray-200">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Loading grid ── */}
      {loading && (
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <ThemedProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && products.length === 0 && category && (
        <div className="text-center py-20">
          <p className="font-light text-gray-400 text-sm tracking-wide mb-6">
            {t("products:catalog.empty")}
          </p>
          <Button
            variant="outline"
            asChild
            className="font-light border-gray-200 text-gray-500 hover:text-[#111] hover:border-gray-400"
          >
            <Link href="/products">{t("products:catalog.backToProducts")}</Link>
          </Button>
        </div>
      )}

      {/* ── Product grid + pagination ── */}
      {!loading && !error && products.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {products.map((p) => (
              <ThemedProductCard key={p.id} product={p} />
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <nav
              aria-label={t("products:catalog.paginationLabel")}
              className="flex justify-center gap-1 mt-12"
            >
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => onPageChange(n)}
                  aria-current={n === page ? "page" : undefined}
                  className={cn(
                    "w-8 h-8 text-xs font-light transition-colors",
                    n === page
                      ? "text-[#111] border-b border-[#111]"
                      : "text-gray-400 hover:text-[#111]"
                  )}
                >
                  {n}
                </button>
              ))}
            </nav>
          )}
        </>
      )}
    </div>
    </div>
  );
}
