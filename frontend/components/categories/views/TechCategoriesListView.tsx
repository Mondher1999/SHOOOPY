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

function TechSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-[#00FF88]/10 bg-[#0D0D14]",
        featured ? "aspect-[16/10]" : "aspect-[4/3]"
      )}
    >
      <Skeleton className="absolute inset-0 bg-[#12121C]" />
      <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3">
        <Skeleton className="h-5 w-3/5 bg-[#00FF88]/10" />
        <Skeleton className="h-3 w-4/5 bg-[#00FF88]/8" />
        <Skeleton className="h-3 w-2/5 bg-[#00FF88]/5" />
      </div>
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────────── */

export default function TechCategoriesListView({
  categories,
  loading,
  error,
  onRetry,
}: CategoriesListViewProps) {
  const { t } = useTranslation("categories");

  return (
    <div className="w-full min-h-screen bg-[#0A0A0F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        {/* ── Heading ──────────────────────────────────────────────────── */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="h-px w-8 bg-[#00FF88]/40" />
            <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#00FF88]/70">
              {"// "}{t("catalog.subtitle")}
            </span>
            <span className="h-px w-8 bg-[#00FF88]/40" />
          </div>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold text-white uppercase tracking-wider"
            style={{ textShadow: "0 0 40px rgba(0,255,136,0.25)" }}
          >
            {t("catalog.title")}
          </h1>
          <div className="mt-4 mx-auto h-0.5 w-16 bg-gradient-to-r from-transparent via-[#00FF88] to-transparent" />
        </div>

        {/* ── Error ────────────────────────────────────────────────────── */}
        {error && (
          <Alert
            variant="destructive"
            className="mb-8 bg-red-950/30 border-red-500/20 rounded-none"
          >
            <AlertCircle className="h-4 w-4 text-red-400" aria-hidden="true" />
            <AlertDescription className="text-red-300 font-mono text-sm flex items-center gap-2">
              {error}
              <Button
                variant="link"
                className="ml-1 h-auto p-0 text-[#00FF88] font-mono underline underline-offset-4"
                onClick={onRetry}
              >
                {t("common:actions.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* ── Loading ──────────────────────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <TechSkeleton key={i} featured={i < 2} />
            ))}
          </div>
        )}

        {/* ── Empty ────────────────────────────────────────────────────── */}
        {!loading && !error && categories.length === 0 && (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-none border border-[#00FF88]/15 bg-[#00FF88]/5 mb-5">
              <FolderOpen
                className="h-9 w-9 text-[#00FF88]/40"
                aria-hidden="true"
              />
            </div>
            <p className="text-gray-500 font-mono text-sm tracking-wide">
              {t("empty")}
            </p>
          </div>
        )}

        {/* ── Categories Grid ──────────────────────────────────────────── */}
        {!loading && !error && categories.length > 0 && (
          <div className={cn(
            "grid grid-cols-1 sm:grid-cols-2 gap-5",
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
                    "group relative block overflow-hidden rounded-none",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F]",
                    "border border-[#00FF88]/10",
                    "hover:border-[#00FF88]/50",
                    "transition-all duration-500",
                    "aspect-[16/10] bg-[#0D0D14]"
                  )}
                  style={{
                    boxShadow: "0 0 0 0 rgba(0,255,136,0)",
                    transition:
                      "border-color 0.5s, box-shadow 0.5s, transform 0.5s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 0 25px rgba(0,255,136,0.15), inset 0 0 25px rgba(0,255,136,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 0 0 0 rgba(0,255,136,0)";
                  }}
                >
                  {/* Background Image */}
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt={cat.name}
                      fill
                      className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0D0D14]">
                      <FolderOpen
                        className="h-14 w-14 text-[#00FF88]/15"
                        aria-hidden="true"
                      />
                    </div>
                  )}

                  {/* Dark Gradient Overlay */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/60 to-transparent"
                    aria-hidden="true"
                  />

                  {/* Scanline texture (subtle tech feel) */}
                  <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.15) 2px, rgba(0,255,136,0.15) 3px)",
                    }}
                    aria-hidden="true"
                  />

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 flex flex-col gap-2">
                    {/* Category Name */}
                    <h2
                      className="font-mono text-lg sm:text-xl font-bold text-white uppercase tracking-wide leading-tight"
                      style={{
                        textShadow: "0 2px 10px rgba(0,0,0,0.6)",
                      }}
                    >
                      {cat.name}
                    </h2>

                    {/* Description */}
                    {cat.description && (
                      <p className="text-gray-500 text-sm font-mono line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    )}

                    {/* Explore CTA */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[#00FF88] text-xs font-mono uppercase tracking-widest group-hover:text-[#33FF99] transition-colors duration-300">
                        {t("catalog.explore")}
                      </span>
                      <ArrowRight
                        className="h-3.5 w-3.5 text-[#00FF88] transition-all duration-300 group-hover:translate-x-1.5 group-hover:text-[#33FF99]"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  {/* Top-right corner accent */}
                  <div
                    className="absolute top-3 right-3 w-5 h-5 border-t border-r border-[#00FF88]/20 group-hover:border-[#00FF88]/50 transition-colors duration-500"
                    aria-hidden="true"
                  />

                  {/* Bottom-left corner accent */}
                  <div
                    className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-[#00FF88]/20 group-hover:border-[#00FF88]/50 transition-colors duration-500"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
