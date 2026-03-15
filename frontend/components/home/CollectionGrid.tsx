"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useSettings } from "@/contexts/SettingsContext";
import type { Category } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
const ITEMS_PER_PAGE = 4;

export function CollectionGrid() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const sectionRef = useScrollReveal<HTMLElement>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const col = settings?.homepage?.collections;
  const title = col?.title || t("landing.collections.heading");
  const subtitle = t("landing.collections.subtitle", { defaultValue: "" });
  const limit = col?.limit || 8;
  const categoryIdsKey = (col?.categoryIds || []).join(",");
  const categoryIds = useMemo(() => col?.categoryIds || [], [categoryIdsKey]);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: Category[] }>("/api/categories")
      .then((res) => {
        let filtered: Category[];
        if (categoryIds.length > 0) {
          filtered = res.data.filter((c) => categoryIds.includes(c.id) && c.isActive);
        } else {
          filtered = res.data.filter((c) => !c.parent && c.isActive);
        }
        setCategories(filtered.slice(0, limit));
      })
      .catch(() => setCategories([]))
      .finally(() => setIsLoading(false));
  }, [limit, categoryIds]);

  const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
  const visibleCategories = categories.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
    },
    [totalPages]
  );

  return (
    <section
      ref={sectionRef}
      aria-labelledby="collections-heading"
      className="py-16 md:py-24 px-8 md:px-[100px] bg-white"
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Heading */}
        <div className="text-center mb-10">
          <h2
            id="collections-heading"
            className="reveal text-lg md:text-xl font-semibold text-gray-900 mb-1"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="reveal text-sm text-gray-400">{subtitle}</p>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="px-4 py-5 text-center space-y-3">
                  <Skeleton className="h-4 w-2/3 mx-auto" />
                  <Skeleton className="h-8 w-28 mx-auto rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-center text-sm text-gray-400">
            {t("landing.collections.empty")}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 reveal-stagger">
              {visibleCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="reveal group block rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors cursor-pointer"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    {cat.image ? (
                      <Image
                        src={
                          cat.image.startsWith("http")
                            ? cat.image
                            : `${BASE_URL}${cat.image}`
                        }
                        alt={cat.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100" />
                    )}
                  </div>
                  <div className="px-4 py-5 text-center bg-white">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 leading-tight">
                      {cat.name}
                    </h3>
                    <span className="inline-block bg-gray-900 text-white rounded-full px-6 py-2 text-xs font-medium group-hover:bg-gray-700 transition-colors">
                      {t("landing.collections.showMore", { defaultValue: "Show more" })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Carousel pagination */}
            {totalPages > 1 && (
              <div
                className="flex items-center justify-center gap-3 mt-12"
                role="tablist"
                aria-label={title}
              >
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-default cursor-pointer transition-colors"
                  aria-label={t("landing.hero.prevSlide")}
                >
                  <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToPage(idx)}
                      role="tab"
                      aria-selected={idx === currentPage}
                      aria-label={`${t("landing.hero.goToSlide")} ${idx + 1}`}
                      className={`rounded-full transition-all duration-300 cursor-pointer ${
                        idx === currentPage
                          ? "w-8 h-3 bg-gray-800"
                          : "w-3 h-3 bg-gray-300 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-default cursor-pointer transition-colors"
                  aria-label={t("landing.hero.nextSlide")}
                >
                  <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
