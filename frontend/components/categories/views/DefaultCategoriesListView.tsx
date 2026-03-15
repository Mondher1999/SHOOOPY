"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { FolderOpen, AlertCircle, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import type { CategoriesListViewProps } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function CategoryCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden",
        featured ? "aspect-[16/10]" : "aspect-[4/3]"
      )}
    >
      <Skeleton className="h-full w-full" />
    </div>
  );
}

export default function DefaultCategoriesListView({
  categories,
  loading,
  error,
  onRetry,
}: CategoriesListViewProps) {
  const { t } = useTranslation("categories");
  const theme = useActiveTheme();

  return (
    <div className={cn("w-full min-h-screen", theme.pageBg, theme.bodyClass)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Heading */}
        <div className="text-center mb-12">
          <h1
            className={cn(
              "text-3xl sm:text-4xl font-bold tracking-tight",
              theme.text,
              theme.headingClass
            )}
          >
            {t("catalog.title")}
          </h1>
          <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-4" />
          <p className={cn("mt-4 text-base max-w-md mx-auto", theme.textMuted)}>
            {t("catalog.subtitle")}
          </p>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              {error}
              <Button variant="link" className="ml-2 h-auto p-0" onClick={onRetry}>
                {t("common:actions.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <CategoryCardSkeleton key={i} featured={i < 2} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && categories.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FolderOpen
                className={cn("h-10 w-10", theme.textMuted)}
                aria-hidden="true"
              />
            </div>
            <p className={cn("text-lg font-medium", theme.textMuted)}>
              {t("empty")}
            </p>
          </div>
        )}

        {/* Category Grid */}
        {!loading && !error && categories.length > 0 && (
          <div
            className={cn(
              "grid grid-cols-1 sm:grid-cols-2 gap-6",
              categories.length > 4 && "lg:grid-cols-3"
            )}
          >
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className={cn(
                  "group relative rounded-2xl overflow-hidden cursor-pointer aspect-[16/10] bg-muted",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
              >
                {/* Image */}
                {cat.image ? (
                  <Image
                    src={
                      cat.image.startsWith("http")
                        ? cat.image
                        : `${BASE_URL}${cat.image}`
                    }
                    alt={cat.name}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <FolderOpen
                      className="h-16 w-16 text-primary/40"
                      aria-hidden="true"
                    />
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/80" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
                  <h2 className="text-white font-bold text-lg sm:text-xl leading-tight drop-shadow-sm">
                    {cat.name}
                  </h2>
                  {cat.description && (
                    <p className="text-white/75 text-sm mt-1.5 line-clamp-2 max-w-[90%]">
                      {cat.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-3 text-white/90 text-sm font-medium">
                    <span>{t("catalog.explore")}</span>
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
