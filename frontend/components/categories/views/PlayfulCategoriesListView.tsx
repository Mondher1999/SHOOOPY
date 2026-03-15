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

/* ---------- accent palette ---------- */
const ACCENT_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#FFE66D",
  "#A78BFA",
  "#FF9F43",
  "#6C5CE7",
];

function accentFor(index: number) {
  return ACCENT_COLORS[index % ACCENT_COLORS.length];
}

/* ---------- loading skeleton ---------- */
function PlayfulSkeleton({ large }: { large?: boolean }) {
  return (
    <div className="rounded-3xl overflow-hidden bg-white/60 border-2 border-dashed border-orange-200">
      <Skeleton
        className={cn(
          "w-full bg-gradient-to-br from-[#FFECD2] to-[#FCB69F]/30",
          large ? "aspect-[16/10]" : "aspect-[4/3]"
        )}
      />
      <div className="absolute inset-x-0 bottom-0 p-5 space-y-2">
        <Skeleton className="h-5 w-3/5 rounded-full bg-orange-200/50" />
        <Skeleton className="h-3 w-2/5 rounded-full bg-orange-200/40" />
      </div>
    </div>
  );
}

/* ---------- main component ---------- */
export default function PlayfulCategoriesListView({
  categories,
  loading,
  error,
  onRetry,
}: CategoriesListViewProps) {
  const { t } = useTranslation("categories");

  return (
    <div className="w-full bg-[#FFFBF0] min-h-[60vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* -------- heading -------- */}
        <div className="text-center mb-12">
          {/* colorful rounded badge */}
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="inline-block h-3 w-3 rounded-full bg-[#FF6B6B] animate-bounce [animation-delay:0ms]" />
            <span className="inline-block h-3 w-3 rounded-full bg-[#4ECDC4] animate-bounce [animation-delay:150ms]" />
            <span className="inline-block h-3 w-3 rounded-full bg-[#FFE66D] animate-bounce [animation-delay:300ms]" />
          </div>

          <h1
            className={cn(
              "text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight",
              "bg-gradient-to-r from-[#FF6B6B] via-[#A78BFA] to-[#4ECDC4]",
              "bg-clip-text text-transparent",
              "rotate-[-1deg] inline-block"
            )}
          >
            {t("catalog.title")}
          </h1>

          <p className="mt-3 text-base sm:text-lg text-[#7A6F5B] max-w-xl mx-auto">
            {t("catalog.subtitle")}
          </p>

          {/* wavy underline decoration */}
          <svg
            className="mx-auto mt-4 w-32 h-3 text-[#FF6B6B]/50"
            viewBox="0 0 120 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 6C2 6 14 2 22 6C30 10 38 2 46 6C54 10 62 2 70 6C78 10 86 2 94 6C102 10 110 2 118 6"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* -------- error state -------- */}
        {error && (
          <Alert
            variant="destructive"
            className="mb-8 rounded-3xl border-2 border-red-200 bg-red-50/80"
          >
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
            <AlertDescription className="flex items-center gap-2 flex-wrap">
              <span>{error}</span>
              <Button
                variant="link"
                className="ml-1 h-auto p-0 text-red-600 font-semibold underline-offset-4"
                onClick={onRetry}
              >
                {t("common:actions.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* -------- loading state -------- */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="relative">
                <PlayfulSkeleton />
              </div>
            ))}
          </div>
        )}

        {/* -------- empty state -------- */}
        {!loading && !error && categories.length === 0 && (
          <div className="flex justify-center py-20">
            <div
              className={cn(
                "inline-flex flex-col items-center",
                "border-[3px] border-dashed border-[#FFE66D] rounded-3xl",
                "bg-white/50 backdrop-blur-sm px-14 py-12",
                "rotate-[1deg]"
              )}
            >
              <div className="relative mb-4">
                <div className="absolute -inset-3 rounded-full bg-[#FFE66D]/30 animate-ping" />
                <FolderOpen
                  className="h-14 w-14 text-[#FF9F43] relative"
                  aria-hidden="true"
                />
              </div>
              <p className="text-[#7A6F5B] font-semibold text-lg">
                {t("empty")}
              </p>
            </div>
          </div>
        )}

        {/* -------- success / category grid -------- */}
        {!loading && !error && categories.length > 0 && (
          <div
            className={cn(
              "grid grid-cols-1 sm:grid-cols-2 gap-6",
              categories.length > 4 && "lg:grid-cols-3"
            )}
          >
            {categories.map((cat, index) => {
              const accent = accentFor(index);
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
                    "group relative block rounded-3xl overflow-hidden",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF6B6B]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF0]",
                    "transition-transform duration-500 ease-out",
                    "hover:rotate-[0.5deg]",
                    "aspect-[16/10] bg-[#FFF5E8]"
                  )}
                >
                  {/* image or placeholder */}
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt={cat.name}
                      fill
                      className={cn(
                        "object-contain",
                        "transition-transform duration-700 ease-out",
                        "group-hover:scale-105"
                      )}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FFECD2] to-[#FCB69F] flex items-center justify-center">
                      <FolderOpen
                        className="h-16 w-16 text-white/60"
                        aria-hidden="true"
                      />
                    </div>
                  )}

                  {/* dark gradient overlay */}
                  <div
                    className={cn(
                      "absolute inset-0",
                      "bg-gradient-to-t from-black/70 via-black/20 to-transparent",
                      "transition-colors duration-500",
                      "group-hover:from-black/80 group-hover:via-black/30"
                    )}
                  />

                  {/* accent dot badge top-right */}
                  <div
                    className="absolute top-4 right-4 h-4 w-4 rounded-full shadow-lg transition-transform duration-300 group-hover:scale-125"
                    style={{ backgroundColor: accent }}
                    aria-hidden="true"
                  />

                  {/* content overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex flex-col justify-end">
                    <h2
                      className="text-white font-bold leading-tight text-lg sm:text-xl lg:text-2xl"
                    >
                      {cat.name}
                    </h2>

                    {cat.description && (
                      <p className="text-white/75 text-sm mt-1.5 line-clamp-2 max-w-md">
                        {cat.description}
                      </p>
                    )}

                    {/* explore CTA */}
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 mt-3",
                        "text-sm font-bold uppercase tracking-wider",
                        "transition-all duration-300",
                        "group-hover:gap-3"
                      )}
                      style={{ color: accent }}
                    >
                      {t("catalog.explore")}
                      <ArrowRight
                        className={cn(
                          "h-4 w-4 transition-transform duration-300",
                          "group-hover:translate-x-1"
                        )}
                        aria-hidden="true"
                      />
                    </span>
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
