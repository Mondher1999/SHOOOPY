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

const serif = "'Playfair Display', Georgia, serif";

export default function ElegantCategoryDetailView({
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
    <div className="bg-[#FAF7F2] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumbs */}
        {catLoading ? (
          <Skeleton className="h-4 w-48 mb-8 bg-[#EDE8DF]" />
        ) : (
          <Breadcrumb
            items={crumbs}
            className={cn(
              "mb-8",
              "[&_ol]:text-[#8B7355]",
              "[&_a]:text-[#8B7355] [&_a]:hover:text-[#2C2C2C]",
              "[&_svg]:text-[#C5A467]/50",
              "[&_span]:text-[#2C2C2C]"
            )}
          />
        )}

        {/* Category header */}
        {catLoading ? (
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-3 bg-[#EDE8DF]" />
            <Skeleton className="h-4 w-96 bg-[#EDE8DF]" />
          </div>
        ) : category ? (
          <div className="mb-8">
            <h1
              className="text-2xl font-medium text-[#2C2C2C] tracking-wide"
              style={{ fontFamily: serif }}
            >
              {category.name}
            </h1>
            <div className="w-12 h-px bg-[#C5A467] mt-2" />
            {category.description && (
              <p className="mt-3 text-[#8B7355] max-w-2xl">{category.description}</p>
            )}
          </div>
        ) : (
          <Alert variant="destructive" className="max-w-sm mb-8 bg-white border-[#C5A467]/40">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription className="text-[#2C2C2C]">
              {t("categories:catalog.notFound")}
            </AlertDescription>
          </Alert>
        )}

        {/* Subcategory navigation */}
        {subcategories.length > 0 && (
          <nav aria-label={t("categories:catalog.subcategoriesLabel")} className="mb-8">
            <div className="flex flex-wrap gap-2">
              {subcategories.map((sub) => (
                <Link key={sub.id} href={`/categories/${sub.slug}`}>
                  <Badge
                    variant="outline"
                    className={cn(
                      "cursor-pointer rounded-full text-sm py-1.5 px-4 transition-colors",
                      "bg-white border-[#C5A467]/30 text-[#2C2C2C]",
                      "hover:bg-[#C5A467]/10 hover:border-[#C5A467]"
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
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-[#8B7355]">
            {pagination && !loading ? t("products:catalog.resultCount", { count: pagination.total }) : ""}
          </span>
          <ProductSort value={sort} onChange={onSortChange} />
        </div>

        {/* Error state */}
        {error && (
          <Alert variant="destructive" className="mb-6 bg-white border-[#C5A467]/40">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription className="text-[#2C2C2C]">{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading grid */}
        {loading && (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(12)].map((_, i) => <ThemedProductCardSkeleton key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && products.length === 0 && category && (
          <div className="text-center py-20">
            <p
              className="text-[#8B7355] mb-4"
              style={{ fontFamily: serif }}
            >
              {t("products:catalog.empty")}
            </p>
            <Button
              variant="outline"
              asChild
              className="rounded-full border-[#C5A467]/30 text-[#2C2C2C] hover:bg-[#C5A467]/10 hover:border-[#C5A467]"
            >
              <Link href="/products">{t("products:catalog.backToProducts")}</Link>
            </Button>
          </div>
        )}

        {/* Product grid + pagination */}
        {!loading && !error && products.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => <ThemedProductCard key={p.id} product={p} />)}
            </div>
            {pagination && pagination.pages > 1 && (
              <nav aria-label={t("products:catalog.paginationLabel")} className="flex justify-center gap-1 mt-10">
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
                        ? "bg-[#C5A467] border-[#C5A467] text-white hover:bg-[#B8963A]"
                        : "border-[#C5A467]/30 text-[#8B7355] hover:bg-[#C5A467]/10 hover:border-[#C5A467]"
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
