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

/* ─── Skeleton ────────────────────────────────────────────────────────────── */

function CategoryCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-none bg-neutral-100">
      <Skeleton
        className={cn(
          "w-full rounded-none",
          featured ? "aspect-[16/10]" : "aspect-[4/3]"
        )}
      />
      <div className="absolute inset-x-0 bottom-0 p-5 space-y-2">
        <Skeleton className="h-5 w-2/3 rounded-none bg-neutral-300" />
        <Skeleton className="h-3 w-1/2 rounded-none bg-neutral-200" />
        <Skeleton className="h-3 w-24 rounded-none bg-neutral-200 mt-3" />
      </div>
    </div>
  );
}

/* ─── Main View ───────────────────────────────────────────────────────────── */

export default function MagazineCategoriesListView({
  categories,
  loading,
  error,
  onRetry,
}: CategoriesListViewProps) {
  const { t } = useTranslation("categories");

  return (
    <div className="w-full bg-white min-h-[60vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-black uppercase text-black tracking-tight leading-none border-b-[3px] border-black pb-4">
            {t("catalog.title")}
          </h1>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium">
            {t("catalog.subtitle")}
          </p>
        </div>

        {/* ── Error State ─────────────────────────────────────────────── */}
        {error && (
          <Alert
            variant="destructive"
            className="mb-8 rounded-none border-2 border-black bg-white"
          >
            <AlertCircle className="h-4 w-4 text-black" aria-hidden="true" />
            <AlertDescription className="text-black font-medium">
              {t("catalog.errorLoading")}
              <Button
                variant="link"
                className="ml-2 h-auto p-0 text-black underline underline-offset-4 hover:text-neutral-600 font-bold uppercase text-xs tracking-wider"
                onClick={onRetry}
              >
                {t("common:actions.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* ── Loading State ───────────────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-black">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white">
                <CategoryCardSkeleton featured={i < 2} />
              </div>
            ))}
          </div>
        )}

        {/* ── Empty State ─────────────────────────────────────────────── */}
        {!loading && !error && categories.length === 0 && (
          <div className="text-center py-24 border-2 border-black">
            <FolderOpen
              className="h-14 w-14 mx-auto mb-4 text-neutral-300"
              aria-hidden="true"
            />
            <p className="font-black uppercase text-neutral-400 tracking-[0.15em] text-sm">
              {t("empty")}
            </p>
          </div>
        )}

        {/* ── Success State ───────────────────────────────────────────── */}
        {!loading && !error && categories.length > 0 && (
          <div className={cn(
            "grid grid-cols-1 sm:grid-cols-2 gap-px bg-black",
            categories.length > 4 && "lg:grid-cols-3"
          )}>
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
                  className={cn(
                    "group relative block overflow-hidden rounded-none bg-white",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset"
                  )}
                >
                  {/* Image container */}
                  <div
                    className={cn(
                      "relative overflow-hidden",
                      "aspect-[16/10] bg-neutral-100"
                    )}
                  >
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={cat.name}
                        fill
                        className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
                        <FolderOpen
                          className="h-12 w-12 text-neutral-300"
                          aria-hidden="true"
                        />
                      </div>
                    )}

                    {/* Dark gradient overlay */}
                    <div
                      className={cn(
                        "absolute inset-0",
                        "bg-gradient-to-t from-black/80 via-black/30 to-transparent",
                        "transition-colors duration-500",
                        "group-hover:from-black/90 group-hover:via-black/40"
                      )}
                      aria-hidden="true"
                    />

                    {/* Overlaid text content */}
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex flex-col justify-end">
                      <h2
                        className={cn(
                          "font-black uppercase text-white tracking-wider leading-tight",
                          "text-lg sm:text-xl"
                        )}
                      >
                        {cat.name}
                      </h2>

                      {cat.description && (
                        <p className="mt-1.5 text-xs sm:text-sm text-white/70 line-clamp-2 leading-relaxed">
                          {cat.description}
                        </p>
                      )}

                      {/* Explore CTA */}
                      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-white/90 group-hover:text-white transition-colors duration-300">
                        {t("catalog.explore")}
                        <ArrowRight
                          className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5"
                          aria-hidden="true"
                        />
                      </span>
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
