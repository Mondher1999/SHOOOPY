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

const serifFont = { fontFamily: "'Playfair Display', Georgia, serif" };

/* ─── Skeleton for loading state ──────────────────────────────────── */

function CategoryCardSkeleton({ large }: { large?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden border border-dashed border-[#C67B4A]/20 bg-white",
        large ? "aspect-[16/10]" : "aspect-[4/3]"
      )}
    >
      <Skeleton className="h-full w-full bg-[#F5E6D3]" />
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────── */

export default function ArtisanCategoriesListView({
  categories,
  loading,
  error,
  onRetry,
}: CategoriesListViewProps) {
  const { t } = useTranslation("categories");

  return (
    <div className="w-full bg-[#FFF8F0] min-h-[60vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* ── Heading ──────────────────────────────────────────── */}
        <div className="mb-10 sm:mb-12">
          <h1
            className="text-3xl sm:text-4xl font-semibold text-[#3D2E1F] tracking-tight"
            style={serifFont}
          >
            {t("catalog.title")}
          </h1>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-12 h-[3px] rounded-full bg-[#C67B4A]" />
            <div className="w-4 h-[3px] rounded-full bg-[#C67B4A]/40" />
          </div>
          <p className="mt-4 text-[#8B6F47] text-sm sm:text-base max-w-lg leading-relaxed">
            {t("catalog.subtitle")}
          </p>
        </div>

        {/* ── Error state ──────────────────────────────────────── */}
        {error && (
          <Alert
            variant="destructive"
            className="mb-8 rounded-xl border-dashed border-[#C67B4A]/30 bg-[#FFF0E0]"
          >
            <AlertCircle className="h-4 w-4 text-[#C67B4A]" aria-hidden="true" />
            <AlertDescription className="text-[#3D2E1F]">
              {t("catalog.errorLoading")}
              <Button
                variant="link"
                className="ml-2 h-auto p-0 text-[#C67B4A] hover:text-[#A5623A] underline-offset-4"
                onClick={onRetry}
              >
                {t("common:actions.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* ── Loading state ────────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <CategoryCardSkeleton key={i} large={i < 2} />
            ))}
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────── */}
        {!loading && !error && categories.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-dashed border-[#C67B4A]/30 bg-[#FFF0E0] mb-5">
              <FolderOpen
                className="h-9 w-9 text-[#C67B4A]/60"
                aria-hidden="true"
              />
            </div>
            <p
              className="text-lg text-[#8B6F47]"
              style={serifFont}
            >
              {t("empty")}
            </p>
          </div>
        )}

        {/* ── Success state ────────────────────────────────────── */}
        {!loading && !error && categories.length > 0 && (
          <div className={cn(
            "grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6",
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
                  className="group relative block rounded-xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C67B4A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFF8F0]"
                >
                  <div
                    className={cn(
                      "relative w-full overflow-hidden rounded-xl",
                      "aspect-[16/10] bg-[#F5E6D3]"
                    )}
                  >
                    {/* Background image or placeholder */}
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={cat.name}
                        fill
                        className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#F5E6D3] to-[#E8D5C0] flex items-center justify-center">
                        <FolderOpen
                          className="h-12 w-12 text-[#C67B4A]/40"
                          aria-hidden="true"
                        />
                      </div>
                    )}

                    {/* Dark gradient overlay */}
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent",
                        "transition-colors duration-500",
                        "group-hover:from-black/80 group-hover:via-black/35"
                      )}
                    />

                    {/* Content overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
                      <h2
                        className="text-white text-lg sm:text-xl font-semibold tracking-tight leading-snug drop-shadow-sm"
                        style={serifFont}
                      >
                        {cat.name}
                      </h2>

                      {cat.description && (
                        <p className="mt-1.5 text-white/75 text-xs sm:text-sm line-clamp-2 leading-relaxed max-w-md">
                          {cat.description}
                        </p>
                      )}

                      {/* Explore CTA */}
                      <div className="mt-3 flex items-center gap-1.5 text-[#C67B4A] group-hover:text-[#E8A87C] transition-colors duration-300">
                        <span
                          className="text-xs sm:text-sm font-medium uppercase tracking-wider"
                          style={serifFont}
                        >
                          {t("catalog.explore")}
                        </span>
                        <ArrowRight
                          className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
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
