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

/* ── Skeleton ─────────────────────────────────────────────────────────────── */

function ZenSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden",
        featured ? "aspect-[16/10]" : "aspect-[4/3]"
      )}
    >
      <Skeleton className="h-full w-full bg-gray-50" />
    </div>
  );
}

/* ── Main view ────────────────────────────────────────────────────────────── */

export default function ZenCategoriesListView({
  categories,
  loading,
  error,
  onRetry,
}: CategoriesListViewProps) {
  const { t } = useTranslation("categories");

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* ── Heading ── */}
        <div className="text-center mb-16">
          <h1 className="text-xl font-extralight text-[#111] tracking-[0.25em] uppercase">
            {t("catalog.title")}
          </h1>

          {/* Minimal decorative line */}
          <div className="mx-auto mt-5 mb-4 w-8 border-t border-gray-200" />

          <p className="text-sm font-light text-gray-400 tracking-wide">
            {t("catalog.subtitle")}
          </p>
        </div>

        {/* ── Error state ── */}
        {error && (
          <Alert variant="destructive" className="mb-10 max-w-md mx-auto border-gray-200 bg-white">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription className="text-sm font-light">
              {error}
              <Button
                variant="link"
                className="ml-2 h-auto p-0 text-sm font-light underline"
                onClick={onRetry}
              >
                {t("common:actions.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* ── Loading state ── */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <ZenSkeleton key={i} featured={i < 2} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && categories.length === 0 && (
          <div className="text-center py-24">
            <FolderOpen
              className="h-12 w-12 mx-auto mb-5 text-gray-200 stroke-[1]"
              aria-hidden="true"
            />
            <p className="text-gray-400 font-light tracking-wide text-sm">
              {t("empty")}
            </p>
          </div>
        )}

        {/* ── Success state ── */}
        {!loading && !error && categories.length > 0 && (
          <div
            className={cn(
              "grid grid-cols-1 gap-6 sm:grid-cols-2",
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
                  className="group relative block rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2"
                >
                  {/* Image container */}
                  <div className="relative w-full overflow-hidden aspect-[16/10] bg-gray-50">
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={cat.name}
                        fill
                        className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
                        <FolderOpen
                          className="h-10 w-10 text-gray-200 stroke-[1]"
                          aria-hidden="true"
                        />
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent",
                        "transition-all duration-500 ease-out",
                        "group-hover:from-black/70 group-hover:via-black/30"
                      )}
                    />

                    {/* Text overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                      <h2 className="text-white font-light tracking-wide leading-snug text-lg sm:text-xl">
                        {cat.name}
                      </h2>

                      {cat.description && (
                        <p className="text-white/60 text-xs sm:text-sm font-light mt-1.5 line-clamp-2 leading-relaxed">
                          {cat.description}
                        </p>
                      )}

                      {/* Explore CTA */}
                      <div className="flex items-center gap-1.5 mt-4 text-white/80 group-hover:text-white transition-colors duration-300">
                        <span className="text-xs font-light tracking-[0.15em] uppercase">
                          {t("catalog.explore")}
                        </span>
                        <ArrowRight
                          className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1"
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
