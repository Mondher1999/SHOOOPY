"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { FolderOpen, AlertCircle, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CategoriesListViewProps } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/* ─── Loading Skeleton ─────────────────────────────────────────────────────── */

function CategoryCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden bg-[#F0EBE1]",
        featured ? "aspect-[16/10]" : "aspect-[4/3]"
      )}
    >
      <Skeleton className="h-full w-full bg-[#E8E0D0]" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <Skeleton className="h-5 w-2/3 mb-2 bg-[#D9D0C0]" />
        <Skeleton className="h-3 w-1/2 bg-[#D9D0C0]" />
      </div>
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────────── */

export default function ElegantCategoriesListView({
  categories,
  loading,
  error,
  onRetry,
}: CategoriesListViewProps) {
  const { t } = useTranslation("categories");

  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        {/* ── Heading ──────────────────────────────────────────────────── */}
        <div className="text-center mb-14">
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#2C2C2C]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {t("catalog.title")}
          </h1>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="h-px w-10 bg-[#C5A467]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#C5A467]" />
            <span className="h-px w-10 bg-[#C5A467]" />
          </div>
          <p
            className="mt-4 text-[#8B7355] text-base sm:text-lg max-w-xl mx-auto"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {t("catalog.subtitle")}
          </p>
        </div>

        {/* ── Error State ──────────────────────────────────────────────── */}
        {error && (
          <Alert
            variant="destructive"
            className="mb-8 rounded-xl border-red-200 bg-red-50/80"
          >
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription className="flex items-center gap-2">
              {t("catalog.errorLoading")}
              <Button
                variant="link"
                className="ml-1 h-auto p-0 text-red-700 underline"
                onClick={onRetry}
              >
                {t("common:actions.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* ── Loading State ────────────────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <CategoryCardSkeleton key={i} featured={i < 2} />
            ))}
          </div>
        )}

        {/* ── Empty State ──────────────────────────────────────────────── */}
        {!loading && !error && categories.length === 0 && (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-[#F0EBE1] mb-6">
              <FolderOpen
                className="h-10 w-10 text-[#C5A467]"
                aria-hidden="true"
              />
            </div>
            <p
              className="text-[#8B7355] text-lg"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {t("empty")}
            </p>
          </div>
        )}

        {/* ── Category Grid ────────────────────────────────────────────── */}
        {!loading && !error && categories.length > 0 && (
          <div
            className={cn(
              "grid grid-cols-1 sm:grid-cols-2 gap-6",
              categories.length > 4 && "lg:grid-cols-3"
            )}
          >
            {categories.map((cat) => {
              const imageSrc = cat.image
                ? cat.image.startsWith("http")
                  ? cat.image
                  : `${BASE_URL}${cat.image}`
                : null;

              return (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="group relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A467] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2] rounded-xl"
                >
                  <div className="relative overflow-hidden rounded-xl aspect-[16/10] bg-[#F0EBE1]">
                    {/* Image or Placeholder */}
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={cat.name}
                        fill
                        className={cn(
                          "object-contain transition-transform duration-700 ease-out",
                          "group-hover:scale-110"
                        )}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#F0EBE1] to-[#E2D9C8] flex items-center justify-center">
                        <FolderOpen
                          className="h-16 w-16 text-[#C5A467]/50"
                          aria-hidden="true"
                        />
                      </div>
                    )}

                    {/* Dark gradient overlay */}
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent",
                        "transition-all duration-500",
                        "group-hover:from-black/80 group-hover:via-black/35 group-hover:to-black/5"
                      )}
                    />

                    {/* Content overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
                      <h2
                        className="text-white font-semibold tracking-wide text-lg sm:text-xl"
                        style={{
                          fontFamily: "'Playfair Display', Georgia, serif",
                        }}
                      >
                        {cat.name}
                      </h2>

                      {cat.description && (
                        <p className="text-white/75 text-sm mt-1.5 line-clamp-2 max-w-[90%]">
                          {cat.description}
                        </p>
                      )}

                      {/* Explore CTA */}
                      <div className="flex items-center gap-1.5 mt-3">
                        <span className="text-[#C5A467] text-sm font-medium tracking-wide uppercase">
                          {t("catalog.explore")}
                        </span>
                        <ArrowRight
                          className={cn(
                            "h-4 w-4 text-[#C5A467]",
                            "transition-transform duration-500 ease-out",
                            "group-hover:translate-x-1.5"
                          )}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
