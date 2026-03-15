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

export default function PlayfulCategoryDetailView({
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
    <div className="w-full bg-[#F8F7FF]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* ── Breadcrumbs ── */}
      {catLoading ? (
        <Skeleton className="h-4 w-48 mb-6 bg-[#F0EDFF] rounded-full" />
      ) : (
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[#6B6798]">
            <li>
              <Link href="/" className="hover:text-[#2D2B55] transition-colors">
                {t("common:nav.home", "Home")}
              </Link>
            </li>
            {crumbs.map((item, idx) => {
              const isLast = idx === crumbs.length - 1;
              return (
                <li key={idx} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="text-purple-300">/</span>
                  {isLast || !item.href ? (
                    <span
                      className="bg-gradient-to-r from-[#7C3AED] to-[#EC4899] bg-clip-text text-transparent font-semibold"
                      aria-current={isLast ? "page" : undefined}
                    >
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="hover:text-[#2D2B55] transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* ── Category header ── */}
      {catLoading ? (
        <div className="mb-8">
          <Skeleton className="h-8 w-56 bg-[#F0EDFF] rounded-full" />
          <Skeleton className="h-4 w-80 mt-3 bg-[#F0EDFF] rounded-full" />
        </div>
      ) : category ? (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#2D2B55]">{category.name}</h1>
          <div className="w-20 h-1 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] rounded-full mt-2" />
          {category.description && (
            <p className="mt-3 text-[#6B6798] max-w-xl">{category.description}</p>
          )}
        </div>
      ) : (
        <Alert variant="destructive" className="max-w-sm mb-6 rounded-2xl">
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
                  "rounded-full bg-white border border-purple-200 text-[#2D2B55]",
                  "py-1.5 px-4 text-sm transition-all duration-200",
                  "hover:bg-gradient-to-r hover:from-[#7C3AED] hover:to-[#EC4899] hover:text-white hover:border-transparent"
                )}
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm text-[#6B6798]">
          {pagination && !loading
            ? t("products:catalog.resultCount", { count: pagination.total })
            : ""}
        </span>
        <ProductSort value={sort} onChange={onSortChange} />
      </div>

      {/* ── Error ── */}
      {error && (
        <Alert variant="destructive" className="mb-5 rounded-2xl">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Loading grid ── */}
      {loading && (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <ThemedProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && products.length === 0 && category && (
        <div className="text-center py-16">
          <div className="inline-flex flex-col items-center border-2 border-dashed border-purple-200 rounded-2xl px-12 py-10">
            <p className="text-[#6B6798] font-medium mb-4">
              {t("products:catalog.empty")}
            </p>
            <Button
              asChild
              className="rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white hover:opacity-90"
            >
              <Link href="/products">{t("products:catalog.backToProducts")}</Link>
            </Button>
          </div>
        </div>
      )}

      {/* ── Product grid + pagination ── */}
      {!loading && !error && products.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            {products.map((p) => (
              <ThemedProductCard key={p.id} product={p} />
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <nav
              aria-label={t("products:catalog.paginationLabel")}
              className="flex justify-center gap-1.5 mt-10"
            >
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => onPageChange(n)}
                  aria-current={n === page ? "page" : undefined}
                  className={cn(
                    "w-9 h-9 rounded-full text-sm font-medium transition-all duration-200",
                    n === page
                      ? "bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-md"
                      : "bg-white text-[#6B6798] border border-purple-200 hover:border-[#7C3AED] hover:text-[#7C3AED]"
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
