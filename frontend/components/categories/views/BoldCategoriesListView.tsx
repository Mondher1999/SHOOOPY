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

function CategoryCardSkeleton() {
  return (
    <div className="bg-[#1A1A1A] border-2 border-[#2A2A2A] overflow-hidden">
      <Skeleton className="aspect-[16/10] w-full rounded-none bg-[#2A2A2A]" />
      <div className="p-5 sm:p-6 border-t-2 border-[#2A2A2A] space-y-2">
        <Skeleton className="h-5 w-2/3 rounded-none bg-[#2A2A2A]" />
        <Skeleton className="h-3 w-1/2 rounded-none bg-[#2A2A2A]" />
      </div>
    </div>
  );
}

export default function BoldCategoriesListView({
  categories,
  loading,
  error,
  onRetry,
}: CategoriesListViewProps) {
  const { t } = useTranslation("categories");

  return (
    <div className="bg-[#0F0F0F] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Heading */}
        <div className="mb-10 sm:mb-14 text-center">
          <div className="inline-block mb-3">
            <div className="h-1 w-16 bg-[#FF3C00] mx-auto" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-wider text-white">
            {t("catalog.title")}
          </h1>
          <p className="mt-3 text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
            {t("catalog.subtitle")}
          </p>
        </div>

        {/* Error */}
        {error && (
          <Alert
            variant="destructive"
            className="mb-8 max-w-lg mx-auto rounded-none border-red-700/50 bg-red-900/20"
          >
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription className="flex items-center gap-2 text-red-400">
              {t("catalog.errorLoading")}
              <Button
                variant="link"
                className="ml-1 h-auto p-0 text-[#FF3C00] underline"
                onClick={onRetry}
              >
                {t("common:actions.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[...Array(6)].map((_, i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && categories.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#FF3C00]/10 mb-5">
              <FolderOpen
                className="h-10 w-10 text-[#FF3C00]"
                aria-hidden="true"
              />
            </div>
            <p className="text-gray-500 text-lg uppercase tracking-wide">
              {t("empty")}
            </p>
          </div>
        )}

        {/* Category Grid */}
        {!loading && !error && categories.length > 0 && (
          <div
            className={cn(
              "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5",
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
                  className={cn(
                    "group block bg-[#1A1A1A] border-2 border-[#2A2A2A] overflow-hidden",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3C00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F0F]",
                    "transition-all duration-300",
                    "hover:border-[#FF3C00]/40 hover:shadow-[0_20px_60px_-12px_rgba(255,60,0,0.2)]"
                  )}
                >
                  {/* Contained Image */}
                  <div className="relative aspect-[16/10] bg-[#111111] overflow-hidden">
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={cat.name}
                        fill
                        className={cn(
                          "object-cover transition-transform duration-500 ease-out",
                          "group-hover:scale-105"
                        )}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FF3C00]/20 to-[#1A1A1A] flex items-center justify-center">
                        <FolderOpen
                          className="h-14 w-14 text-[#FF3C00]/30"
                          aria-hidden="true"
                        />
                      </div>
                    )}
                    {/* Orange top accent line */}
                    <div className="absolute top-0 left-0 w-0 h-0.5 bg-[#FF3C00] transition-all duration-500 group-hover:w-full" />
                  </div>

                  {/* Card content below image */}
                  <div className="p-5 sm:p-6 border-t-2 border-[#2A2A2A] group-hover:border-[#FF3C00]/30 transition-colors">
                    <h2 className="text-white font-extrabold uppercase tracking-wider leading-tight mb-1 text-lg sm:text-xl">
                      {cat.name}
                    </h2>

                    {cat.description && (
                      <p className="text-gray-400 text-sm line-clamp-2 mb-3 max-w-sm">
                        {cat.description}
                      </p>
                    )}

                    {/* CTA */}
                    <div className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest text-[#FF3C00] transition-colors duration-300">
                      <span>{t("catalog.explore")}</span>
                      <ArrowRight
                        className={cn(
                          "h-4 w-4 transition-transform duration-300",
                          "group-hover:translate-x-1.5"
                        )}
                        aria-hidden="true"
                      />
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
