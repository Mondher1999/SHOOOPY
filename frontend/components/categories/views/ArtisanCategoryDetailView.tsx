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

const serifFont = { fontFamily: "'Playfair Display', Georgia, serif" };

export default function ArtisanCategoryDetailView({
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
    <div className="w-full bg-[#FFF8F0] min-h-[60vh]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      {catLoading ? (
        <Skeleton className="h-4 w-48 mb-6 bg-[#F5E6D3]" />
      ) : (
        <Breadcrumb
          items={crumbs}
          className={cn(
            "mb-6",
            "[&_ol]:text-[#8B6F47]",
            "[&_a]:text-[#8B6F47] [&_a]:hover:text-[#3D2E1F]",
            "[&_svg]:text-[#C67B4A]/40",
            "[&_span]:text-[#3D2E1F]"
          )}
        />
      )}

      {/* Category header */}
      {catLoading ? (
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2 bg-[#F5E6D3]" />
          <Skeleton className="h-4 w-96 bg-[#F5E6D3]" />
        </div>
      ) : category ? (
        <div className="mb-6">
          <h1
            className="text-2xl font-medium text-[#3D2E1F]"
            style={serifFont}
          >
            {category.name}
          </h1>
          <div className="w-16 h-0.5 bg-[#C67B4A] mt-2" />
          {category.description && (
            <p className="mt-3 text-[#8B6F47]">{category.description}</p>
          )}
        </div>
      ) : (
        <Alert variant="destructive" className="max-w-sm mb-6 rounded-xl border-[#C67B4A]/30 bg-[#FFF0E0]">
          <AlertCircle className="h-4 w-4 text-[#C67B4A]" aria-hidden="true" />
          <AlertDescription className="text-[#3D2E1F]">
            {t("categories:catalog.notFound")}
          </AlertDescription>
        </Alert>
      )}

      {/* Subcategory pills */}
      {subcategories.length > 0 && (
        <nav aria-label={t("categories:catalog.subcategoriesLabel")} className="mb-6">
          <div className="flex flex-wrap gap-2">
            {subcategories.map((sub) => (
              <Link key={sub.id} href={`/categories/${sub.slug}`}>
                <span
                  className={cn(
                    "inline-block rounded-full bg-white border border-[#C67B4A]/20",
                    "text-sm text-[#3D2E1F] py-1.5 px-4 cursor-pointer",
                    "transition-colors duration-200",
                    "hover:bg-[#C67B4A] hover:text-white hover:border-[#C67B4A]"
                  )}
                >
                  {sub.name}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-[#8B6F47]">
          {pagination && !loading ? t("products:catalog.resultCount", { count: pagination.total }) : ""}
        </span>
        <ProductSort value={sort} onChange={onSortChange} />
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive" className="mb-4 rounded-xl border-[#C67B4A]/30 bg-[#FFF0E0]">
          <AlertCircle className="h-4 w-4 text-[#C67B4A]" aria-hidden="true" />
          <AlertDescription className="text-[#3D2E1F]">{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading grid */}
      {loading && (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(12)].map((_, i) => <ThemedProductCardSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && products.length === 0 && category && (
        <div className="text-center py-16">
          <p className="text-[#8B6F47] mb-4" style={serifFont}>
            {t("products:catalog.empty")}
          </p>
          <Button
            variant="outline"
            asChild
            className="rounded-full border-[#C67B4A]/30 text-[#3D2E1F] hover:bg-[#C67B4A] hover:text-white hover:border-[#C67B4A]"
          >
            <Link href="/products">{t("products:catalog.backToProducts")}</Link>
          </Button>
        </div>
      )}

      {/* Product grid + pagination */}
      {!loading && !error && products.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
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
                    "w-8 rounded-full",
                    n === page
                      ? "bg-[#C67B4A] border-[#C67B4A] text-white hover:bg-[#A5623A]"
                      : "border-[#C67B4A]/20 text-[#8B6F47] hover:bg-[#C67B4A] hover:text-white hover:border-[#C67B4A]"
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
