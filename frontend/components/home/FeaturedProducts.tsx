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
import { useShowcase } from "@/hooks/useShowcase";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import type { Product, PaginationInfo } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
const ITEMS_PER_PAGE = 4;

const SORT_MAP: Record<string, string> = {
  newest: "newest",
  bestseller: "bestseller",
  rating: "rating",
};

export function FeaturedProducts() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const isShowcase = useShowcase();
  const formatPrice = useFormatPrice();
  const sectionRef = useScrollReveal<HTMLElement>();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const fp = settings?.homepage?.featuredProducts;
  const title = fp?.title || t("landing.featured.heading");
  const subtitle = t("landing.featured.subtitle", { defaultValue: "See What's Hot" });
  const mode = fp?.mode || "auto";
  const sortBy = fp?.sortBy || "newest";
  const limit = fp?.limit || 8;
  const productIdsKey = (fp?.productIds || []).join(",");
  const productIds = useMemo(() => fp?.productIds || [], [productIdsKey]);

  useEffect(() => {
    let url: string;
    if (mode === "manual" && productIds.length > 0) {
      url = `/api/products?ids=${productIds.join(",")}&limit=${productIds.length}`;
    } else {
      const sort = SORT_MAP[sortBy] || "newest";
      url = `/api/products?sort=${sort}&limit=${limit}`;
    }

    fetchAPI<{ success: boolean; data: { products: Product[]; pagination: PaginationInfo } }>(url)
      .then((res) => {
        setProducts(res.data.products);
        setCurrentPage(0);
      })
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
  }, [mode, sortBy, limit, productIds]);

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const visibleProducts = products.slice(
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
      aria-labelledby="featured-heading"
      className="py-16 md:py-24 px-8 md:px-[100px] bg-white"
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Header row */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2
              id="featured-heading"
              className="reveal text-base font-bold text-gray-900 leading-snug"
            >
              {title}
            </h2>
            <p className="reveal text-sm text-gray-400 mt-1">{subtitle}</p>
          </div>
          <Link
            href="/products"
            className="reveal text-sm text-gray-600 underline cursor-pointer hover:text-gray-900 transition-colors whitespace-nowrap ml-4 mt-0.5"
          >
            {t("landing.featured.viewAll")}
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="px-4 py-4 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-12">
            {t("landing.featured.empty")}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 reveal-stagger">
              {visibleProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="reveal group block rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors cursor-pointer"
                >
                  <div className="relative aspect-square bg-gray-50">
                    {product.images[0] ? (
                      <Image
                        src={`${BASE_URL}${product.images[0]?.medium}`}
                        alt={product.name}
                        fill
                        className="object-contain p-4"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100" />
                    )}
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium z-10">
                        {t("landing.featured.sale", { defaultValue: "Sale" })}
                      </span>
                    )}
                  </div>
                  <div className="px-4 pb-4 pt-3">
                    {!isShowcase && (
                      <p className="text-xs text-gray-500 mb-1">
                        {formatPrice(product.price)}
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="ml-2 line-through text-gray-400">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        )}
                      </p>
                    )}
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 leading-snug line-clamp-2">
                      {product.name}
                    </h3>
                    <button
                      type="button"
                      className="w-full border border-gray-300 rounded-full py-2 text-xs text-gray-700 hover:border-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                    >
                      {t("landing.featured.viewProduct", { defaultValue: "View product" })}
                    </button>
                  </div>
                </Link>
              ))}
            </div>

            {/* Carousel pagination */}
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
                {Array.from({ length: Math.max(totalPages, 2) }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => idx < totalPages && goToPage(idx)}
                    disabled={idx >= totalPages}
                    role="tab"
                    aria-selected={idx === currentPage}
                    aria-label={`${t("landing.hero.goToSlide")} ${idx + 1}`}
                    className={`rounded-full transition-all duration-300 cursor-pointer disabled:cursor-default ${
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
          </>
        )}
      </div>
    </section>
  );
}
