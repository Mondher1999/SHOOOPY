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

export default function TechCategoryDetailView({
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
    <div className="w-full bg-[#0A0A0F]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* ── Breadcrumbs ── */}
      {catLoading ? (
        <Skeleton className="h-3 w-48 mb-8 bg-[#12121A]" />
      ) : (
        <nav aria-label="Breadcrumb" className="mb-8">
          <div className="flex items-center gap-0 font-mono text-xs text-gray-500 tracking-wide">
            <Link href="/" className="hover:text-[#00FF88] transition-colors">
              {t("common:nav.home", "~")}
            </Link>
            <span className="mx-1.5 text-gray-600" aria-hidden="true">&gt;</span>
            <Link
              href="/categories"
              className="hover:text-[#00FF88] transition-colors"
            >
              {t("categories:catalog.title")}
            </Link>
            {category?.ancestors?.map((ancestor) => (
              <span key={ancestor.id} className="contents">
                <span className="mx-1.5 text-gray-600" aria-hidden="true">&gt;</span>
                <Link
                  href={`/categories/${ancestor.slug}`}
                  className="hover:text-[#00FF88] transition-colors"
                >
                  {ancestor.name}
                </Link>
              </span>
            ))}
            {category && (
              <>
                <span className="mx-1.5 text-gray-600" aria-hidden="true">&gt;</span>
                <span className="text-[#00FF88]" aria-current="page">
                  {category.name}
                </span>
              </>
            )}
          </div>
        </nav>
      )}

      {/* ── Category header ── */}
      {catLoading ? (
        <div className="mb-8">
          <Skeleton className="h-7 w-56 bg-[#12121A]" />
          <Skeleton className="h-3 w-80 mt-3 bg-[#12121A]" />
        </div>
      ) : category ? (
        <div className="mb-8">
          <h1
            className="font-mono uppercase text-white font-bold text-xl tracking-wider"
            style={{ textShadow: "0 0 20px rgba(0,255,136,0.3), 0 0 40px rgba(0,255,136,0.1)" }}
          >
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-2 text-sm text-gray-500 font-mono max-w-xl">
              {category.description}
            </p>
          )}
        </div>
      ) : (
        <Alert variant="destructive" className="max-w-sm mb-8 bg-[#12121A] border-red-900/50">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{t("categories:catalog.notFound")}</AlertDescription>
        </Alert>
      )}

      {/* ── Subcategory chips ── */}
      {subcategories.length > 0 && (
        <nav aria-label={t("categories:catalog.subcategoriesLabel")} className="mb-8">
          <div className="flex flex-wrap gap-2">
            {subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/categories/${sub.slug}`}
                className={cn(
                  "bg-[#12121A] border border-[#00FF88]/20 text-gray-300",
                  "font-mono text-xs uppercase tracking-wider",
                  "py-1.5 px-4 rounded-none transition-all duration-200",
                  "hover:border-[#00FF88] hover:text-[#00FF88]"
                )}
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs font-mono text-gray-500">
          {pagination && !loading ? (
            <>
              {t("products:catalog.resultCount", { count: pagination.total })}
              <span className="text-[#00FF88] ml-1">
                [{pagination.total}]
              </span>
            </>
          ) : (
            ""
          )}
        </span>
        <ProductSort value={sort} onChange={onSortChange} />
      </div>

      {/* ── Error ── */}
      {error && (
        <Alert variant="destructive" className="mb-6 bg-[#12121A] border-red-900/50">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Loading grid ── */}
      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <ThemedProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && products.length === 0 && category && (
        <div className="text-center py-20">
          <p className="font-mono text-gray-600 text-sm mb-6">
            {"// "}{t("products:catalog.empty")}
          </p>
          <Button
            variant="outline"
            asChild
            className="font-mono text-xs uppercase tracking-wider rounded-none border-[#00FF88]/30 text-gray-400 hover:border-[#00FF88] hover:text-[#00FF88] bg-transparent"
          >
            <Link href="/products">{t("products:catalog.backToProducts")}</Link>
          </Button>
        </div>
      )}

      {/* ── Product grid + pagination ── */}
      {!loading && !error && products.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {products.map((p) => (
              <ThemedProductCard key={p.id} product={p} />
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <nav
              aria-label={t("products:catalog.paginationLabel")}
              className="flex justify-center gap-1 mt-10"
            >
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => onPageChange(n)}
                  aria-current={n === page ? "page" : undefined}
                  className={cn(
                    "w-8 h-8 font-mono text-xs transition-all duration-200 rounded-none",
                    n === page
                      ? "bg-[#00FF88] text-[#0A0A0F] font-bold"
                      : "bg-[#12121A] text-gray-500 border border-[#00FF88]/10 hover:border-[#00FF88]/50 hover:text-[#00FF88]"
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
